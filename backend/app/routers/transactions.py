from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, require_cashier
from app.database import get_db
from app.models.enums import (
    MovementType, PaymentStatus, TransactionStatus,
    InventoryReferenceType,
)
from app.models import (
    Inventory, InventoryLog, Product,
    Payment, RefundItem, Transaction, TransactionDiscount, TransactionItem,
    User
    )
from app.schemas import (
    MessageResponse, RefundCreate, TransactionCreate, TransactionOut,
)


router = APIRouter(prefix="/stores/{store_id}/transactions", tags=["Transactions"])


def _next_invoice(store_id: str, db: Session) -> str:
    """Generate sequential invoice number: INV-<store_short>-<count+1>."""
    count = db.query(Transaction).filter(
        Transaction.store_id == store_id
    ).count()
    return f"INV-{store_id[:8].upper()}-{count + 1:05d}"


@router.get("", response_model=list[TransactionOut])
def list_transactions(
    store_id: str,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    customer_id: Optional[str] = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    q = db.query(Transaction).filter(Transaction.store_id == store_id)
    if customer_id:
        q = q.filter(Transaction.customer_id == customer_id)
    items = q.order_by(Transaction.transaction_date.desc()) \
              .offset((page - 1) * size).limit(size).all()
    return items


@router.get("/{transaction_id}", response_model=TransactionOut)
def get_transaction(
    store_id: str,
    transaction_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    t = db.query(Transaction).filter(
        Transaction.transaction_id == transaction_id,
        Transaction.store_id == store_id,
    ).first()
    if not t:
        raise HTTPException(404, "Transaction not found.")
    return t



@router.post("", response_model=TransactionOut, status_code=201)
def create_transaction(
    store_id: str,
    body: TransactionCreate,
    db: Session = Depends(get_db),
    cashier: User = Depends(require_cashier),
):
    """
    Create and complete a billing transaction.
    Validates stock, computes totals, records payment, decrements inventory.
    """
    subtotal = 0.0
    tax_total = 0.0
    item_rows = []

    for item_in in body.items:
        product = db.query(Product).filter(
            Product.product_id == item_in.product_id,
            Product.store_id == store_id,
            Product.is_active == True,
        ).first()
        if not product:
            raise HTTPException(404, f"Product {item_in.product_id} not found.")

        inv = db.query(Inventory).filter(
            Inventory.product_id == item_in.product_id
        ).first()
        if not inv or inv.quantity_in_stock < item_in.quantity:
            raise HTTPException(
                400,
                f"Insufficient stock for '{product.product_name}'. "
                f"Available: {inv.quantity_in_stock if inv else 0}.",
            )

        unit_price = float(product.unit_price)
        line_discount = 0.0
        line_total = unit_price * item_in.quantity - line_discount
        tax = line_total * float(product.tax_rate) / 100

        subtotal += line_total
        tax_total += tax
        item_rows.append((product, inv, item_in, unit_price, line_discount, line_total))

    # Session-level discount total
    session_discount = 0.0

    total = subtotal + tax_total - session_discount

    txn = Transaction(
        invoice_number=_next_invoice(store_id, db),
        store_id=store_id,
        cashier_id=cashier.user_id,
        customer_id=body.customer_id,
        subtotal=subtotal,
        tax_amount=tax_total,
        discount_amount=session_discount,
        total_amount=total,
        status=TransactionStatus.completed,
    )
    db.add(txn)
    db.flush()

    for product, inv, item_in, unit_price, line_discount, line_total in item_rows:
        before = inv.quantity_in_stock
        inv.quantity_in_stock -= item_in.quantity

        db.add(TransactionItem(
            transaction_id=txn.transaction_id,
            product_id=product.product_id,
            quantity=item_in.quantity,
            unit_price_at_sale=unit_price,
            discount_id=item_in.discount_id,
            discount=line_discount,
            line_total=line_total,
        ))
        db.add(InventoryLog(
            inventory_id=inv.inventory_id,
            product_id=product.product_id,
            store_id=store_id,
            movement_type=MovementType.sale,
            quantity_change=-item_in.quantity,
            quantity_before=before,
            quantity_after=inv.quantity_in_stock,
            reference_type=InventoryReferenceType.transaction,
            reference_id=txn.transaction_id,
            performed_by=cashier.user_id,
        ))

    db.add(Payment(
        transaction_id=txn.transaction_id,
        payment_method=body.payment_method,
        amount=total,
        payment_status=PaymentStatus.completed,
        paid_at=datetime.now(timezone.utc),
    ))

    db.commit()
    db.refresh(txn)
    return txn

# Refunds
refund_router = APIRouter(
    prefix="/stores/{store_id}/refunds", tags=["Refunds"]
)


@refund_router.post("", status_code=201)
def process_refund(
    store_id: str,
    body: RefundCreate,
    db: Session = Depends(get_db),
    cashier: User = Depends(require_cashier),
):
    original = db.query(Transaction).filter(
        Transaction.transaction_id == body.original_transaction_id,
        Transaction.store_id == store_id,
    ).first()
    if not original:
        raise HTTPException(404, "Original transaction not found.")

    item = next(
        (i for i in original.items if i.product_id == body.product_id), None
    )
    if not item:
        raise HTTPException(400, "Product not in original transaction.")
    if body.quantity_returned > item.quantity:
        raise HTTPException(400, "Return quantity exceeds original quantity.")

    refund_amount = float(item.unit_price_at_sale) * body.quantity_returned

    # Create a refund "transaction" record
    refund_txn = Transaction(
        invoice_number=_next_invoice(store_id, db),
        store_id=store_id,
        cashier_id=cashier.user_id,
        subtotal=-refund_amount,
        tax_amount=0,
        discount_amount=0,
        total_amount=-refund_amount,
        status=TransactionStatus.refunded,
    )
    db.add(refund_txn)
    db.flush()

    db.add(RefundItem(
        original_transaction_id=body.original_transaction_id,
        refund_transaction_id=refund_txn.transaction_id,
        product_id=body.product_id,
        quantity_returned=body.quantity_returned,
        refund_amount=refund_amount,
        reason=body.reason,
        notes=body.notes,
        processed_by=cashier.user_id,
    ))

    # Return stock
    inv = db.query(Inventory).filter(Inventory.product_id == body.product_id).first()
    if inv:
        before = inv.quantity_in_stock
        inv.quantity_in_stock += body.quantity_returned
        db.add(InventoryLog(
            inventory_id=inv.inventory_id,
            product_id=body.product_id,
            store_id=store_id,
            movement_type=MovementType.refund,
            quantity_change=body.quantity_returned,
            quantity_before=before,
            quantity_after=inv.quantity_in_stock,
            reference_type=InventoryReferenceType.transaction,
            reference_id=body.original_transaction_id,
            performed_by=cashier.user_id,
        ))

    db.commit()
    return MessageResponse(message=f"Refund of NPR {refund_amount:.2f} processed.")