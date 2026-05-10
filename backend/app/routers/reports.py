from datetime import datetime, timedelta, timezone
from decimal import Decimal
from sqlalchemy import func, desc, extract
from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends
from typing import Optional

from app.database import get_db
from app.core.deps import require_admin
from app.models import Transaction, User, InventoryLog, Store, Payment
from app.models.enums import TransactionStatus

report_router = APIRouter(prefix="/stores/{store_id}/reports", tags=["Reports"])

def format_currency(val: Decimal) -> str:
    if val is None:
        return "Rs 0"
    if val >= 100000:
        return f"Rs {val / 100000:.1f}L"
    return f"Rs {val:,.0f}"

def time_ago(dt: datetime) -> str:
    if not dt:
        return ""
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    delta = now - dt
    if delta.total_seconds() < 60:
        return "Just now"
    elif delta.total_seconds() < 3600:
        return f"{int(delta.total_seconds() // 60)} mins ago"
    elif delta.total_seconds() < 86400:
        return f"{int(delta.total_seconds() // 3600)} hours ago"
    else:
        return f"{delta.days} days ago"

@report_router.get("/dashboard")
def get_report_dashboard(
    store_id: int,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin)
):
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    
    # Parse dates if provided
    start_date = None
    if from_date:
        try:
            start_date = datetime.strptime(from_date, "%Y-%m-%d")
        except ValueError:
            pass
    if not start_date:
        start_date = now - timedelta(days=180) # Default to 6 months
        
    end_date = None
    if to_date:
        try:
            end_date = datetime.strptime(to_date, "%Y-%m-%d")
            # Set to end of day
            end_date = end_date.replace(hour=23, minute=59, second=59)
        except ValueError:
            pass
    if not end_date:
        end_date = now

    # 1. Base Query for Transactions
    base_txn_query = db.query(Transaction).filter(
        Transaction.store_id == store_id,
        Transaction.transaction_date >= start_date,
        Transaction.transaction_date <= end_date
    )
    
    paid_txns = base_txn_query.filter(Transaction.status == TransactionStatus.completed).all()
    all_txns_count = base_txn_query.count()
    refund_count = base_txn_query.filter(Transaction.status == TransactionStatus.refunded).count()
    
    total_rev = sum(float(t.total_amount) for t in paid_txns)
    avg_bskt = total_rev / len(paid_txns) if paid_txns else 0
    ref_rate = (refund_count / all_txns_count * 100) if all_txns_count > 0 else 0

    # 2. Monthly Revenue Trend
    monthly_trend = []
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    monthly_data = {}
    for t in paid_txns:
        m_idx = t.transaction_date.month - 1
        year = t.transaction_date.year
        key = f"{months[m_idx]} {year}"
        monthly_data[key] = monthly_data.get(key, 0) + float(t.total_amount)
        
    # We show the months within the range
    curr = start_date
    seen_keys = []
    while curr <= end_date:
        key = f"{months[curr.month - 1]} {curr.year}"
        if key not in seen_keys:
            monthly_trend.append({
                "label": key,
                "value": monthly_data.get(key, 0)
            })
            seen_keys.append(key)
        # Advance to first day of next month to ensure we hit all months
        if curr.month == 12:
            curr = curr.replace(year=curr.year + 1, month=1, day=1)
        else:
            curr = curr.replace(month=curr.month + 1, day=1)
        
    # 3. Payment Method Split
    payment_split = []
    payment_stats = db.query(
        Payment.payment_method,
        func.sum(Transaction.total_amount).label("total")
    ).join(Payment, Transaction.transaction_id == Payment.transaction_id).filter(
        Transaction.store_id == store_id,
        Transaction.status == TransactionStatus.completed,
        Transaction.transaction_date >= start_date,
        Transaction.transaction_date <= end_date
    ).group_by(Payment.payment_method).all()
    
    rev_for_split = total_rev if total_rev > 0 else 1
    for method, amt in payment_stats:
        amt_val = float(amt or 0)
        pct = (amt_val / rev_for_split) * 100
        payment_split.append({
            "method": method.value if hasattr(method, 'value') else str(method).capitalize(),
            "pct": round(pct, 1),
            "amount": format_currency(amt_val),
            "bar": round(pct, 1)
        })
        
    # 4. Cashier Performance
    cashier_perf = []
    cashier_stats = db.query(
        Transaction.cashier_id,
        User.first_name,
        User.last_name,
        func.count(Transaction.transaction_id).label("txns"),
        func.sum(Transaction.total_amount).label("revenue")
    ).join(User, Transaction.cashier_id == User.user_id).filter(
        Transaction.store_id == store_id,
        Transaction.status == TransactionStatus.completed,
        Transaction.transaction_date >= start_date,
        Transaction.transaction_date <= end_date
    ).group_by(Transaction.cashier_id, User.first_name, User.last_name).all()
    
    for c_id, fname, lname, txns, rev in cashier_stats:
        rev_val = float(rev or 0)
        avg_val = rev_val / txns if txns > 0 else 0
        name = f"{fname or ''} {lname or ''}".strip()
        cashier_perf.append({
            "name": name,
            "txns": txns,
            "revenue": format_currency(rev_val),
            "avg": format_currency(avg_val)
        })
        
    cashier_perf.sort(key=lambda x: x['txns'], reverse=True)

    # 5. Audit Log Snapshot (using actual transaction/inventory dates)
    audit_log = []
    latest_txns = db.query(Transaction).filter(
        Transaction.store_id == store_id,
        Transaction.transaction_date >= start_date,
        Transaction.transaction_date <= end_date
    ).order_by(Transaction.transaction_date.desc()).limit(5).all()
    
    for t in latest_txns:
        user = db.query(User).filter(User.user_id == t.cashier_id).first()
        user_name = f"{user.first_name or ''} {user.last_name or ''}".strip() if user else "System"
        audit_log.append({
            "action": f"Transaction {t.status}",
            "by": user_name,
            "ref": t.invoice_number,
            "time": time_ago(t.transaction_date),
            "raw_time": t.transaction_date
        })
        
    latest_invs = db.query(InventoryLog).filter(
        InventoryLog.store_id == store_id,
        InventoryLog.created_at >= start_date,
        InventoryLog.created_at <= end_date
    ).order_by(InventoryLog.created_at.desc()).limit(5).all()
    
    for i in latest_invs:
        user = db.query(User).filter(User.user_id == i.performed_by).first()
        user_name = f"{user.first_name or ''} {user.last_name or ''}".strip() if user else "System"
        movement = i.movement_type.value if hasattr(i.movement_type, 'value') else str(i.movement_type)
        audit_log.append({
            "action": f"Inventory {movement}",
            "by": user_name,
            "ref": f"Prod ID: {i.product_id}",
            "time": time_ago(i.created_at),
            "raw_time": i.created_at
        })
        
    audit_log.sort(key=lambda x: x["raw_time"], reverse=True)
    audit_log = audit_log[:6]
    for log in audit_log: del log["raw_time"]
        
    return {
        "summary": {
            "totalRevenue": total_rev,
            "transactionsCount": all_txns_count,
            "avgBasket": avg_bskt,
            "refundRate": round(ref_rate, 2)
        },
        "monthlyRevenueTrend": monthly_trend,
        "paymentSplit": payment_split,
        "cashierPerformance": cashier_perf,
        "auditLog": audit_log
    }

