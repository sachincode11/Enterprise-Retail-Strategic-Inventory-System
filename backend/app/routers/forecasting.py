"""
Sales Forecasting Router — /api/v1/forecasting

Endpoints:
  - POST /generate/{product_id}    → Generate forecast for single product
  - POST /bulk-generate            → Generate forecasts for all products
  - GET  /forecast/{product_id}    → Get forecast for product
  - GET  /top-sellers              → Get top predicted sellers
  - GET  /model-metrics            → Get model performance metrics
"""

# Standard library: date arithmetic for forecast ranges
from datetime import date, timedelta
from typing import Optional

# FastAPI: routing, dependency injection, query params, HTTP errors
from fastapi import APIRouter, Depends, HTTPException, Query, status
# Pydantic: schema definition and input validation
from pydantic import BaseModel, Field
# SQLAlchemy session for all database operations
from sqlalchemy.orm import Session

# Project DB session provider
from app.database import get_db
# Admin-only access guard
from app.core.deps import require_admin
# ORM models: Product catalog, SalesForecast records, User
from app.models import Product, SalesForecast, User
# Service layer: core forecasting logic (ML model training + prediction)
from app.services.forecasting import (
    bulk_generate_forecasts,    # Batch forecast generation for all store products
    generate_forecast,          # Single-product forecast generation
    get_forecast,               # Retrieve stored forecast data points
    get_top_predicted_sellers,  # Rank products by predicted sales volume
)

# All routes prefixed with /forecasting; grouped under "Sales Forecasting" in API docs
router = APIRouter(prefix="/forecasting", tags=["Sales Forecasting"])


# ══════════════════════════════════════════════════════════════════════════════
# Schemas
# ══════════════════════════════════════════════════════════════════════════════

# Request body for generating a single product forecast
class GenerateForecastRequest(BaseModel):
    forecast_days: int = Field(default=30, ge=7, le=90)  # Forecast horizon: 7–90 days
    model_type: str = Field(default="random_forest", pattern="^(random_forest|linear)$")  # ML model choice


# Request body for triggering bulk forecast generation across a store
class BulkGenerateRequest(BaseModel):
    store_id: int
    forecast_days: int = Field(default=30, ge=7, le=90)              # Forecast horizon for all products
    min_transaction_count: int = Field(default=10, ge=5)             # Minimum historical data required per product


# A single predicted data point for one future date
class ForecastDataPoint(BaseModel):
    forecast_date: date               # The future date being predicted
    predicted_quantity: float         # Predicted units to be sold on that date
    rmse_score: Optional[float]       # Root Mean Squared Error of the model (optional)
    mae_score: Optional[float]        # Mean Absolute Error of the model (optional)

    class Config:
        from_attributes = True  # Enables ORM model → Pydantic schema conversion


# Full forecast response for a product: metadata + list of daily forecast points
class ForecastResponse(BaseModel):
    product_id: int
    product_name: str
    forecast: list[ForecastDataPoint]   # Ordered list of predicted daily quantities
    model_version: Optional[str]        # Identifies which model version produced the forecast


# Represents a single item in the top-sellers ranking
class TopSellerItem(BaseModel):
    product_id: int
    product_name: str
    total_predicted: float  # Sum of predicted quantities over the forecast window


# Model accuracy metrics for a single product's forecast
class ModelMetrics(BaseModel):
    product_id: int
    product_name: str
    rmse_score: float       # Lower RMSE = better prediction accuracy
    mae_score: float        # Lower MAE = lower average prediction error
    model_version: str      # Version tag of the ML model used
    forecast_count: int     # Number of forecast data points generated for this product


# ══════════════════════════════════════════════════════════════════════════════
# Generate Forecasts
# ══════════════════════════════════════════════════════════════════════════════

# POST /forecasting/generate/{product_id} — Admin-only: trains model and generates forecast
@router.post(
    "/generate/{product_id}",
    summary="Generate sales forecast for a specific product",
    dependencies=[Depends(require_admin)],  # Route-level admin guard
)
def generate_product_forecast(
    product_id: int,
    body: GenerateForecastRequest,
    store_id: int = Query(..., description="Store ID"),  # Required query param to scope the product
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),         # Also enforces admin at function level
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
    # Ensures the product_id is valid and scoped to the correct store
    product = (
        db.query(Product)
        .filter(Product.product_id == product_id, Product.store_id == store_id)
        .first()
    )
    
    # Return 404 if product doesn't exist in this store
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    try:
        # Delete old forecasts
        # Remove stale forecasts before inserting fresh predictions
        db.query(SalesForecast).filter(
            SalesForecast.store_id == store_id,
            SalesForecast.product_id == product_id,
        ).delete()
        
        # Generate new forecasts
        # Calls the ML service to train a model and produce N-day predictions
        forecasts = generate_forecast(
            db, store_id, product_id, body.forecast_days, body.model_type
        )
        
        # Persist each forecast data point to the database
        for forecast in forecasts:
            db.add(forecast)
        
        db.commit()  # Save all new forecast records atomically
        
        # Return summary including product info, model used, and error metrics
        return {
            "message": f"Generated {len(forecasts)} forecast points",
            "product_id": product_id,
            "product_name": product.product_name,
            "forecast_days": body.forecast_days,
            "model_type": body.model_type,
            # Extract RMSE/MAE from the first forecast point (same for all points)
            "rmse": float(forecasts[0].rmse_score) if forecasts else None,
            "mae": float(forecasts[0].mae_score) if forecasts else None,
        }
    
    except ValueError as e:
        # Raised by the service when data is insufficient for training
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        db.rollback()  # Undo any partial DB writes on unexpected failure
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Forecasting error: {str(e)}",
        )


