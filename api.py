import warnings
warnings.filterwarnings("ignore")

from pathlib import Path
from datetime import datetime
from typing import List, Optional
import asyncio
from functools import partial

import pandas as pd
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from autogluon.timeseries import TimeSeriesDataFrame, TimeSeriesPredictor


# ---------------------------------------------------------------------------
# Startup — load predictor once
# ---------------------------------------------------------------------------

MODELS_DIR = Path("AutogluonModels")


def _find_weighted_ensemble_path() -> Path:
    runs = sorted(MODELS_DIR.iterdir(), reverse=True)
    for run in runs:
        models_dir = run / "models"
        if models_dir.exists() and (models_dir / "WeightedEnsemble").exists():
            return run
    raise RuntimeError("No run with WeightedEnsemble found in AutogluonModels/")


MODEL_PATH = _find_weighted_ensemble_path()
predictor: TimeSeriesPredictor = TimeSeriesPredictor.load(str(MODEL_PATH))
BEST_MODEL: str = "WeightedEnsemble"
PREDICTION_LENGTH: int = predictor.prediction_length

print(f"Loaded predictor : {MODEL_PATH.name}")
print(f"Best model       : {BEST_MODEL}")
print(f"Prediction length: {PREDICTION_LENGTH}h")


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Grid Guardian — Energy Load Forecast API",
    description=(
        "Real-time and batch 24-hour energy load demand forecasting "
        "powered by AutoGluon WeightedEnsemble (Chronos-2 + AutoARIMA + XGBoost)."
    ),
    version="1.0.0",
)


# ---------------------------------------------------------------------------
# Shared schema
# ---------------------------------------------------------------------------

class TimePoint(BaseModel):
    timestamp: datetime = Field(..., example="2015-02-25T00:00:00")
    target: float = Field(..., description="Observed electricity demand (MW)", example=6500.0)


class ForecastRequest(BaseModel):
    item_id: str = Field(default="Zone1", example="Zone1")
    history: List[TimePoint] = Field(
        ...,
        description="Historical hourly observations. Minimum 24 points required.",
        min_length=24,
    )
    model: Optional[str] = Field(
        default=None,
        description="Model name to use. Defaults to WeightedEnsemble.",
        example="WeightedEnsemble",
    )
    quantile_levels: List[float] = Field(
        default=[0.1, 0.5, 0.9],
        description="Quantile levels to return.",
    )


class BatchForecastRequest(BaseModel):
    items: List[ForecastRequest] = Field(
        ...,
        description="List of series to forecast in one call.",
        min_length=1,
        max_length=50,
    )
    model: Optional[str] = Field(
        default=None,
        description="Override model for all items. Defaults to WeightedEnsemble.",
    )
    quantile_levels: List[float] = Field(default=[0.1, 0.5, 0.9])


class Interval80(BaseModel):
    lower: Optional[float] = Field(None, description="10th percentile (lower bound)")
    upper: Optional[float] = Field(None, description="90th percentile (upper bound)")


class ForecastPoint(BaseModel):
    timestamp: datetime
    forecasted: float = Field(..., description="Mean (expected) demand in MW")
    interval_80: Interval80 = Field(..., description="80% prediction interval")


class ForecastResponse(BaseModel):
    item_id: str
    model_used: str
    prediction_length: int
    forecasted: List[ForecastPoint]


class BatchForecastResponse(BaseModel):
    total_items: int
    model_used: str
    prediction_length: int
    forecasted: List[ForecastResponse]


# ---------------------------------------------------------------------------
# Shared inference helpers (CPU-bound — run in threadpool)
# ---------------------------------------------------------------------------

def _build_tsdf(item_id: str, history: List[TimePoint]) -> TimeSeriesDataFrame:
    df = pd.DataFrame([
        {"item_id": item_id, "timestamp": p.timestamp, "target": p.target}
        for p in history
    ])
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    df = df.sort_values("timestamp")
    return TimeSeriesDataFrame.from_data_frame(
        df, id_column="item_id", timestamp_column="timestamp",
    )


