# Grid Guardian — AI Energy Load Demand Forecasting

A hackathon project exploring AI-driven energy load demand forecasting for the **Provincial Electricity Authority (PEA) of Thailand**. The project benchmarks modern foundation models (Chronos-2), classical statistical models (AutoARIMA), and tree-based models (XGBoost) — then blends them with nonlinear stacking ensembles — and exposes the best model via a production-ready async FastAPI service.

---

## Architecture

```
Raw Data (30-min intervals)
        │
        ▼
Resample → 1H Hourly
        │
        ▼
Train / Test Split (3 × 24h backtest windows)
        │
        ├──────────────────────────────────────────────────────────┐
        │  section_a_ensemble.py                                   │
        │  ┌──────────────────────────────────────────────────┐    │
        │  │  Section A: Weighted Ensemble Forecasting        │    │
        │  │  Chronos-2 · AutoARIMA · RecursiveTabular (XGB)  │    │
        │  ├──────────────────────────────────────────────────┤    │
        │  │  Section A2: WeightedEnsemble (blended)          │    │
        │  └──────────────────────────────────────────────────┘    │
        │                                                          │
        ├──────────────────────────────────────────────────────────┤
        │  section_b_stacking.py                                   │
        │  ┌──────────────────────────────────────────────────┐    │
        │  │  Section B: Multi-Layer Nonlinear Stacking       │    │
        │  │  TabularEnsemble · PerQuantileTabularEnsemble    │    │
        │  │  (LightGBM meta-learner on base model outputs)   │    │
        │  └──────────────────────────────────────────────────┘    │
        └──────────────────────────────────────────────────────────┘
                              │
                              ▼
                    AutogluonModels/ (saved predictors)
                              │
                              ▼
                         api.py (FastAPI)
                    ┌─────────────────────┐
                    │  POST /forecast      │  ← real-time, single zone
                    │  POST /forecast/batch│  ← up to 50 zones at once
                    │  GET  /models        │  ← leaderboard scores
                    └─────────────────────┘
```

---

## Setup

**Requirements:** Python 3.12, [uv](https://github.com/astral-sh/uv)

```bash
# Clone / enter project
cd grid-guardian

# Install all dependencies
uv sync

# Register Jupyter kernel (optional — for notebook exploration)
uv run python -m ipykernel install --user --name=grid-guardian --display-name "Grid Guardian (uv)"
```

---

## Run Experiments

```bash
# Section A + A2: Zero-shot comparison + WeightedEnsemble
uv run python section_a_ensemble.py

# Section B: Nonlinear stacking (TabularEnsemble / PerQuantileTabularEnsemble)
uv run python section_b_stacking.py
```

Each script saves a PNG chart and prints a leaderboard to stdout.

---

## API — Real-time Inference

Start the server:

```bash
uv run uvicorn api:app --reload --port 8000
```

Swagger UI: **http://localhost:8000/docs**

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | Health check — best model, prediction length, available models |
| `GET` | `/models` | Leaderboard scores for all trained models |
| `POST` | `/forecast` | Real-time inference — single zone, 24-hour horizon |
| `POST` | `/forecast/batch` | Batch inference — up to 50 zones in one call |

### Sample: Real-time (`POST /forecast`)

```bash
curl -X POST http://localhost:8000/forecast \
  -H "Content-Type: application/json" \
  -d '{
    "item_id": "Zone1",
    "model": "WeightedEnsemble",
    "history": [
      {"timestamp": "2015-02-24T00:00:00", "target": 5200},
      {"timestamp": "2015-02-24T01:00:00", "target": 4900},
      ... (minimum 24 hourly observations)
    ]
  }'
```

**Response:**
```json
{
  "item_id": "Zone1",
  "model_used": "WeightedEnsemble",
  "prediction_length": 24,
  "forecasted": [
    {
      "timestamp": "2015-02-25T00:00:00",
      "forecasted": 5102.14,
      "interval_80": { "lower": 4910.74, "upper": 5283.52 }
    }
  ]
}
```

### Sample: Batch (`POST /forecast/batch`)

```bash
curl -X POST http://localhost:8000/forecast/batch \
  -H "Content-Type: application/json" \
  -d '{
    "model": "WeightedEnsemble",
    "items": [
      { "item_id": "Zone1", "history": [...] },
      { "item_id": "Zone2", "history": [...] }
    ]
  }'
```

---

## Model Results

Dataset: **Australian Electricity Subset** (resampled to 1H, 5 time series)
Metric: **WQL — Weighted Quantile Loss** (lower is better)

| Model | Score (test) | Type |
|-------|-------------|------|
| **Chronos-2** | **-0.029** | Foundation model (zero-shot) |
| RecursiveTabular (XGB) | -0.038 | Tree-based |
| AutoARIMA | -0.071 | Classical statistical |
| **WeightedEnsemble** | **best** | Blended (Chronos2 + XGB + ARIMA) |

**Key finding:** Chronos-2 achieves the best zero-shot score without seeing any training data — outperforming both XGBoost and AutoARIMA which were trained on the dataset. The `WeightedEnsemble` further improves by learning optimal blending weights across the 3 models.

---

## Output Artifacts

| File | Description |
|------|-------------|
| `section_a_forecast.png` | Per-model forecast vs observed (5-day, hourly, PEA theme) |
| `section_a2_ensemble.png` | WeightedEnsemble vs individual models overlay |
| `section_b_stacking.png` | Nonlinear stacked ensemble vs base models |
| `AutogluonModels/` | Saved AutoGluon predictor artifacts |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Language | Python 3.12 |
| Package manager | uv |
| Forecasting framework | AutoGluon TimeSeries |
| Foundation model | Amazon Chronos-2 |
| Classical model | AutoARIMA (statsforecast) |
| Tree-based model | XGBoost via RecursiveTabular |
| Ensemble | WeightedEnsemble / TabularEnsemble (LightGBM) |
| API framework | FastAPI + uvicorn (async) |
| Visualisation | Matplotlib (PEA Thailand brand theme) |
