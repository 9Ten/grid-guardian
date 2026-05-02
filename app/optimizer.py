from dataclasses import dataclass, field

import matplotlib.pyplot as plt
import numpy as np
import pyomo.environ as pyo
from pyomo.opt import TerminationCondition

# Default profiles used when the caller omits pv_forecast / tou_prices.
# Keys are 1-indexed (1..24) to match model.T_opt = RangeSet(1, 24).
# PV: 0 MW (Koh Tao does not have utility-scale PV in this scenario).
DEFAULT_PV = {t: 0.0 for t in range(1, 25)}
# Grid sale price flat 4,000 THB/MWh (= 4 บาท/หน่วย) per PEA tariff.
DEFAULT_TOU = {t: 4000.0 for t in range(1, 25)}

# Realistic Koh Tao load profile (MW), 24h × hour-of-day, peak ~10 MW evening.
# Tourism island pattern: low overnight, morning ramp, lunch dip, evening peak.
KOHTAO_LOAD = {
    1:  5.5,  2:  5.2,  3:  5.0,  4:  4.8,  5:  4.7,  6:  5.0,
    7:  6.0,  8:  7.2,  9:  8.0, 10:  8.5, 11:  8.8, 12:  9.0,
    13: 8.5, 14:  8.0, 15:  7.8, 16:  7.5, 17:  8.0, 18:  8.8,
    19: 9.5, 20:  9.8, 21: 10.0, 22:  9.5, 23:  7.5, 24:  6.5,
}


@dataclass
class MicrogridParams:
    """Microgrid parameters — defaults aligned with Koh Tao real specs.

    Diesel:        10 MW genset, fuel cost 13 THB/kWh
    Grid cable:    33 kV XLPE submarine, ~16 MW import capacity
    BESS:          50 MWh / 10 MW (C/5)
    Load:          5–10 MW (resort island)
    """
    # Diesel generator (MW)
    P_gen_min: float = 3.0          # Min stable load (30% of P_max)
    P_gen_max: float = 10.0         # Real Koh Tao diesel rating
    fuel_cost_var: float = 13000.0  # Variable fuel (THB/MWh) — 13 THB/kWh
    fuel_cost_noload: float = 8000.0  # No-load cost while online (THB/h)
    startup_cost: float = 30000.0   # Cost per cold start (THB)
    # BESS (MW / MWh)
    bess_capacity: float = 50.0     # Usable capacity (MWh)
    bess_p_max: float = 10.0        # Max charge/discharge power (MW)
    bess_eta: float = 0.95          # Round-trip efficiency
    bess_op_cost: float = 1500.0    # Throughput degradation cost (THB/MWh)
    soc_min: float = 0.10
    soc_max: float = 0.95
    soc_init: float = 0.50
    # Grid (33 kV XLPE submarine cable)
    p_grid_max: float = 16.0        # Cable thermal rating (MW)
    # Reliability
    shortage_penalty: float = 50000.0  # VOLL — Value of Lost Load (THB/MWh)
    reserve_margin: float = 0.15    # Min spinning reserve as fraction of load


@dataclass
class OptimizationResult:
    status: str
    feasible: bool
    total_cost: float = 0.0
    dispatch_rows: list = field(default_factory=list)


