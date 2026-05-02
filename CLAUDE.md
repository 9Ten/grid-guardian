# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Folder structure

```
grid-guardian/
├── app/                   # FastAPI service (inference + optimization)
│   ├── main.py            # API entrypoint — /forecast, /optimize endpoints
│   └── optimizer.py       # Pyomo MILP dispatch optimizer (HiGHS solver)
├── training/              # Offline ML training scripts
│   ├── section_a_ensemble.py   # Base models + WeightedEnsemble
│   └── section_b_stacking.py   # Nonlinear LightGBM stacking
├── outputs/
│   ├── forecasting/       # Charts from training scripts
│   └── optimization/      # Charts from optimizer scenarios
├── docs/                  # Reports & presentations
├── AutogluonModels/       # Saved AutoGluon predictors (gitignored)
├── pyproject.toml
└── CLAUDE.md
```

## Commands

```bash
# Install dependencies (includes HiGHS solver via highspy)
uv sync

# Run Section A + A2 experiments (base models + WeightedEnsemble)
uv run python training/section_a_ensemble.py

# Run Section B experiments (nonlinear stacking)
uv run python training/section_b_stacking.py

# Run optimizer standalone (3 Koh Tao scenarios, no API needed)
uv run python app/optimizer.py

# Start the API server
uv run uvicorn app.main:app --reload --port 8000
```

## Architecture

The project has two phases: **training** (`training/`) and **inference** (`app/`), plus a dispatch **optimizer** (`app/optimizer.py`).

**Training scripts** use AutoGluon TimeSeries to fit and evaluate models on the Australian Electricity dataset (resampled to 1H). They save fitted predictors to `AutogluonModels/ag-<timestamp>/`. The metric is WQL (Weighted Quantile Loss, lower is better).

- `training/section_a_ensemble.py` — fits Chronos-2, AutoARIMA, RecursiveTabular (XGBoost), and WeightedEnsemble; runs a 3-window backtest; plots forecast vs observed.
- `training/section_b_stacking.py` — adds a LightGBM meta-learner (TabularEnsemble / PerQuantileTabularEnsemble) on top of the base models.

**API** (`app/main.py`) loads the most recent `models/` run that contains a `WeightedEnsemble` artifact at startup. All `predict()` calls are CPU-bound and dispatched to a threadpool via `loop.run_in_executor` to keep the async event loop unblocked. Both single (`POST /forecast`) and batch (`POST /forecast/batch`) endpoints build a `TimeSeriesDataFrame` from the raw history payload and call `predictor.predict()` directly.

**Optimizer** (`app/optimizer.py`) receives the 24-hour load forecast and solves a Pyomo MILP (HiGHS solver) to produce a minimum-cost dispatch schedule for grid, diesel generator, and BESS.

The predictor is loaded once at module import time (not inside a lifespan handler), so cold start happens at `uvicorn` startup, not on the first request.

## Key constraints

- Python 3.12 only (see `.python-version`).
- `uv` is the package manager — do not use `pip` directly.
- The API requires a trained `WeightedEnsemble` model to exist under `AutogluonModels/` before it can start. Run `training/section_a_ensemble.py` first if the directory is empty.
- Always run commands from the **project root** so relative output paths (`outputs/`) resolve correctly.
- Minimum 24 hourly observations are required per series in forecast requests.