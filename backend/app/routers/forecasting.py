"""
Sales Forecasting Router — /api/v1/forecasting

Endpoints:
  - POST /generate/{product_id}    → Generate forecast for single product
  - POST /bulk-generate            → Generate forecasts for all products
  - GET  /forecast/{product_id}    → Get forecast for product
  - GET  /top-sellers              → Get top predicted sellers
  - GET  /model-metrics            → Get model performance metrics
"""

from datetime import date, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.deps import require_admin
from app.models import Product, SalesForecast, User
from app.services.forecasting import (
    bulk_generate_forecasts,
    generate_forecast,
    get_forecast,
    get_top_predicted_sellers,
)

router = APIRouter(prefix="/forecasting", tags=["Sales Forecasting"])


# ══════════════════════════════════════════════════════════════════════════════
# Schemas
# ══════════════════════════════════════════════════════════════════════════════

class GenerateForecastRequest(BaseModel):
    forecast_days: int = Field(default=30, ge=7, le=90)
    model_type: str = Field(default="random_forest", pattern="^(random_forest|linear)$")


class BulkGenerateRequest(BaseModel):
    store_id: int
    forecast_days: int = Field(default=30, ge=7, le=90)
    min_transaction_count: int = Field(default=10, ge=5)


class ForecastDataPoint(BaseModel):
    forecast_date: date
    predicted_quantity: float
    rmse_score: Optional[float]
    mae_score: Optional[float]

    class Config:
        from_attributes = True


class ForecastResponse(BaseModel):
    product_id: int
    product_name: str
    forecast: list[ForecastDataPoint]
    model_version: Optional[str]


class TopSellerItem(BaseModel):
    product_id: int
    product_name: str
    total_predicted: float


class ModelMetrics(BaseModel):
    product_id: int
    product_name: str
    rmse_score: float
    mae_score: float
    model_version: str
    forecast_count: int


# ══════════════════════════════════════════════════════════════════════════════
# Generate Forecasts
# ══════════════════════════════════════════════════════════════════════════════