def build_microgrid_model(
    load_forecast: dict[int, float],
    pv_forecast: dict[int, float],
    tou_prices: dict[int, float],
    params: MicrogridParams,
    T: int = 24,
) -> pyo.ConcreteModel:
    """Build the Pyomo MILP.

    All power quantities are in MW; energy in MWh; prices in THB/MWh.
    dict keys are 1-indexed (1..T). Key 0 holds initial-state values only.
    """
    model = pyo.ConcreteModel()
    model.T     = pyo.RangeSet(0, T)
    model.T_opt = pyo.RangeSet(1, T)

    # ------------------------------------------------------------------
    # Decision variables
    # ------------------------------------------------------------------
    model.P_grid  = pyo.Var(model.T_opt, within=pyo.NonNegativeReals,
                            bounds=(0, params.p_grid_max))
    model.P_gen   = pyo.Var(model.T_opt, within=pyo.NonNegativeReals)
    model.u_gen   = pyo.Var(model.T,     within=pyo.Binary)
    model.v_start = pyo.Var(model.T_opt, within=pyo.Binary)
    model.P_ch    = pyo.Var(model.T_opt, within=pyo.NonNegativeReals)
    model.P_dis   = pyo.Var(model.T_opt, within=pyo.NonNegativeReals)
    model.u_ch    = pyo.Var(model.T_opt, within=pyo.Binary)
    model.u_dis   = pyo.Var(model.T_opt, within=pyo.Binary)
    model.SoC     = pyo.Var(model.T, within=pyo.Reals,
                            bounds=(params.soc_min, params.soc_max))
    # Load shedding (unserved energy) — penalised in objective
    model.P_shed  = pyo.Var(model.T_opt, within=pyo.NonNegativeReals)

    # Initial conditions (t=0 is the state just before the dispatch window)
    model.u_gen[0].fix(0)
    model.SoC[0].fix(params.soc_init)

    # ------------------------------------------------------------------
    # Constraints
    # ------------------------------------------------------------------
    def power_balance(m, t):
        # supply = P_DG + P_GRID + PV + P_dis + P_shed (shed acts as virtual supply)
        supply = m.P_grid[t] + m.P_gen[t] + pv_forecast[t] + m.P_dis[t] + m.P_shed[t]
        demand = load_forecast[t] + m.P_ch[t]
        return supply == demand
    model.power_balance = pyo.Constraint(model.T_opt, rule=power_balance)

    # Generation reserve margin — committed capacity ≥ (1 + R_min) × load
    # Available capacity = running diesel + cable + max BESS discharge
    def reserve_margin(m, t):
        committed = (params.P_gen_max * m.u_gen[t]
                     + params.p_grid_max
                     + params.bess_p_max)
        return committed >= (1.0 + params.reserve_margin) * load_forecast[t]
    model.reserve_margin = pyo.Constraint(model.T_opt, rule=reserve_margin)

    def gen_min(m, t):
        return m.P_gen[t] >= params.P_gen_min * m.u_gen[t]
    model.gen_min = pyo.Constraint(model.T_opt, rule=gen_min)

    def gen_max(m, t):
        return m.P_gen[t] <= params.P_gen_max * m.u_gen[t]
    model.gen_max = pyo.Constraint(model.T_opt, rule=gen_max)

    # v_start[t] = 1 iff generator transitions 0→1 at hour t
    def startup_logic(m, t):
        return m.v_start[t] >= m.u_gen[t] - m.u_gen[t - 1]
    model.startup_logic = pyo.Constraint(model.T_opt, rule=startup_logic)

    # BESS cannot charge and discharge simultaneously
    def bess_mutex(m, t):
        return m.u_ch[t] + m.u_dis[t] <= 1
    model.bess_mutex = pyo.Constraint(model.T_opt, rule=bess_mutex)

    def ch_limit(m, t):
        return m.P_ch[t] <= params.bess_p_max * m.u_ch[t]
    model.ch_limit = pyo.Constraint(model.T_opt, rule=ch_limit)

    def dis_limit(m, t):
        return m.P_dis[t] <= params.bess_p_max * m.u_dis[t]
    model.dis_limit = pyo.Constraint(model.T_opt, rule=dis_limit)

    # SoC(t) = SoC(t-1) + [charge×η - discharge/η] / capacity
    def soc_tracking(m, t):
        energy = m.P_ch[t] * params.bess_eta - m.P_dis[t] / params.bess_eta
        return m.SoC[t] == m.SoC[t - 1] + energy / params.bess_capacity
    model.soc_tracking = pyo.Constraint(model.T_opt, rule=soc_tracking)

    # ------------------------------------------------------------------
    # Objective — minimise C_DG + C_GRID + C_BESS + C_PENALTY  (THB)
    # ------------------------------------------------------------------
    def objective(m):
        return sum(
            # C_DG — diesel generator (variable + no-load + startup)
            m.P_gen[t] * params.fuel_cost_var
            + params.fuel_cost_noload * m.u_gen[t]
            + params.startup_cost * m.v_start[t]
            # C_GRID — grid import at TOU price
            + m.P_grid[t] * tou_prices[t]
            # C_BESS — battery throughput degradation cost
            + (m.P_ch[t] + m.P_dis[t]) * params.bess_op_cost
            # C_PENALTY — unserved energy (shortage)
            + m.P_shed[t] * params.shortage_penalty
            for t in m.T_opt
        )
    model.obj = pyo.Objective(rule=objective, sense=pyo.minimize)

    return model