def _preds_to_points(preds: pd.DataFrame, item_id: str) -> List[ForecastPoint]:
    item_preds = (
        preds.loc[item_id]
        if item_id in preds.index.get_level_values(0)
        else preds
    )
    cols = item_preds.columns.tolist()
    points = []
    for ts, row in item_preds.iterrows():
        points.append(ForecastPoint(
            timestamp=ts,
            forecasted=round(float(row["mean"]) if "mean" in cols else float(row.iloc[0]), 2),
            interval_80=Interval80(
                lower=round(float(row["0.1"]), 2) if "0.1" in cols else None,
                upper=round(float(row["0.9"]), 2) if "0.9" in cols else None,
            ),
        ))
    return points


def _run_single(request: ForecastRequest) -> ForecastResponse:
    model_name = request.model or BEST_MODEL
    context = _build_tsdf(request.item_id, request.history)
    # quantile_levels is set at fit time; predict() returns whatever was configured
    preds = predictor.predict(context, model=model_name)
    return ForecastResponse(
        item_id=request.item_id,
        model_used=model_name,
        prediction_length=PREDICTION_LENGTH,
        forecasted=_preds_to_points(preds, request.item_id),
    )


def _run_batch(items: List[ForecastRequest], model: Optional[str]) -> List[ForecastResponse]:
    model_name = model or BEST_MODEL

    frames = []
    for req in items:
        df = pd.DataFrame([
            {"item_id": req.item_id, "timestamp": p.timestamp, "target": p.target}
            for p in req.history
        ])
        frames.append(df)

    combined = pd.concat(frames, ignore_index=True)
    combined["timestamp"] = pd.to_datetime(combined["timestamp"])
    combined = combined.sort_values(["item_id", "timestamp"])

    context = TimeSeriesDataFrame.from_data_frame(
        combined, id_column="item_id", timestamp_column="timestamp",
    )
    preds = predictor.predict(context, model=model_name)

    results = []
    for req in items:
        results.append(ForecastResponse(
            item_id=req.item_id,
            model_used=model_name,
            prediction_length=PREDICTION_LENGTH,
            forecast=_preds_to_points(preds, req.item_id),
        ))
    return results


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/", tags=["Health"])
async def root():
    return {
        "status": "ok",
        "best_model": BEST_MODEL,
        "prediction_length_hours": PREDICTION_LENGTH,
        "available_models": predictor.model_names(),
    }


@app.get("/models", tags=["Models"])
async def list_models():
    """All trained models with validation scores."""
    try:
        lb = predictor.leaderboard()
        return lb[["model", "score_val"]].to_dict(orient="records")
    except Exception as e:
        return {"models": predictor.model_names(), "note": str(e)}


@app.post("/forecast", response_model=ForecastResponse, tags=["Real-time"])
async def forecast(request: ForecastRequest):
    """
    **Real-time inference** — single series, low latency.

    Send at least 24 hourly observations; receive a 24-hour ahead forecast
    with mean + quantile intervals.
    """
    model_name = request.model or BEST_MODEL
    if model_name not in predictor.model_names():
        raise HTTPException(
            status_code=400,
            detail=f"Unknown model '{model_name}'. Available: {predictor.model_names()}",
        )
    try:
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, _run_single, request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference failed: {e}")


@app.post("/forecast/batch", response_model=BatchForecastResponse, tags=["Batch"])
async def forecast_batch(request: BatchForecastRequest):
    """
    **Batch inference** — up to 50 series in a single call.

    All series are combined into one TimeSeriesDataFrame and passed to the
    model in a single `predict()` call for efficiency. Useful for
    forecasting multiple zones or meters simultaneously.
    """
    model_name = request.model or BEST_MODEL
    if model_name not in predictor.model_names():
        raise HTTPException(
            status_code=400,
            detail=f"Unknown model '{model_name}'. Available: {predictor.model_names()}",
        )

    # Override per-item model/quantiles with batch-level settings if provided
    items = []
    for item in request.items:
        items.append(ForecastRequest(
            item_id=item.item_id,
            history=item.history,
            model=model_name,
        ))

    try:
        loop = asyncio.get_event_loop()
        fn = partial(_run_batch, items, model_name)
        results = await loop.run_in_executor(None, fn)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch inference failed: {e}")

    return BatchForecastResponse(
        total_items=len(results),
        model_used=model_name,
        prediction_length=PREDICTION_LENGTH,
        forecasted=results,
    )