@router.post(
    "/generate/{product_id}",
    summary="Generate sales forecast for a specific product",
    dependencies=[Depends(require_admin)],
)
def generate_product_forecast(
    product_id: int,
    body: GenerateForecastRequest,
    store_id: int = Query(..., description="Store ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Generate a sales forecast for a specific product using historical transaction data.
    
    **Requirements:**
    - Product must have at least 10 days of transaction history
    - Only completed transactions are used for training
    
    **Models:**
    - `random_forest`: Better for non-linear patterns (recommended)
    - `linear`: Faster, good for simple trends
    """
    # Verify product exists and belongs to store
    product = (
        db.query(Product)
        .filter(Product.product_id == product_id, Product.store_id == store_id)
        .first()
    )
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    try:
        # Delete old forecasts
        db.query(SalesForecast).filter(
            SalesForecast.store_id == store_id,
            SalesForecast.product_id == product_id,
        ).delete()
        
        # Generate new forecasts
        forecasts = generate_forecast(
            db, store_id, product_id, body.forecast_days, body.model_type
        )
        
        for forecast in forecasts:
            db.add(forecast)
        
        db.commit()
        
        return {
            "message": f"Generated {len(forecasts)} forecast points",
            "product_id": product_id,
            "product_name": product.product_name,
            "forecast_days": body.forecast_days,
            "model_type": body.model_type,
            "rmse": float(forecasts[0].rmse_score) if forecasts else None,
            "mae": float(forecasts[0].mae_score) if forecasts else None,
        }
    
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Forecasting error: {str(e)}",
        )


@router.post(
    "/bulk-generate",
    summary="Generate forecasts for all products in a store",
    dependencies=[Depends(require_admin)],
)
def bulk_generate(
    body: BulkGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Generate sales forecasts for all active products with sufficient transaction history.
    
    This is a batch operation that:
    1. Finds all active products with at least `min_transaction_count` transactions
    2. Generates forecasts for each product
    3. Replaces old forecasts with new ones
    
    **Note:** This may take several minutes for stores with many products.
    """
    try:
        success_count = bulk_generate_forecasts(
            db,
            body.store_id,
            body.min_transaction_count,
            body.forecast_days,
        )
        
        return {
            "message": f"Successfully generated forecasts for {success_count} products",
            "store_id": body.store_id,
            "forecast_days": body.forecast_days,
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Bulk forecasting error: {str(e)}",
        )


# ══════════════════════════════════════════════════════════════════════════════
# Retrieve Forecasts
# ══════════════════════════════════════════════════════════════════════════════

@router.get(
    "/forecast/{product_id}",
    response_model=ForecastResponse,
    summary="Get sales forecast for a product",
    dependencies=[Depends(require_admin)],
)
def get_product_forecast(
    product_id: int,
    store_id: int = Query(...),
    days_ahead: int = Query(default=7, ge=1, le=90),
    db: Session = Depends(get_db),
):
    """Get existing forecast for a product for the next N days."""
    product = (
        db.query(Product)
        .filter(Product.product_id == product_id, Product.store_id == store_id)
        .first()
    )
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    forecasts = get_forecast(db, store_id, product_id, days_ahead)
    
    if not forecasts:
        raise HTTPException(
            status_code=404,
            detail="No forecast data available. Generate forecast first.",
        )
    
    return ForecastResponse(
        product_id=product_id,
        product_name=product.product_name,
        forecast=[
            ForecastDataPoint(
                forecast_date=f.forecast_date,
                predicted_quantity=float(f.predicted_quantity),
                rmse_score=float(f.rmse_score) if f.rmse_score else None,
                mae_score=float(f.mae_score) if f.mae_score else None,
            )
            for f in forecasts
        ],
        model_version=forecasts[0].model_version if forecasts else None,
    )


@router.get(
    "/top-sellers",
    response_model=list[TopSellerItem],
    summary="Get products with highest predicted sales",
    dependencies=[Depends(require_admin)],
)
def get_top_sellers(
    store_id: int = Query(...),
    days_ahead: int = Query(default=7, ge=1, le=90),
    top_n: int = Query(default=10, ge=1, le=50),
    db: Session = Depends(get_db),
):
    """
    Get products with the highest predicted sales volume for the next N days.
    
    Useful for:
    - Inventory planning
    - Staff scheduling
    - Promotional planning
    """
    results = get_top_predicted_sellers(db, store_id, days_ahead, top_n)
    
    if not results:
        raise HTTPException(
            status_code=404,
            detail="No forecast data available. Run bulk forecast first.",
        )
    
    return [TopSellerItem(**r) for r in results]


# ══════════════════════════════════════════════════════════════════════════════
# Model Performance
# ══════════════════════════════════════════════════════════════════════════════

@router.get(
    "/model-metrics",
    response_model=list[ModelMetrics],
    summary="Get model performance metrics for all forecasted products",
    dependencies=[Depends(require_admin)],
)
def get_model_metrics(
    store_id: int = Query(...),
    db: Session = Depends(get_db),
):
    """
    Get performance metrics (RMSE, MAE) for all products with forecasts.
    
    **Metrics:**
    - **RMSE** (Root Mean Squared Error): Lower is better. Penalizes large errors.
    - **MAE** (Mean Absolute Error): Lower is better. Average prediction error.
    
    **Rule of thumb:**
    - RMSE/MAE < 15%: Excellent
    - RMSE/MAE 15-25%: Good
    - RMSE/MAE > 25%: May need more data or feature engineering
    """
    from sqlalchemy import func
    
    results = (
        db.query(
            SalesForecast.product_id,
            Product.product_name,
            SalesForecast.rmse_score,
            SalesForecast.mae_score,
            SalesForecast.model_version,
            func.count(SalesForecast.forecast_id).label("forecast_count"),
        )
        .join(Product, SalesForecast.product_id == Product.product_id)
        .filter(SalesForecast.store_id == store_id)
        .group_by(
            SalesForecast.product_id,
            Product.product_name,
            SalesForecast.rmse_score,
            SalesForecast.mae_score,
            SalesForecast.model_version,
        )
        .all()
    )
    
    if not results:
        raise HTTPException(
            status_code=404,
            detail="No forecasts found. Generate forecasts first.",
        )
    
    return [
        ModelMetrics(
            product_id=r.product_id,
            product_name=r.product_name,
            rmse_score=float(r.rmse_score),
            mae_score=float(r.mae_score),
            model_version=r.model_version,
            forecast_count=r.forecast_count,
        )
        for r in results
    ]