def solve_microgrid(
    load_forecast: dict[int, float],
    pv_forecast: dict[int, float],
    tou_prices: dict[int, float],
    params: MicrogridParams,
) -> OptimizationResult:
    """Solve the microgrid dispatch MILP with HiGHS and return results."""
    model = build_microgrid_model(load_forecast, pv_forecast, tou_prices, params)

    solver = pyo.SolverFactory("appsi_highs")
    result = solver.solve(model, tee=False)
    tc = result.solver.termination_condition

    if tc not in (TerminationCondition.optimal, TerminationCondition.feasible):
        return OptimizationResult(status=str(tc), feasible=False)

    rows = []
    for t in range(1, 25):
        p_grid  = pyo.value(model.P_grid[t])
        p_gen   = pyo.value(model.P_gen[t])
        u_gen   = round(pyo.value(model.u_gen[t]))
        v_start = round(pyo.value(model.v_start[t]))
        p_ch    = pyo.value(model.P_ch[t])
        p_dis   = pyo.value(model.P_dis[t])
        p_shed  = pyo.value(model.P_shed[t])
        soc     = pyo.value(model.SoC[t])
        rows.append({
            "hour":        t - 1,
            "p_grid":      p_grid,
            "p_gen":       p_gen,
            "gen_online":  bool(u_gen),
            "gen_started": bool(v_start),
            "p_charge":    p_ch,
            "p_discharge": p_dis,
            "p_shed":      p_shed,
            "soc":         soc,
            "grid_cost":   p_grid * tou_prices[t],
            "gen_cost":    (p_gen * params.fuel_cost_var
                            + params.fuel_cost_noload * u_gen
                            + params.startup_cost * v_start),
            "bess_cost":   (p_ch + p_dis) * params.bess_op_cost,
            "shed_cost":   p_shed * params.shortage_penalty,
        })

    return OptimizationResult(
        status=str(tc),
        feasible=True,
        total_cost=pyo.value(model.obj),
        dispatch_rows=rows,
    )


# PEA Thailand brand colours
_PEA_PURPLE = "#5B2D8E"
_PEA_GOLD   = "#C8A014"
_PEA_WHITE  = "#FFFFFF"
_PEA_BG     = "#F5F0FB"  # very light purple tint for panel background

# Derived palette — all elements stay within the PEA identity
_PEA_PURPLE_MID  = "#7B4DAE"   # medium purple  — generator bars
_PEA_PURPLE_DARK = "#3A1D5E"   # dark purple    — BESS charge (demand)
_PEA_GOLD_LIGHT  = "#E8C84A"   # lighter gold   — BESS discharge
_PEA_GRID_LINE   = "#C9B8E8"   # soft purple    — grid lines


