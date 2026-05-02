import warnings

warnings.filterwarnings("ignore")

import pandas as pd
import matplotlib.pyplot as plt
from autogluon.timeseries import TimeSeriesDataFrame, TimeSeriesPredictor


# =============================================================================
# SECTION A: Weighted Ensemble
# Dataset: Australian electricity subset
# =============================================================================

print("=" * 60)
print("SECTION A: Weighted Ensemble Forecasting")
print("=" * 60)

data_raw = TimeSeriesDataFrame.from_path(
    "https://autogluon.s3.amazonaws.com/datasets/timeseries/australian_electricity_subset/test.csv"
)
# Resample from 30-min to hourly
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
print(data.head())
print(f"\nShape: {data.shape}")
print(f"Item IDs: {data.item_ids.tolist()}")

num_test_windows = 3
prediction_length = 24  # 24 hourly steps = 1 day ahead

train_data, test_data = data.train_test_split(num_test_windows * prediction_length)
print(f"\nTrain: {train_data.shape}, Test: {test_data.shape}")


predictor_a = TimeSeriesPredictor(
    prediction_length=prediction_length, eval_metric="MAPE"
).fit(
    train_data,
    hyperparameters={
        "Chronos2": {"context_length": 168},  # Chronos-2 zero-shot (pretrained transformer)
        "AutoARIMA": {"stationary": True, "n_jobs": -1},  # Classical ARIMA — fits per series
        "RecursiveTabular": {  # XGBoost tree-based with lag features
            "model_name": "XGB",
            "lags": [1, 2, 3, 6, 12, 24, 48, 168,],  # hourly lags: last 1-3h, 6h, 12h, 1d, 2d, 1w
            "model_hyperparameters": {
                "n_estimators": 1000,
            },
        },
        # "DeepAR": {},                                                # Deep autoregressive RNN
    },
    enable_ensemble=True,
    time_limit=1200,
    # hyperparameter_tune_kwargs="auto",
)

print("\nRegistered models:", predictor_a.model_names())

leaderboard_a = predictor_a.leaderboard(test_data)
print("\nLeaderboard:")
print(leaderboard_a)

# --- Plot: Forecast vs Observed — 5 days of observed context + forecast, hourly ---
HISTORY_HOURS = 120  # 5 days of observed context before the forecast window

# PEA Thailand brand colours
PEA_PURPLE = "#5B2D8E"
PEA_GOLD = "#C8A014"
PEA_WHITE = "#FFFFFF"
PEA_BG = "#F5F0FB"  # very light purple tint for panel background

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

models = predictor_a.model_names()
item_ids_to_plot = data.item_ids[:1]
n_models = len(models)
n_items = len(item_ids_to_plot)

fig, axes = plt.subplots(
    nrows=n_items,
    ncols=n_models,
    figsize=(7 * n_models, 4.5 * n_items),
    sharey="row",
)
if n_items == 1:
    axes = axes[None, :]
if n_models == 1:
    axes = axes[:, None]

for col, model in enumerate(models):
    preds_per_window = predictor_a.backtest_predictions(
        test_data,
        num_val_windows=num_test_windows,
        model=model,
    )
    preds = pd.concat(preds_per_window)

    for row, item_id in enumerate(item_ids_to_plot):
        ax = axes[row, col]
        ax.grid(True)

        all_observed = test_data.loc[item_id]["target"]
        series_end = all_observed.index[-1]
        plot_start = series_end - pd.Timedelta(hours=HISTORY_HOURS)

        window_observed = all_observed[all_observed.index >= plot_start]
        ax.plot(
            window_observed.index,
            window_observed.values,
            color=PEA_PURPLE,
            linewidth=1.2,
            label="Observed",
            zorder=3,
        )

        if item_id in preds.index.get_level_values(0):
            item_preds = preds.loc[item_id]
            item_preds = item_preds[item_preds.index >= plot_start]
            if not item_preds.empty:
                ax.plot(
                    item_preds.index,
                    item_preds["mean"],
                    color=PEA_GOLD,
                    linewidth=2,
                    linestyle="--",
                    label="Forecast",
                    zorder=4,
                )
                if "0.1" in item_preds.columns and "0.9" in item_preds.columns:
                    ax.fill_between(
                        item_preds.index,
                        item_preds["0.1"],
                        item_preds["0.9"],
                        alpha=0.25,
                        color=PEA_GOLD,
                        label="80% interval",
                        zorder=2,
                    )

        date_label = series_end.strftime("%b %Y")
        ax.set_title(
            f"{model}  |  {item_id} ({date_label})",
            fontsize=10,
            fontweight="bold",
            pad=8,
        )
        ax.set_xlabel("Date / Hour", fontsize=8)
        ax.xaxis.set_major_locator(plt.matplotlib.dates.HourLocator(interval=4))
        ax.xaxis.set_major_formatter(plt.matplotlib.dates.DateFormatter("%d-%b %H:00"))
        ax.tick_params(axis="x", rotation=45, labelsize=7)
        ax.tick_params(axis="y", labelsize=8)
        if col == 0:
            ax.set_ylabel("Electricity Demand (MW)", fontsize=9)
        if row == 0 and col == 0:
            ax.legend(fontsize=8, framealpha=0.9, edgecolor=PEA_PURPLE)