# POST /forecasting/bulk-generate — Admin-only: batch forecast for all store products
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
        # Delegate batch processing to the service layer; returns count of successful forecasts
        success_count = bulk_generate_forecasts(
            db,
            body.store_id,
            body.min_transaction_count,  # Skip products with insufficient history
            body.forecast_days,
        )
        
        # Return how many products were successfully forecasted
        return {
            "message": f"Successfully generated forecasts for {success_count} products",
            "store_id": body.store_id,
            "forecast_days": body.forecast_days,
        }
    
    except Exception as e:
        # Catch-all for unexpected service-layer failures
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Bulk forecasting error: {str(e)}",
        )


# ══════════════════════════════════════════════════════════════════════════════
# Retrieve Forecasts
# ══════════════════════════════════════════════════════════════════════════════

# GET /forecasting/forecast/{product_id} — Admin-only: retrieve stored forecast for a product
@router.get(
    "/forecast/{product_id}",
    response_model=ForecastResponse,
    summary="Get sales forecast for a product",
    dependencies=[Depends(require_admin)],
)
def get_product_forecast(
    product_id: int,
    store_id: int = Query(...),                         # Required: scope query to a store
    days_ahead: int = Query(default=7, ge=1, le=90),    # How many future days to return
    db: Session = Depends(get_db),
):
    """Get existing forecast for a product for the next N days."""
    # Validate that the product exists and belongs to the given store
    product = (
        db.query(Product)
        .filter(Product.product_id == product_id, Product.store_id == store_id)
        .first()
    )
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Fetch stored forecast data points from the DB via service layer
    forecasts = get_forecast(db, store_id, product_id, days_ahead)
    
    # Inform the caller if no forecasts have been generated yet
    if not forecasts:
        raise HTTPException(
            status_code=404,
            detail="No forecast data available. Generate forecast first.",
        )
    
    # Build structured response: product metadata + list of daily predictions
    return ForecastResponse(
        product_id=product_id,
        product_name=product.product_name,
        forecast=[
            ForecastDataPoint(
                forecast_date=f.forecast_date,
                predicted_quantity=float(f.predicted_quantity),
                # Safely convert Decimal/None to float for JSON serialization
                rmse_score=float(f.rmse_score) if f.rmse_score else None,
                mae_score=float(f.mae_score) if f.mae_score else None,
            )
            for f in forecasts  # List comprehension builds one point per forecast row
        ],
        model_version=forecasts[0].model_version if forecasts else None,  # Same model for all points
    )


# GET /forecasting/top-sellers — Admin-only: rank products by predicted sales
@router.get(
    "/top-sellers",
    response_model=list[TopSellerItem],
    summary="Get products with highest predicted sales",
    dependencies=[Depends(require_admin)],
)
def get_top_sellers(
    store_id: int = Query(...),
    days_ahead: int = Query(default=7, ge=1, le=90),    # Forecast window to sum predictions over
    top_n: int = Query(default=10, ge=1, le=50),         # Number of top products to return
    db: Session = Depends(get_db),
):
    """
    Get products with the highest predicted sales volume for the next N days.
    
    Useful for:
    - Inventory planning
    - Staff scheduling
    - Promotional planning
    """
    # Delegate aggregation and ranking to the service layer
    results = get_top_predicted_sellers(db, store_id, days_ahead, top_n)
    
    # If no forecast data exists, prompt admin to run bulk generation first
    if not results:
        raise HTTPException(
            status_code=404,
            detail="No forecast data available. Run bulk forecast first.",
        )
    
    # Unpack each dict result into a typed TopSellerItem schema
    return [TopSellerItem(**r) for r in results]


# ══════════════════════════════════════════════════════════════════════════════
# Model Performance
# ══════════════════════════════════════════════════════════════════════════════

# GET /forecasting/model-metrics — Admin-only: view ML accuracy metrics per product
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
    # Import SQLAlchemy aggregate function for counting forecast rows
    from sqlalchemy import func
    
    # Join SalesForecast with Product to fetch product names alongside metrics
    # Group by all non-aggregated columns to get one row per (product, model version)
    results = (
        db.query(
            SalesForecast.product_id,
            Product.product_name,
            SalesForecast.rmse_score,
            SalesForecast.mae_score,
            SalesForecast.model_version,
            func.count(SalesForecast.forecast_id).label("forecast_count"),  # Count data points per group
        )
        .join(Product, SalesForecast.product_id == Product.product_id)  # Inner join on product
        .filter(SalesForecast.store_id == store_id)                      # Scope to current store
        .group_by(
            SalesForecast.product_id,
            Product.product_name,
            SalesForecast.rmse_score,
            SalesForecast.mae_score,
            SalesForecast.model_version,
        )
        .all()
    )
    
    # Prompt admin to generate forecasts if none exist yet
    if not results:
        raise HTTPException(
            status_code=404,
            detail="No forecasts found. Generate forecasts first.",
        )
    
    # Map each raw DB row into a typed ModelMetrics response object
    return [
        ModelMetrics(
            product_id=r.product_id,
            product_name=r.product_name,
            rmse_score=float(r.rmse_score),      # Cast Decimal to float for JSON output
            mae_score=float(r.mae_score),
            model_version=r.model_version,
            forecast_count=r.forecast_count,     # Total forecast points stored for this product
        )
        for r in results
    ]