def plot_dispatch(
    result: OptimizationResult,
    load_forecast: dict[int, float],
    pv_forecast: dict[int, float],
    tou_prices: dict[int, float],
    title: str = "Microgrid Optimal Dispatch",
) -> plt.Figure:
    """Plot the optimized dispatch schedule across 3 panels (PEA brand theme).

    Panel 1 — TOU electricity price + load forecast (dual y-axis)
    Panel 2 — Power dispatch: grid, generator, PV, BESS charge/discharge
    Panel 3 — Battery state of charge
    """
    if not result.feasible or not result.dispatch_rows:
        raise ValueError(f"Cannot plot: solver status = {result.status}")

    hours = np.arange(24)
    rows  = result.dispatch_rows  # list of dicts, hour 0-indexed

    price   = [tou_prices[h + 1]     for h in hours]
    load_mw = [load_forecast[h + 1]  for h in hours]
    pv_mw   = [pv_forecast[h + 1]    for h in hours]
    p_grid  = [rows[h]["p_grid"]      for h in hours]
    p_gen   = [rows[h]["p_gen"]       for h in hours]
    p_ch    = [rows[h]["p_charge"]    for h in hours]
    p_dis   = [rows[h]["p_discharge"] for h in hours]
    p_shed  = [rows[h].get("p_shed", 0.0) for h in hours]
    soc_pct = [rows[h]["soc"] * 100   for h in hours]  # fraction → %

    # ------------------------------------------------------------------
    # Figure & axes setup
    # ------------------------------------------------------------------
    fig, axes = plt.subplots(3, 1, figsize=(12, 9), sharex=True,
                             facecolor=_PEA_WHITE)
    fig.suptitle(title, fontsize=14, fontweight="bold", color=_PEA_PURPLE)

    for ax in axes:
        ax.set_facecolor(_PEA_BG)
        ax.tick_params(colors=_PEA_PURPLE)
        ax.yaxis.label.set_color(_PEA_PURPLE)
        for spine in ax.spines.values():
            spine.set_edgecolor(_PEA_GRID_LINE)

    bar_w = 0.6

    def _grid(ax):
        ax.grid(True, linestyle="--", color=_PEA_GRID_LINE, alpha=0.7)

    # ------------------------------------------------------------------
    # Panel 1: TOU price (purple line) + Load forecast (gold dashed, right axis)
    # ------------------------------------------------------------------
    ax1 = axes[0]
    ax1.plot(hours, price, color=_PEA_PURPLE, linewidth=2,
             label="TOU Price (THB/MWh)")
    ax1.set_ylabel("Price (THB/MWh)")
    _grid(ax1)

    ax1r = ax1.twinx()
    ax1r.set_facecolor(_PEA_BG)
    ax1r.plot(hours, load_mw, color=_PEA_GOLD, linewidth=2,
              linestyle="--", label="Load Forecast (MW)")
    ax1r.set_ylabel("Load (MW)", color=_PEA_GOLD)
    ax1r.tick_params(axis="y", labelcolor=_PEA_GOLD)
    for spine in ax1r.spines.values():
        spine.set_edgecolor(_PEA_GRID_LINE)

    lines1, labels1 = ax1.get_legend_handles_labels()
    lines2, labels2 = ax1r.get_legend_handles_labels()
    ax1.legend(lines1 + lines2, labels1 + labels2,
               loc="upper left", fontsize=8,
               facecolor=_PEA_BG, edgecolor=_PEA_PURPLE, labelcolor=_PEA_PURPLE)

    # ------------------------------------------------------------------
    # Panel 2: Stacked supply bars (above 0) + BESS charge bar (below 0)
    # ------------------------------------------------------------------
    ax2 = axes[1]

    ax2.bar(hours, p_grid, bar_w,
            label="Grid Import (MW)", color=_PEA_PURPLE, alpha=0.85)
    ax2.bar(hours, p_gen, bar_w,
            label="Generator (MW)", color=_PEA_PURPLE_MID, alpha=0.85,
            bottom=p_grid)
    bottom_pv = [g + n for g, n in zip(p_grid, p_gen)]
    ax2.bar(hours, pv_mw, bar_w,
            label="PV (MW)", color=_PEA_GOLD, alpha=0.85,
            bottom=bottom_pv)
    bottom_dis = [b + pv for b, pv in zip(bottom_pv, pv_mw)]
    ax2.bar(hours, p_dis, bar_w,
            label="BESS Discharge (MW)", color=_PEA_GOLD_LIGHT, alpha=0.80,
            bottom=bottom_dis)

    ax2.bar(hours, [-v for v in p_ch], bar_w,
            label="BESS Charge (MW)", color=_PEA_PURPLE_DARK, alpha=0.75)

    # Load shedding (unserved energy) — only render if any hour > 0
    if any(v > 1e-6 for v in p_shed):
        bottom_shed = [b + pv + d for b, pv, d in zip(bottom_pv, pv_mw, p_dis)]
        ax2.bar(hours, p_shed, bar_w,
                label="Unserved (MW)", color="#C0392B", alpha=0.85,
                bottom=bottom_shed, hatch="///", edgecolor="white")

    ax2.plot(hours, load_mw, color=_PEA_GOLD, linewidth=1.8,
             linestyle="--", label="Load (MW)")

    ax2.axhline(0, color=_PEA_PURPLE, linewidth=0.9, alpha=0.6)
    ax2.set_ylabel("Power (MW)")
    ax2.legend(loc="upper right", fontsize=7, ncol=2,
               facecolor=_PEA_BG, edgecolor=_PEA_PURPLE, labelcolor=_PEA_PURPLE)
    _grid(ax2)

    # Generator ON marker (gold triangle) + startup label
    for h in hours:
        if rows[h]["gen_online"]:
            y_top = p_grid[h] + p_gen[h] + pv_mw[h] + p_dis[h]
            ax2.plot(h, y_top + 0.02, marker="^", color=_PEA_GOLD,
                     markersize=7, zorder=5)
        if rows[h]["gen_started"]:
            ax2.annotate("S", xy=(h, 0), xytext=(h, -0.05),
                         fontsize=6, color=_PEA_GOLD, ha="center",
                         fontweight="bold")

    # ------------------------------------------------------------------
    # Panel 3: State of Charge
    # ------------------------------------------------------------------
    ax3 = axes[2]
    ax3.fill_between(hours, soc_pct, alpha=0.20, color=_PEA_PURPLE)
    ax3.plot(hours, soc_pct, color=_PEA_PURPLE, linewidth=2, label="SoC (%)")

    # Shade SoC safety band (soc_min–soc_max converted to %)
    ax3.axhline(20, color=_PEA_GOLD, linewidth=1, linestyle=":",
                alpha=0.8, label="SoC min/max bounds")
    ax3.axhline(90, color=_PEA_GOLD, linewidth=1, linestyle=":", alpha=0.8)

    ax3.set_ylabel("SoC (%)")
    ax3.set_xlabel("Hour of Day", color=_PEA_PURPLE)
    ax3.xaxis.label.set_color(_PEA_PURPLE)
    ax3.set_ylim(0, 105)
    ax3.set_xticks(hours)
    ax3.legend(loc="lower right", fontsize=8,
               facecolor=_PEA_BG, edgecolor=_PEA_PURPLE, labelcolor=_PEA_PURPLE)
    _grid(ax3)

    # ------------------------------------------------------------------
    # Cost summary banner
    # ------------------------------------------------------------------
    total_grid_cost = sum(rows[h]["grid_cost"] for h in hours)
    total_gen_cost  = sum(rows[h]["gen_cost"]  for h in hours)
    cost_text = (
        f"Total Cost: {result.total_cost:,.0f} THB  │  "
        f"Grid: {total_grid_cost:,.0f}  │  Generator: {total_gen_cost:,.0f}"
    )
    fig.text(0.5, 0.01, cost_text, ha="center", fontsize=9,
             color=_PEA_PURPLE, fontweight="bold",
             bbox=dict(boxstyle="round,pad=0.35",
                       facecolor=_PEA_BG, edgecolor=_PEA_PURPLE, alpha=0.9))

    plt.tight_layout(rect=[0, 0.04, 1, 1])
    return fig


