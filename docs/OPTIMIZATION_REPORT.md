# Grid Guardian — Microgrid Dispatch Optimization Report

**Case Study: Koh Tao Island (เกาะเต่า)**
Date: 2026-05-03

---

## 1. Executive Summary

Grid Guardian pairs a 24-hour load forecasting service (AutoGluon WeightedEnsemble) with a **Mixed-Integer Linear Program (MILP)** that produces an optimal hourly dispatch schedule for a resort-island microgrid. Five operating scenarios were evaluated across horizons of 24 hours (Scenarios 1–4) and 120 hours / 5 days (Scenario 5).

| Scenario | Horizon | Cable | Total Cost (THB) | Diesel (MWh) | Load Shed |
|---|:---:|:---:|---:|---:|:---:|
| 1. Normal operation | 24 h | 16 MW | 716,400 | 0 | 0 |
| 2. N-1 Cable derated | 24 h | 6 MW | 1,198,248 | 36.2 | 0 |
| 3. Island mode | 24 h | 0 MW | 2,550,300 | 179.1 | 0 |
| 4. Perfect Storm (PV + bottleneck) | 24 h | 4–12 MW dynamic | 1,287,324 | 23.3 | 0 |
| 5. Historical Stress Test Mar 27–31 | 120 h | 4–12 MW dynamic | 7,882,097 | 272.5 | 0 |

**Daily reliability value of the 33 kV cable** (Normal vs Island): **~1.83 M THB/day**.
No load shedding occurred in any scenario.

---

## 2. System Architecture

```
┌─────────────────────┐     ┌──────────────────────┐     ┌─────────────────────┐
│  Historical hourly  │     │   Load Forecaster    │     │  Pyomo MILP         │
│  observations       │ ──▶ │ AutoGluon ensemble   │ ──▶ │  (HiGHS solver)     │
│  (≥ 24 points, MW)  │     │ Chronos2 + ARIMA +   │     │                     │
└─────────────────────┘     │ XGBoost + Wgt.Ens.   │     │  • Unit commitment  │
                            └──────────────────────┘     │  • Storage tracking │
                                       │                 │  • Reserve margin   │
                            24-h load  │ forecast        └──────────┬──────────┘
                                       ▼                            │
                            ┌──────────────────────┐                ▼
                            │   FastAPI            │     ┌─────────────────────┐
                            │  POST /forecast      │ ◀── │  Optimal Dispatch   │
                            │  POST /optimize      │     │  Schedule + Costs   │
                            └──────────────────────┘     └─────────────────────┘
```

| File | Role |
|---|---|
| `app/optimizer.py` | Pyomo model builder, HiGHS solver wrapper, PEA-themed visualization |
| `app/main.py` | FastAPI endpoints (`/forecast`, `/optimize`, `/forecast/batch`) |
| `training/section_a_ensemble.py` | Trains the WeightedEnsemble forecaster |
| `training/section_b_stacking.py` | Trains nonlinear stacked ensemble |

---

## 3. Mathematical Formulation

### 3.1 Decision Variables

Most variables are indexed on `model.T_opt = RangeSet(1, T)`. Two exceptions cover t=0 as well (`model.T = RangeSet(0, T)`) to carry initial-state information into the model. T is inferred from `len(load_forecast)`, enabling any multi-day horizon without changing the function signature.

| Variable | Index set | Domain | Meaning |
|---|:---:|---|---|
| `P_grid[t]` | 1..T | ℝ⁺ | Grid import (MW) |
| `P_gen[t]` | 1..T | ℝ⁺ | Diesel output (MW) |
| `u_gen[t]` | **0..T** | {0,1} | Diesel commitment — t=0 fixed to 0 (offline before horizon) |
| `v_start[t]` | 1..T | {0,1} | Diesel start-up event |
| `P_ch[t]`, `P_dis[t]` | 1..T | ℝ⁺ | BESS charge / discharge (MW) |
| `u_ch[t]`, `u_dis[t]` | 1..T | {0,1} | Charge / discharge mutex flags |
| `SoC[t]` | **0..T** | [0.10, 0.95] | Battery state-of-charge — t=0 fixed to `soc_init = 0.50`; bounds enforced via Var declaration for t=1..T |
| `P_shed[t]` | 1..T | ℝ⁺ | Unserved energy — penalised (MW) |