# Header bar mimicking PEA branding
fig.patch.set_facecolor(PEA_WHITE)
fig.suptitle(
    "Forecast vs Observed — Australian Electricity  |  5-Day Hourly Comparison",
    fontsize=13,
    fontweight="bold",
    color=PEA_PURPLE,
    y=1.02,
)
# fig.text(
#     0.5, 0.995,
#     "Models: Chronos-2 (Zero-Shot)  ·  AutoARIMA  ·  RecursiveTabular (XGBoost)  ·  DeepAR",
#     ha="center", fontsize=8, color=PEA_GOLD, style="italic",
# )
plt.tight_layout()
plt.savefig("outputs/forecasting/section_a_forecast.png", dpi=150, bbox_inches="tight", facecolor=PEA_WHITE)
plt.show()
print("Saved: outputs/forecasting/section_a_forecast.png")


# =============================================================================
# SECTION A2: WeightedEnsemble — Blended Forecast
# Combines Chronos2 + AutoARIMA + RecursiveTabular(XGB) via learned weights
# =============================================================================

print("\n" + "=" * 60)
print("SECTION A2: WeightedEnsemble Blended Forecast")
print("=" * 60)

ensemble_name = "WeightedEnsemble"
if ensemble_name not in predictor_a.model_names():
    print(f"'{ensemble_name}' not found. Available models: {predictor_a.model_names()}")
else:
    # Leaderboard showing ensemble vs individual models
    print("\nFull leaderboard (ensemble vs individual):")
    print(predictor_a.leaderboard(test_data).to_string(index=False))

    # Backtest predictions for the ensemble
    ensemble_preds_per_window = predictor_a.backtest_predictions(
        test_data,
        num_val_windows=num_test_windows,
        model=ensemble_name,
    )
    ensemble_preds = pd.concat(ensemble_preds_per_window)

    # --- Plot: Ensemble forecast vs individual models vs observed ---
    item_id = data.item_ids[0]
    all_observed = test_data.loc[item_id]["target"]
    series_end = all_observed.index[-1]
    plot_start = series_end - pd.Timedelta(hours=HISTORY_HOURS)
    window_observed = all_observed[all_observed.index >= plot_start]

    individual_colors = {
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
        window_observed.index,
        window_observed.values,
        color=PEA_PURPLE,
        linewidth=1.5,
        label="Observed",
        zorder=5,
    )

    # Individual model forecasts (thin, semi-transparent)
    for ind_model, color in individual_colors.items():
        if ind_model not in predictor_a.model_names():
            continue
        ind_preds = pd.concat(
            predictor_a.backtest_predictions(
                test_data,
                num_val_windows=num_test_windows,
                model=ind_model,
            )
        )
        if item_id in ind_preds.index.get_level_values(0):
            ip = ind_preds.loc[item_id]
            ip = ip[ip.index >= plot_start]
            if not ip.empty:
                ax.plot(
                    ip.index,
                    ip["mean"],
                    color=color,
                    linewidth=1,
                    linestyle=":",
                    alpha=0.7,
                    label=ind_model,
                    zorder=3,
                )

    # Ensemble forecast (bold gold)
    if item_id in ensemble_preds.index.get_level_values(0):
        ep = ensemble_preds.loc[item_id]
        ep = ep[ep.index >= plot_start]
        if not ep.empty:
            ax.plot(
                ep.index,
                ep["mean"],
                color=PEA_GOLD,
                linewidth=2.5,
                linestyle="--",
                label=f"{ensemble_name} (Blended)",
                zorder=6,
            )
            if "0.1" in ep.columns and "0.9" in ep.columns:
                ax.fill_between(
                    ep.index,
                    ep["0.1"],
                    ep["0.9"],
                    alpha=0.2,
                    color=PEA_GOLD,
                    label="80% interval",
                    zorder=2,
                )

    date_label = series_end.strftime("%b %Y")
    ax.set_title(
        f"WeightedEnsemble vs Individual Models  |  {item_id} ({date_label})",
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
        "WeightedEnsemble Blended Forecast — Australian Electricity  |  5-Day Hourly",
        fontsize=13,
        fontweight="bold",
        color=PEA_PURPLE,
        y=1.02,
    )
    plt.tight_layout()
    plt.savefig(
        "outputs/forecasting/section_a2_ensemble.png", dpi=150, bbox_inches="tight", facecolor=PEA_WHITE
    )
    plt.show()
    print("Saved: outputs/forecasting/section_a2_ensemble.png")