# ---------------------------------------------------------------------------
# Standalone test — run: uv run python optimizer.py
# ---------------------------------------------------------------------------

if __name__ == "__main__":

    def _run_scenario(
        name: str,
        load: dict,
        pv: dict,
        tou: dict,
        params: MicrogridParams,
        out_png: str,
    ) -> None:
        print(f"\n{'='*72}")
        print(f"  Scenario: {name}")
        print(f"{'='*72}")
        print(f"  Cable cap: {params.p_grid_max:5.1f} MW │"
              f" Diesel: {params.P_gen_max:4.1f} MW │"
              f" BESS: {params.bess_capacity:4.1f} MWh @ {params.bess_p_max:4.1f} MW")

        result = solve_microgrid(load, pv, tou, params)
        print(f"  Solver status : {result.status}")
        print(f"  Feasible      : {result.feasible}")

        if not result.feasible:
            print("  [SKIP] Infeasible — no dispatch table.\n")
            return

        # ----- aggregate cost breakdown -----
        rows = result.dispatch_rows
        c_dg   = sum(r["gen_cost"]  for r in rows)
        c_grid = sum(r["grid_cost"] for r in rows)
        c_bess = sum(r["bess_cost"] for r in rows)
        c_pen  = sum(r["shed_cost"] for r in rows)

        print(f"\n  Cost breakdown (THB):")
        print(f"    C_DG (diesel)     : {c_dg:>12,.0f}")
        print(f"    C_GRID (cable)    : {c_grid:>12,.0f}")
        print(f"    C_BESS (degrad.)  : {c_bess:>12,.0f}")
        print(f"    C_PENALTY (shed)  : {c_pen:>12,.0f}")
        print(f"    {'─'*40}")
        print(f"    TOTAL             : {result.total_cost:>12,.0f}")

        # ----- energy summary -----
        e_load  = sum(load[h + 1] for h in range(24))
        e_grid  = sum(r["p_grid"]      for r in rows)
        e_gen   = sum(r["p_gen"]       for r in rows)
        e_dis   = sum(r["p_discharge"] for r in rows)
        e_ch    = sum(r["p_charge"]    for r in rows)
        e_shed  = sum(r["p_shed"]      for r in rows)
        print(f"\n  Energy (MWh):")
        print(f"    Load served       : {e_load - e_shed:>8.2f} / {e_load:.2f}")
        print(f"    Grid import       : {e_grid:>8.2f}")
        print(f"    Diesel gen        : {e_gen:>8.2f}")
        print(f"    BESS discharge    : {e_dis:>8.2f}")
        print(f"    BESS charge       : {e_ch:>8.2f}")
        print(f"    Unserved (shed)   : {e_shed:>8.2f}")

        # ----- dispatch table -----
        print(f"\n  {'Hr':>3} │ {'Load':>5} │ {'Grid':>5} │ {'Gen':>5} │ {'On':>3} │"
              f" {'Ch':>5} │ {'Dis':>5} │ {'Shed':>5} │ {'SoC':>5}")
        print(f"  {'─'*3}─┼─{'─'*5}─┼─{'─'*5}─┼─{'─'*5}─┼─{'─'*3}─┼─"
              f"{'─'*5}─┼─{'─'*5}─┼─{'─'*5}─┼─{'─'*5}")
        for row in rows:
            h = row["hour"]
            print(f"  {h:3d} │ {load[h+1]:5.2f} │ {row['p_grid']:5.2f} │"
                  f" {row['p_gen']:5.2f} │ {('ON' if row['gen_online'] else '·'):>3} │"
                  f" {row['p_charge']:5.2f} │ {row['p_discharge']:5.2f} │"
                  f" {row['p_shed']:5.2f} │ {row['soc']:.3f}")

        # ----- power balance validation -----
        print("\n  Power balance check (tolerance 1e-4 MW):")
        all_ok = True
        for row in rows:
            h = row["hour"]
            supply = (row["p_grid"] + row["p_gen"] + pv[h + 1]
                      + row["p_discharge"] + row["p_shed"])
            demand = load[h + 1] + row["p_charge"]
            if abs(supply - demand) >= 1e-4:
                print(f"    [FAIL] Hour {h}: supply={supply:.6f}  demand={demand:.6f}")
                all_ok = False
        print(f"  {'  All 24 hours balanced ✓' if all_ok else '  Balance violations ✗'}")

        # ----- chart -----
        fig = plot_dispatch(result, load, pv, tou, title=f"Koh Tao — {name}")
        fig.savefig(out_png, dpi=150, bbox_inches="tight")
        plt.close(fig)
        print(f"  Chart saved → {out_png}")

    # ------------------------------------------------------------------
    # Scenario 1 — Normal operation
    # Cable healthy (16 MW), grid is cheapest @ 4 THB/kWh < diesel @ 13.
    # Expect: grid serves 100%, diesel & BESS idle (BESS degradation cost
    # discourages unnecessary cycling when arbitrage gain is zero).
    # ------------------------------------------------------------------
    _run_scenario(
        name="1. Normal — Cable healthy (16 MW)",
        load=KOHTAO_LOAD,
        pv=DEFAULT_PV,
        tou=DEFAULT_TOU,
        params=MicrogridParams(),
        out_png="outputs/optimization/kohtao_scenario1_normal.png",
    )

    # ------------------------------------------------------------------
    # Scenario 2 — Cable derate (N-1 contingency: 6 MW available)
    # Grid alone cannot meet 8–10 MW evening peak. Expect diesel commitment
    # during peak hours; BESS shifts cheap off-peak grid into peak window.
    # ------------------------------------------------------------------
    _run_scenario(
        name="2. Cable Derated — 6 MW (N-1 event)",
        load=KOHTAO_LOAD,
        pv=DEFAULT_PV,
        tou=DEFAULT_TOU,
        params=MicrogridParams(p_grid_max=6.0),
        out_png="outputs/optimization/kohtao_scenario2_derated.png",
    )

    # ------------------------------------------------------------------
    # Scenario 3 — Island mode (cable failure, 0 MW grid)
    # Diesel + BESS only. 50 MWh BESS @ 10 MW can sustain ~5h of peak.
    # Reserve margin tightens; expect diesel running most of the day.
    # ------------------------------------------------------------------
    _run_scenario(
        name="3. Island Mode — Cable failure (0 MW)",
        load=KOHTAO_LOAD,
        pv=DEFAULT_PV,
        tou=DEFAULT_TOU,
        params=MicrogridParams(p_grid_max=0.0),
        out_png="outputs/optimization/kohtao_scenario3_island.png",
    )

    print(f"\n{'='*72}")
    print("  All Koh Tao scenarios complete.")
    print(f"{'='*72}\n")