### 3.2 Objective

```
min  Σₜ [ P_gen·fuel_var + fuel_noload·u_gen + startup_cost·v_start   (C_DG)
         + P_grid·TOU                                                   (C_GRID)
         + (P_ch + P_dis)·bess_op_cost                                 (C_BESS)
         + P_shed·VOLL ]                                                (C_PENALTY)
```

### 3.3 Constraints

| # | Constraint | Expression |
|---|---|---|
| 1 | Power balance | `P_grid + P_gen + P_PV + P_dis + P_shed = Load + P_ch` |
| 2 | Dynamic grid cap | `0 ≤ P_grid[t] ≤ grid_limit[t]` *(per-hour vector)* |
| 3 | Reserve margin | `P_gen_max·u_gen + grid_limit[t] + bess_p_max ≥ (1+R_min)·Load[t]` |
| 4 | Generator limits | `P_gen_min·u_gen ≤ P_gen ≤ P_gen_max·u_gen` |
| 5 | Start-up logic | `v_start[t] ≥ u_gen[t] − u_gen[t-1]` |
| 6 | BESS mutex | `u_ch + u_dis ≤ 1` |
| 7 | BESS power | `P_ch ≤ P_max·u_ch`, `P_dis ≤ P_max·u_dis` |
| 8 | SoC tracking | `SoC[t] = SoC[t-1] + (P_ch·η − P_dis/η) / capacity` |
| 9 | Terminal SoC | `SoC[T] ≥ SoC[0]` — `SoC[0]` is fixed to `soc_init = 0.50`, so the effective bound is `SoC[T] ≥ 0.50` *(closed-cycle enforcement)* |

### 3.4 Default Parameters (Koh Tao)

| Group | Parameter | Value |
|---|---|---|
| Diesel | P_gen_max / P_gen_min | 10.0 / 3.0 MW |
| Diesel | fuel_cost_var / noload / startup | 13,000 THB/MWh / 8,000 THB/h / 30,000 THB |
| BESS | capacity / P_max / η | 50 MWh / 10 MW / 0.95 |
| BESS | op_cost / SoC bounds | 1,500 THB/MWh / [0.10, 0.50, 0.95] |
| Grid | p_grid_max / TOU | 16 MW (cable thermal rating) / 4,000 THB/MWh — `p_grid_max` is the fallback when no per-hour `grid_limit` vector is supplied; all 5 scenarios pass explicit vectors |
| Reliability | VOLL / R_min | 50,000 THB/MWh / 0.15 |
| Diesel | SFC (fuel reporting) | 270 L/MWh (0.27 L/kWh) — marine genset estimate, used to compute cumulative fuel consumption |

---

## 4. Scenario Results

### Scenario 1 — Normal Operation

**Setup:** Load 5–10 MW · Grid 16 MW (full capacity) · No PV

| Cost item | THB | Energy | MWh |
|---|---:|---|---:|
| C_GRID | 716,400 | Grid import | 179.1 |
| C_DG / C_BESS / C_PENALTY | 0 | Diesel / BESS dis / Shed | 0 / 0 / 0 |
| **TOTAL** | **716,400** | Load served | 179.1 |

**Behaviour:** Grid (4 THB/kWh) is cheaper than diesel (13 THB/kWh) so it serves 100% of load. Diesel never starts. BESS stays idle because the degradation cost (1,500 THB/MWh) exceeds any intraday arbitrage gain when the grid has full headroom — the optimizer has no economic incentive to cycle it. The terminal SoC constraint prevents end-of-day drain below 50%.

---

### Scenario 2 — N-1 Cable Derated (6 MW)

**Setup:** Load 5–10 MW · Grid capped at 6 MW · No PV

| Cost item | THB | Energy | MWh |
|---|---:|---|---:|
| C_GRID | 576,000 | Grid import | 144.0 |
| C_DG | 589,047 | Diesel gen | 36.2 |
| C_BESS | 33,202 | BESS dis / ch | 10.5 / 11.6 |
| **TOTAL** | **1,198,248** | Load served | 179.1 |

**Behaviour:** Off-peak hours (00:00–05:00) the cable saturates at 6 MW, charging BESS with cheap grid energy. Evening peak (11:00–21:00) diesel commits at min stable load (3 MW) while BESS discharges to fill the gap. Classic **peak-shaving arbitrage**.

