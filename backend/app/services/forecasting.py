"""
Sales Forecasting Service
Uses scikit-learn regression models to predict future sales.
"""

import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models import Product, SalesForecast, Transaction, TransactionItem

logger = logging.getLogger(__name__)


# Feature Engineering
def prepare_training_data(
    db: Session, store_id: int, product_id: Optional[int] = None
):
    """
    Prepare training data from historical transactions.
    """
    import pandas as pd
    # Build query for completed transactions
    query = (
        db.query(
            func.date(Transaction.transaction_date).label("date"),
            TransactionItem.product_id,
            func.sum(TransactionItem.quantity).label("quantity_sold"),
        )
        .join(TransactionItem, Transaction.transaction_id == TransactionItem.transaction_id)
        .filter(
            Transaction.store_id == store_id,
            Transaction.status == "completed",
        )
    )
    
    if product_id:
        query = query.filter(TransactionItem.product_id == product_id)
    
    query = query.group_by(func.date(Transaction.transaction_date), TransactionItem.product_id)
    
    results = query.all()
    
    if not results:
        logger.warning(f"No transaction data found for store {store_id}")
        return pd.DataFrame()
    
    # Convert to DataFrame
    df = pd.DataFrame(results, columns=["date", "product_id", "quantity_sold"])
    df["date"] = pd.to_datetime(df["date"])
    
    # Feature engineering
    df["day_of_week"] = df["date"].dt.dayofweek  # 0=Monday, 6=Sunday
    df["day_of_month"] = df["date"].dt.day
    df["month"] = df["date"].dt.month
    df["is_weekend"] = (df["day_of_week"] >= 5).astype(int)
    
    # Add rolling averages (7-day and 30-day)
    for product in df["product_id"].unique():
        mask = df["product_id"] == product
        df.loc[mask, "rolling_7d_avg"] = (
            df.loc[mask, "quantity_sold"].rolling(window=7, min_periods=1).mean()
        )
        df.loc[mask, "rolling_30d_avg"] = (
            df.loc[mask, "quantity_sold"].rolling(window=30, min_periods=1).mean()
        )
    
    return df


# Model Training

def train_model(
    df, model_type: str = "random_forest"
) -> tuple[object, float, float]:
    """
    Train a regression model on the prepared data.
    """
    import numpy as np
    from sklearn.ensemble import RandomForestRegressor
    from sklearn.linear_model import LinearRegression
    from sklearn.metrics import mean_absolute_error, mean_squared_error
    from sklearn.model_selection import train_test_split
    if df.empty or len(df) < 10:
        raise ValueError("Insufficient data for training (need at least 10 data points)")
    
    # Features and target
    feature_cols = [
        "day_of_week",
        "day_of_month",
        "month",
        "is_weekend",
        "rolling_7d_avg",
        "rolling_30d_avg",
    ]
    
    X = df[feature_cols].fillna(0)
    y = df["quantity_sold"]
    
    # Train/test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, shuffle=False
    )
    
    # Select model
    if model_type == "random_forest":
        model = RandomForestRegressor(
            n_estimators=100, max_depth=10, random_state=42, n_jobs=-1
        )
    else:
        model = LinearRegression()
    
    # Train
    model.fit(X_train, y_train)
    
    # Evaluate
    y_pred = model.predict(X_test)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    mae = mean_absolute_error(y_test, y_pred)
    
    logger.info(
        f"Model trained: {model_type} | RMSE={rmse:.2f} | MAE={mae:.2f} | "
        f"Train size={len(X_train)} | Test size={len(X_test)}"
    )
    
    return model, rmse, mae


