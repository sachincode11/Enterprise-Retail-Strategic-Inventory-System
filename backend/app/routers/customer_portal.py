from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional

from app.core.deps import get_current_user
from app.database import get_db
from app.models import Transaction, User, TransactionItem, Category, Product, Store
from app.schemas import TransactionOut, CustomerAnalyticsOut, SpendingTrend, CategorySpend, TopStore, CustomerSummaryOut

router = APIRouter(prefix="/customer", tags=["Customer"])

@router.get("/transactions", response_model=List[TransactionOut])
def get_my_transactions(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Fetch purchase history for the authenticated customer.
    Returns transactions across all stores.
    """
    transactions = (
        db.query(Transaction)
        .options(
            joinedload(Transaction.items).joinedload(TransactionItem.product),
            joinedload(Transaction.store),
            joinedload(Transaction.payments)
        )
        .filter(Transaction.customer_id == current_user.user_id)
        .order_by(Transaction.transaction_date.desc())
        .offset((page - 1) * size)
        .limit(size)
        .all()
    )
    return transactions

@router.get("/transactions/{transaction_id}", response_model=TransactionOut)
def get_my_transaction_detail(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Fetch details of a specific transaction for the authenticated customer.
    """
    transaction = (
        db.query(Transaction)
        .options(
            joinedload(Transaction.items).joinedload(TransactionItem.product),
            joinedload(Transaction.store),
            joinedload(Transaction.payments)
        )
        .filter(
            Transaction.transaction_id == transaction_id,
            Transaction.customer_id == current_user.user_id
        )
        .first()
    )
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found.")
    
    return transaction

@router.get("/analytics", response_model=CustomerAnalyticsOut)
def get_my_analytics(
    period: str = Query("monthly"), # weekly, monthly, yearly
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Calculate spending analytics for the authenticated customer.
    """
    # Determine date range
    now = datetime.now()
    if period == "weekly":
        start_date = now - timedelta(days=7)
        prev_start_date = start_date - timedelta(days=7)
    elif period == "yearly":
        start_date = now - timedelta(days=365)
        prev_start_date = start_date - timedelta(days=365)
    else: # monthly
        start_date = now - timedelta(days=30)
        prev_start_date = start_date - timedelta(days=30)

    # Current period transactions
    current_txns = db.query(Transaction).filter(
        Transaction.customer_id == current_user.user_id,
        Transaction.transaction_date >= start_date
    ).all()

    total_spent = sum(float(t.total_amount) for t in current_txns)
    total_saved = sum(float(t.discount_amount) for t in current_txns)

    # Previous period totals for change calculation
    prev_txns = db.query(Transaction).filter(
        Transaction.customer_id == current_user.user_id,
        Transaction.transaction_date >= prev_start_date,
        Transaction.transaction_date < start_date
    ).all()
    
    prev_spent = sum(float(t.total_amount) for t in prev_txns)
    prev_saved = sum(float(t.discount_amount) for t in prev_txns)

    spent_change = ((total_spent - prev_spent) / prev_spent * 100) if prev_spent > 0 else 0
    saved_change = ((total_saved - prev_saved) / prev_saved * 100) if prev_saved > 0 else 0

    # Trend (simplified to 4 buckets for the mobile UI bar chart)
    trend = []
    bucket_size = (now - start_date) / 4
    for i in range(4):
        b_start = start_date + bucket_size * i
        b_end = b_start + bucket_size
        amt = sum(float(t.total_amount) for t in current_txns if b_start <= t.transaction_date < b_end)
        
        if period == "monthly":
            label = f"W{i+1}"
        elif period == "weekly":
            label = b_start.strftime("%a")
        else: # yearly
            label = f"Q{i+1}"
            
        trend.append(SpendingTrend(week=label, amount=round(amt, 2)))

    # Category Breakdown
    category_data = (
        db.query(Category.category_name, func.sum(TransactionItem.line_total))
        .join(Product, Product.category_id == Category.category_id)
        .join(TransactionItem, TransactionItem.product_id == Product.product_id)
        .join(Transaction, Transaction.transaction_id == TransactionItem.transaction_id)
        .filter(Transaction.customer_id == current_user.user_id)
        .group_by(Category.category_name)
        .all()
    )
    
    colors = ['#3b82f6', '#10b981', '#f59e0b', '#94a3b8', '#8b5cf6', '#ec4899']
    categories = []
    for i, (name, amount) in enumerate(category_data):
        categories.append(CategorySpend(
            name=name,
            amount=float(amount),
            color=colors[i % len(colors)]
        ))
    
    # Add dummy "Others" if no categories (for UI demo)
    if not categories:
        categories.append(CategorySpend(name="Others", amount=0, color="#94a3b8"))

    # Top Store
    store_data = (
        db.query(Store.store_name, func.count(Transaction.transaction_id), func.sum(Transaction.total_amount))
        .join(Transaction, Transaction.store_id == Store.store_id)
        .filter(Transaction.customer_id == current_user.user_id)
        .group_by(Store.store_name)
        .order_by(func.sum(Transaction.total_amount).desc())
        .first()
    )
    
    if store_data:
        top_store = TopStore(name=store_data[0], visits=store_data[1], spent=float(store_data[2]))
    else:
        top_store = TopStore(name="No Purchases", visits=0, spent=0)

    return CustomerAnalyticsOut(
        totalSpent=total_spent,
        totalSaved=total_saved,
        spentChange=round(spent_change, 1),
        savedChange=round(saved_change, 1),
        trend=trend,
        categories=categories,
        topStore=top_store
    )

@router.get("/summary", response_model=CustomerSummaryOut)
def get_my_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Calculate summary metrics for the current month for the authenticated customer.
    """
    now = datetime.now()
    # Current month start
    start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    # Previous month start
    first_day_prev_month = (start_of_month - timedelta(days=1)).replace(day=1)

    # Current month transactions
    current_txns = db.query(Transaction).filter(
        Transaction.customer_id == current_user.user_id,
        Transaction.transaction_date >= start_of_month
    ).all()

    total_spent = sum(float(t.total_amount) for t in current_txns)
    total_saved = sum(float(t.discount_amount) for t in current_txns)
    txn_count = len(current_txns)
    avg_spend = (total_spent / txn_count) if txn_count > 0 else 0

    # Previous month total for change calculation
    prev_spent = db.query(func.sum(Transaction.total_amount)).filter(
        Transaction.customer_id == current_user.user_id,
        Transaction.transaction_date >= first_day_prev_month,
        Transaction.transaction_date < start_of_month
    ).scalar() or 0
    
    prev_spent = float(prev_spent)
    change = ((total_spent - prev_spent) / prev_spent * 100) if prev_spent > 0 else (100 if total_spent > 0 else 0)

    # Loyalty points: 1 point per 100 NPR spent (calculated from all transactions)
    all_time_spent = db.query(func.sum(Transaction.total_amount)).filter(
        Transaction.customer_id == current_user.user_id,
        Transaction.status == "completed" # Only completed transactions count
    ).scalar() or 0
    loyalty_points = int(float(all_time_spent) / 100)

    return CustomerSummaryOut(
        total=total_spent,
        change=round(change, 1),
        txnCount=txn_count,
        avgSpend=round(avg_spend, 2),
        saved=total_saved,
        loyaltyPoints=loyalty_points
    )