---

### Scenario 3 — Island Mode (Cable failure)

**Setup:** Load 5–10 MW · Grid 0 MW · No PV

| Cost item | THB | Energy | MWh |
|---|---:|---|---:|
| C_DG | 2,550,300 | Diesel gen | 179.1 |
| C_GRID / C_BESS / C_PENALTY | 0 | Grid / BESS dis / Shed | 0 / 0 / 0 |
| **TOTAL** | **2,550,300** | Load served | 179.1 |

**Behaviour:** Diesel runs continuously at exact load-following output. BESS SoC remains flat at 50% (terminal SoC enforced). The 10 MW diesel + 10 MW BESS = 20 MW capacity clears the 15% reserve constraint at all hours. No load shed.

---

### Scenario 4 — Perfect Storm (High Season + 18–22h Bottleneck)

**Setup:** Load 8–14.5 MW · Grid 12 MW daytime / 4 MW at 18–22h · PV bell 4 MW peak at noon

| Cost item | THB | Energy | MWh |
|---|---:|---|---:|
| C_GRID | 835,846 | Grid import | 209.0 |
| C_DG | 373,313 | Diesel gen | 23.3 |
| C_BESS | 78,165 | PV yield / BESS dis / ch | 30.1 / 24.7 / 27.4 |
| **TOTAL** | **1,287,324** | Load served | 259.7 |

**Behaviour:** Morning grid + noon PV charge BESS to 95% SoC. At 17:00 grid drops to 4 MW — diesel commits (1 startup). BESS discharges 4–7 MW through 18:00–21:00 bottleneck. Grid recovers at 22:00 and BESS recharges to meet the terminal SoC floor.

---

### Scenario 5 — Historical Stress Test (Mar 27–31, 2026)

**Setup:** 120-hour horizon · Load 7–14 MW (high season) · Grid 12 MW at 08–16h / 4 MW at 17–07h · PV bell 5 MW peak at noon, zero after 18h · All three profiles generated by tiling a 24-hour template 5× via `_tile_daily()`

| Cost item | THB | Energy | MWh |
|---|---:|---|---:|
| C_GRID | 3,360,000 | Grid import | 840.0 |
| C_DG | 3,995,001 | Diesel gen | 272.5 |
| C_BESS | 527,095 | PV yield | 156.0 |
| **TOTAL** | **7,882,097** | BESS dis / ch | 166.7 / 184.7 |
| | | Load served / shed | 1,250.5 / **0** |

**Cumulative fuel:** ~73,585 L at 270 L/MWh. **BESS equivalent cycles:** 3.51 over 5 days.

| Day | Load (MWh) | Grid | Diesel | PV | BESS Dis | Daily Cost | SoC EoD |
|:---:|---:|---:|---:|---:|---:|---:|:---:|
| Mar 27 | 250.1 | 168.0 | 65.1 | 31.2 | 22.7 | 1,740,298 | 72% |
| Mar 28 | 250.1 | 168.0 | 54.7 | 31.2 | 33.1 | 1,574,421 | 73% |
| Mar 29 | 250.1 | 168.0 | 57.1 | 31.2 | 30.7 | 1,602,321 | 78% |
| Mar 30 | 250.1 | 168.0 | 51.0 | 31.2 | 36.8 | 1,523,903 | 71% |
| Mar 31 | 250.1 | 168.0 | 44.5 | 31.2 | 43.3 | 1,441,153 | 50% |

**Behaviour:** Optimizer maintains BESS SoC at 71–78% at each day-end to protect subsequent days. Diesel load decreases day-over-day (65 → 44 MWh) as the optimizer learns to rely more heavily on BESS discharge (23 → 43 MWh/day). Terminal SoC returns to exactly 50% on Day 5.

---

## 5. Key Takeaways

1. **Cable reliability value: ~1.83 M THB/day** — the gap between Scenario 1 and 3 (Normal vs Island). Over a year that is ~667 M THB of avoided diesel cost.

2. **Terminal SoC constraint is essential** — without enforcing `SoC[T] ≥ SoC[0]`, the optimizer drains the battery for "free" energy and produces an artificially cheap but operationally unsustainable dispatch.