# Forecasting
def generate_forecast(
    db: Session,
    store_id: int,
    product_id: int,
    forecast_days: int = 30,
    model_type: str = "random_forest",
) -> list[SalesForecast]:
    """
    Generate sales forecast for a product.
    
    Args:
        db: Database session
        store_id: Store ID
        product_id: Product ID to forecast
        forecast_days: Number of days to forecast into the future
        model_type: 'random_forest' or 'linear'
    
    Returns:
        List of SalesForecast objects (not yet committed)
    """
    # 1. Prepare training data
    df = prepare_training_data(db, store_id, product_id)
    
    if df.empty:
        raise ValueError(f"No historical data for product {product_id}")
    
    # Filter to this product
    df = df[df["product_id"] == product_id].copy()
    
    if len(df) < 10:
        raise ValueError(f"Insufficient data for product {product_id} (need at least 10 days)")
    
    # 2. Train model
    model, rmse, mae = train_model(df, model_type)
    
    # 3. Generate future dates
    import pandas as pd
    import numpy as np
    last_date = df["date"].max()
    future_dates = [last_date + timedelta(days=i + 1) for i in range(forecast_days)]
    
    # 4. Prepare features for future dates
    future_features = []
    
    # Get recent rolling averages as baseline
    recent_avg_7d = df["rolling_7d_avg"].iloc[-1]
    recent_avg_30d = df["rolling_30d_avg"].iloc[-1]
    
    for date in future_dates:
        features = {
            "day_of_week": date.dayofweek,
            "day_of_month": date.day,
            "month": date.month,
            "is_weekend": 1 if date.dayofweek >= 5 else 0,
            "rolling_7d_avg": recent_avg_7d,
            "rolling_30d_avg": recent_avg_30d,
        }
        future_features.append(features)
    
    future_df = pd.DataFrame(future_features)
    
    # 5. Predict
    predictions = model.predict(future_df)
    
    # Ensure predictions are non-negative
    predictions = np.maximum(predictions, 0)
    
    # 6. Create forecast objects
    forecasts = []
    model_version = f"{model_type}_v1"
    
    for date, quantity in zip(future_dates, predictions):
        forecast = SalesForecast(
            store_id=store_id,
            product_id=product_id,
            forecast_date=date.date(),
            predicted_quantity=round(float(quantity), 2),
            rmse_score=round(float(rmse), 4),
            mae_score=round(float(mae), 4),
            model_version=model_version,
        )
        forecasts.append(forecast)
    
    logger.info(
        f"Generated {len(forecasts)} forecast points for product {product_id} "
        f"(avg predicted: {np.mean(predictions):.2f})"
    )
    
    return forecasts


def bulk_generate_forecasts(
    db: Session,
    store_id: int,
    min_transaction_count: int = 10,
    forecast_days: int = 30,
) -> int:
    """
    Generate forecasts for all active products in a store that have sufficient history.
    
    Returns: Number of products successfully forecasted
    """
    # Get all active products with sufficient transaction history
    products_with_history = (
        db.query(TransactionItem.product_id, func.count(TransactionItem.item_id).label("txn_count"))
        .join(Transaction, TransactionItem.transaction_id == Transaction.transaction_id)
        .join(Product, TransactionItem.product_id == Product.product_id)
        .filter(
            Transaction.store_id == store_id,
            Transaction.status == "completed",
            Product.is_active.is_(True),
        )
        .group_by(TransactionItem.product_id)
        .having(func.count(TransactionItem.item_id) >= min_transaction_count)
        .all()
    )
    
    success_count = 0
    
    for product_id, txn_count in products_with_history:
        try:
            # Delete old forecasts for this product
            db.query(SalesForecast).filter(
                SalesForecast.store_id == store_id,
                SalesForecast.product_id == product_id,
            ).delete()
            
            # Generate new forecasts
            forecasts = generate_forecast(db, store_id, product_id, forecast_days)
            
            for forecast in forecasts:
                db.add(forecast)
            
            db.flush()
            success_count += 1
            
        except Exception as e:
            logger.error(f"Failed to forecast product {product_id}: {e}")
            db.rollback()
            continue
    
    db.commit()
    logger.info(f"Bulk forecast complete: {success_count}/{len(products_with_history)} products")
    
    return success_count


# ══════════════════════════════════════════════════════════════════════════════
# Forecast Retrieval & Analysis
# ══════════════════════════════════════════════════════════════════════════════

def get_forecast(
    db: Session, store_id: int, product_id: int, days_ahead: int = 7
) -> list[SalesForecast]:
    """Get existing forecast for a product for the next N days."""
    from datetime import date
    
    start_date = date.today()
    end_date = start_date + timedelta(days=days_ahead)
    
    forecasts = (
        db.query(SalesForecast)
        .filter(
            SalesForecast.store_id == store_id,
            SalesForecast.product_id == product_id,
            SalesForecast.forecast_date >= start_date,
            SalesForecast.forecast_date <= end_date,
        )
        .order_by(SalesForecast.forecast_date)
        .all()
    )
    
    return forecasts


def get_top_predicted_sellers(
    db: Session, store_id: int, days_ahead: int = 7, top_n: int = 10
) -> list[dict]:
    """Get products with highest predicted sales in the next N days."""
    from datetime import date
    
    start_date = date.today()
    end_date = start_date + timedelta(days=days_ahead)
    
    results = (
        db.query(
            SalesForecast.product_id,
            Product.product_name,
            func.sum(SalesForecast.predicted_quantity).label("total_predicted"),
        )
        .join(Product, SalesForecast.product_id == Product.product_id)
        .filter(
            SalesForecast.store_id == store_id,
            SalesForecast.forecast_date >= start_date,
            SalesForecast.forecast_date <= end_date,
        )
        .group_by(SalesForecast.product_id, Product.product_name)
        .order_by(func.sum(SalesForecast.predicted_quantity).desc())
        .limit(top_n)
        .all()
    )
    
    return [
        {
            "product_id": r.product_id,
            "product_name": r.product_name,
            "total_predicted": float(r.total_predicted),
        }
        for r in results
    ]
