import warnings

warnings.filterwarnings("ignore")

import pandas as pd
import matplotlib.pyplot as plt
from autogluon.timeseries import TimeSeriesDataFrame, TimeSeriesPredictor


# =============================================================================
# SECTION B: Multi-Layer Stacking
# Layer 0: Base models (AutoARIMA, Chronos2, RecursiveTabular/XGB)
# Layer 1: WeightedEnsemble (size=10) blends base model predictions
# Layer 2: Second WeightedEnsemble acts as meta-learner on Layer 1 output
# =============================================================================

print("=" * 60)
print("SECTION B: Multi-Layer Stacking")
print("=" * 60)

# --- Load & resample data (same as Section A) ---
data_raw = TimeSeriesDataFrame.from_path(
    "https://autogluon.s3.amazonaws.com/datasets/timeseries/australian_electricity_subset/test.csv"
)
data = TimeSeriesDataFrame.from_data_frame(
    data_raw.reset_index()
    .groupby("item_id", group_keys=False)
    .apply(
        lambda g: g.set_index("timestamp")
        .resample("1h")
        .mean()
        .reset_index()
        .assign(item_id=g.name)
    )
    .reset_index(drop=True),
    id_column="item_id",
    timestamp_column="timestamp",
)
print(f"Shape: {data.shape}")
print(f"Item IDs: {data.item_ids.tolist()}")

num_test_windows = 3
prediction_length = 24  # 24 hourly steps = 1 day ahead

train_data, test_data = data.train_test_split(num_test_windows * prediction_length)
print(f"\nTrain: {train_data.shape}, Test: {test_data.shape}")

# --- Fit stacked predictor ---
predictor_b = TimeSeriesPredictor(
    prediction_length=prediction_length,
    eval_metric="MAPE",
).fit(
    train_data,
    # Layer 0: Base models
    hyperparameters={
        "AutoARIMA": {"stationary": True},
        "Chronos2": {},  # zero-shot pretrained transformer
        "RecursiveTabular": {
            "model_name": "XGB",
            "lags": [1, 2, 3, 6, 12, 24, 48, 168],
            "model_hyperparameters": {
                "n_estimators": 500,
            },
        },
    },
    # --- Nonlinear Ensemble Stack ---
    # TabularEnsemble: learns nonlinear blending weights using a single
    #   GBM (LightGBM) model across all quantiles — strongest nonlinear option
    # PerQuantileTabularEnsemble: fits a separate GBM per quantile level,
    #   giving the most expressive per-quantile blending
    # Both outperform linear GreedyEnsemble when base models have
    # complementary strengths at different demand regimes
    ensemble_hyperparameters={
        "TabularEnsemble": {
            "model_name": "GBM",             # LightGBM meta-learner
            "model_hyperparameters": {
                "num_leaves": 31,
                "n_estimators": 200,
            },
        },
        "PerQuantileTabularEnsemble": {
            "model_name": "GBM",             # separate GBM per quantile
            "model_hyperparameters": {},
        },
    },
    num_val_windows=3,
    enable_ensemble=True,
    time_limit=3600,
)

print("\nRegistered models:", predictor_b.model_names())

leaderboard_b = predictor_b.leaderboard(test_data)
print("\nLeaderboard (stacked):")
print(leaderboard_b.to_string(index=False))

# =============================================================================
# Plot: Stacked ensemble vs base models vs observed
# =============================================================================

HISTORY_HOURS = 120

# PEA Thailand brand colours
PEA_PURPLE = "#5B2D8E"
PEA_GOLD = "#C8A014"
PEA_WHITE = "#FFFFFF"
PEA_BG = "#F5F0FB"

plt.rcParams.update(
    {
        "font.family": "DejaVu Sans",
        "axes.facecolor": PEA_BG,
        "figure.facecolor": PEA_WHITE,
        "axes.edgecolor": PEA_PURPLE,
        "axes.labelcolor": PEA_PURPLE,
        "xtick.color": PEA_PURPLE,
        "ytick.color": PEA_PURPLE,
        "axes.titlecolor": PEA_PURPLE,
        "axes.spines.top": False,
        "axes.spines.right": False,
        "grid.color": PEA_PURPLE,
        "grid.alpha": 0.15,
        "grid.linestyle": "--",
    }
)

item_id_b = data.item_ids[0]
all_obs_b = test_data.loc[item_id_b]["target"]
series_end_b = all_obs_b.index[-1]
plot_start_b = series_end_b - pd.Timedelta(hours=HISTORY_HOURS)
window_obs_b = all_obs_b[all_obs_b.index >= plot_start_b]