3. **Dynamic grid cap changes the economic picture** — a static scalar grid limit cannot model mainland peak-hour bottlenecks. The per-hour `grid_limit[t]` vector is necessary for Scenarios 4 and 5 to reflect reality.

4. **PV shifts the optimal commit window for diesel** — in Scenario 4, solar energy charges the BESS through the day so diesel only starts at 17:00 (1 startup, 23.3 MWh) rather than running through the full peak.

5. **5-day BESS SoC management is non-trivial** — the optimizer correctly avoids draining the battery on Day 1 (SoC 72% at midnight) to protect Days 2–5. Naive greedy dispatch would collapse SoC on Day 2.

6. **HiGHS solves all scenarios in under 5 seconds** — including the 120-hour MILP (120 periods × ~12 variables ≈ 1,440 decision variables). No commercial solver required.

---

## 6. Reproducing the Results

```bash
# Install dependencies (includes HiGHS via highspy)
uv sync

# Run all 5 Koh Tao scenarios
uv run python app/optimizer.py

# Start the API (requires trained AutoGluon model)
uv run uvicorn app.main:app --reload --port 8000
# POST http://localhost:8000/optimize
```

Charts are written to `outputs/optimization/`:

| File | Scenario |
|---|---|
| `kohtao_scenario1_normal.png` | Normal operation |
| `kohtao_scenario2_derated.png` | N-1 cable derated |
| `kohtao_scenario3_island.png` | Island mode |
| `kohtao_scenario4_perfect_storm.png` | Perfect Storm |
| `kohtao_scenario5_stress_test.png` | 5-day historical stress test |

---

## 7. Future Work

| Idea | Why it matters |
|---|---|
| Stochastic optimization across forecast quantiles | Size reserves under forecast uncertainty using WeightedEnsemble 0.1/0.9 intervals |
| Rolling 24h horizon with warm-start SoC | More realistic for live dispatch; re-solve each hour with updated measurements |
| EV charging as flexible load | Tourist EV demand is growing; treat as time-shiftable demand |
| Detailed cable thermal de-rating | The 33 kV XLPE rating drops in tropical ambient; model seasonal headroom reduction |
| Multi-objective: cost vs. emissions | Add diesel CO₂ penalty term to push optimizer toward PV + BESS earlier |

---

## Configurable optimizer

```
┌─────────────────────────────────────────────┐
│                   INPUTS                    │
│  • Load forecast      (MW per hour)         │
│  • PV forecast        (MW per hour)         │
│  • TOU prices         (THB/MWh per hour)    │
│  • MicrogridParams    (diesel/BESS/grid)    │
│  • Grid limit         (MW per hour, opt.)   │
└──────────────────────┬──────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────┐
│           BUILD MICROGRID MODEL             │
│                                             │
│  ① Variables  (per hour)                   │
│     P_grid  · P_gen  · u_gen  · v_start    │
│     P_ch    · P_dis  · u_ch   · u_dis      │
│     SoC     · P_shed                       │
│                           │                 │
│  ② Initial State  (t=0)  │                 │
│     Generator = OFF       │                 │
│     SoC       = 50%       │                 │
│                           │                 │
│  ③ Constraints            │                 │
│     • Power balance: supply = demand        │
│     • Grid ≤ cable limit                   │
│     • Reserve ≥ 1.15 × load               │
│     • Diesel min/max + startup logic        │
│     • BESS mutex + SoC dynamics            │
│     • Terminal SoC ≥ initial               │
│                           │                 │
│  ④ Objective — minimise Σ cost (THB)       │
│     C_DG + C_GRID + C_BESS + C_PENALTY     │
└──────────────────────┬──────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────┐
│           SOLVE  (HiGHS MILP)               │
└──────────────────────┬──────────────────────┘
                       │
               ┌───────┴───────┐
           Feasible?           │
               │               │
              Yes              No
               │               │
               ▼               ▼
  ┌────────────────────┐  ┌──────────────────┐
  │ ✓ OptimizationResult│  │ ✗ OptimizationResult│
  │   feasible = True  │  │   feasible = False│
  │   total_cost       │  └──────────────────┘
  │   dispatch_rows    │
  │   (24 × per-hour)  │
  └────────────────────┘
```

*Implementation: [app/optimizer.py](../app/optimizer.py) · API: [app/main.py](../app/main.py)*
