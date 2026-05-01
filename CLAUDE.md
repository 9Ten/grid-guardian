# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies
uv sync

# Run Section A + A2 experiments (base models + WeightedEnsemble)
uv run python section_a_ensemble.py

# Run Section B experiments (nonlinear stacking)
uv run python section_b_stacking.py

# Start the API server
uv run uvicorn api:app --reload --port 8000
```

## Architecture

The project has two phases: **training/evaluation** (the `section_*.py` scripts) and **inference** (`api.py`).

**Training scripts** use AutoGluon TimeSeries to fit and evaluate models on the Australian Electricity dataset (resampled to 1H). They save fitted predictors to `AutogluonModels/ag-<timestamp>/`. The metric is WQL (Weighted Quantile Loss, lower is better).

- `section_a_ensemble.py` — fits Chronos-2, AutoARIMA, RecursiveTabular (XGBoost), and WeightedEnsemble; runs a 3-window backtest; plots forecast vs observed.
- `section_b_stacking.py` — adds a LightGBM meta-learner (TabularEnsemble / PerQuantileTabularEnsemble) on top of the base models.

**API** (`api.py`) loads the most recent `AutogluonModels/` run that contains a `WeightedEnsemble` artifact at startup. All `predict()` calls are CPU-bound and dispatched to a threadpool via `loop.run_in_executor` to keep the async event loop unblocked. Both single (`POST /forecast`) and batch (`POST /forecast/batch`) endpoints build a `TimeSeriesDataFrame` from the raw history payload and call `predictor.predict()` directly.

The predictor is loaded once at module import time (not inside a lifespan handler), so cold start happens at `uvicorn` startup, not on the first request.

## Key constraints

- Python 3.12 only (see `.python-version`).
- `uv` is the package manager — do not use `pip` directly.
- The API requires a trained `WeightedEnsemble` model to exist under `AutogluonModels/` before it can start. Run `section_a_ensemble.py` first if the directory is empty.
- Minimum 24 hourly observations are required per series in forecast requests.