base_colors = {
    "Chronos2": "#1f77b4",
    "AutoARIMA": "#2ca02c",
    "RecursiveTabular": "#d62728",
}

fig, ax = plt.subplots(figsize=(14, 5))
ax.set_facecolor(PEA_BG)
ax.grid(True, color=PEA_PURPLE, alpha=0.15, linestyle="--")
for spine in ["top", "right"]:
    ax.spines[spine].set_visible(False)
for spine in ["left", "bottom"]:
    ax.spines[spine].set_color(PEA_PURPLE)

# Observed
ax.plot(
    window_obs_b.index,
    window_obs_b.values,
    color=PEA_PURPLE,
    linewidth=1.5,
    label="Observed",
    zorder=5,
)

# Base model forecasts (thin dotted lines)
for base_model, color in base_colors.items():
    if base_model not in predictor_b.model_names():
        continue
    bp = pd.concat(
        predictor_b.backtest_predictions(
            test_data,
            num_val_windows=num_test_windows,
            model=base_model,
        )
    )
    if item_id_b in bp.index.get_level_values(0):
        bp_item = bp.loc[item_id_b]
        bp_item = bp_item[bp_item.index >= plot_start_b]
        if not bp_item.empty:
            ax.plot(
                bp_item.index,
                bp_item["mean"],
                color=color,
                linewidth=1,
                linestyle=":",
                alpha=0.7,
                label=base_model,
                zorder=3,
            )

# Best nonlinear ensemble forecast (bold gold) — pick whichever scored highest
nonlinear_candidates = ["PerQuantileTabularEnsemble", "TabularEnsemble", "WeightedEnsemble"]
stack_model = next((m for m in nonlinear_candidates if m in predictor_b.model_names()), None)
print(f"\nUsing ensemble model for plot: {stack_model}")
if stack_model is not None:
    sp = pd.concat(
        predictor_b.backtest_predictions(
            test_data,
            num_val_windows=num_test_windows,
            model=stack_model,
        )
    )
    if item_id_b in sp.index.get_level_values(0):
        sp_item = sp.loc[item_id_b]
        sp_item = sp_item[sp_item.index >= plot_start_b]
        if not sp_item.empty:
            ax.plot(
                sp_item.index,
                sp_item["mean"],
                color=PEA_GOLD,
                linewidth=2.5,
                linestyle="--",
                label="WeightedEnsemble (stacked)",
                zorder=6,
            )
            if "0.1" in sp_item.columns and "0.9" in sp_item.columns:
                ax.fill_between(
                    sp_item.index,
                    sp_item["0.1"],
                    sp_item["0.9"],
                    alpha=0.2,
                    color=PEA_GOLD,
                    label="80% interval",
                    zorder=2,
                )
else:
    print(f"No ensemble model found. Available: {predictor_b.model_names()}")

date_label_b = series_end_b.strftime("%b %Y")
ax.set_title(
    f"Multi-Layer Stacking  |  {item_id_b} ({date_label_b})",
    fontsize=11,
    fontweight="bold",
    color=PEA_PURPLE,
    pad=10,
)
ax.set_xlabel("Date / Hour", fontsize=9, color=PEA_PURPLE)
ax.set_ylabel("Electricity Demand (MW)", fontsize=9, color=PEA_PURPLE)
ax.xaxis.set_major_locator(plt.matplotlib.dates.HourLocator(interval=4))
ax.xaxis.set_major_formatter(plt.matplotlib.dates.DateFormatter("%d-%b %H:00"))
ax.tick_params(axis="x", rotation=45, labelsize=7, colors=PEA_PURPLE)
ax.tick_params(axis="y", labelsize=8, colors=PEA_PURPLE)
ax.legend(fontsize=8, framealpha=0.9, edgecolor=PEA_PURPLE, loc="upper left")

fig.patch.set_facecolor(PEA_WHITE)
fig.suptitle(
    "Multi-Layer Stacking Forecast — Australian Electricity  |  5-Day Hourly",
    fontsize=13,
    fontweight="bold",
    color=PEA_PURPLE,
    y=1.02,
)
plt.tight_layout()
plt.savefig("outputs/forecasting/section_b_stacking.png", dpi=150, bbox_inches="tight", facecolor=PEA_WHITE)
plt.show()
print("Saved: outputs/forecasting/section_b_stacking.png")
