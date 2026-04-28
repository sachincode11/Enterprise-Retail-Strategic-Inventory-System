"""
Supplier, Purchase-Order, User-management, Discount, Staff, Store-admin, Notification routers.
"""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, require_admin, require_cashier
from app.database import get_db

from app.models import (
    Discount, PurchaseOrder, PurchaseOrderItem, Store, Supplier, ProductSupplier,
    Inventory, InventoryLog,
    Notification,
    User, UserRole as UserRoleModel, Role, StoreFAQ, StorePolicy,
)
from app.models.enums import (
    InventoryReferenceType,
    MovementType,
    NotificationStatus,
    PurchaseOrderStatus,
    UserRole as UserRoleEnum,
)

from app.schemas import (
    AssignRoleRequest, DiscountCreate, DiscountOut, DiscountUpdate,
    FAQCreate, FAQOut, MessageResponse,
    NotificationOut, PolicyCreate, PolicyOut,
    PurchaseOrderCreate, PurchaseOrderOut, PurchaseOrderStatusUpdate,
    StaffOut, StoreOut, SupplierCreate, SupplierOut, UserOut,
)


# Suppliers
supplier_router = APIRouter(
    prefix="/stores/{store_id}/suppliers", tags=["Suppliers"]
)


@supplier_router.get("", response_model=list[SupplierOut])
def list_suppliers(store_id: str, db: Session = Depends(get_db),
                   _: User = Depends(require_admin)):
    return db.query(Supplier).filter(Supplier.store_id == store_id,
                                      Supplier.is_active == True).all()


@supplier_router.post("", response_model=SupplierOut, status_code=201)
def create_supplier(store_id: str, body: SupplierCreate,
                    db: Session = Depends(get_db), _: User = Depends(require_admin)):
    s = Supplier(store_id=store_id, **body.model_dump())
    db.add(s)
    db.commit()
    db.refresh(s)
    return s


@supplier_router.patch("/{supplier_id}", response_model=SupplierOut)
def update_supplier(store_id: str, supplier_id: str, body: SupplierCreate,
                    db: Session = Depends(get_db), _: User = Depends(require_admin)):
    s = db.query(Supplier).filter(Supplier.supplier_id == supplier_id,
                                    Supplier.store_id == store_id).first()
    if not s:
        raise HTTPException(404, "Supplier not found.")
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(s, k, v)
    db.commit()
    db.refresh(s)
    return s


@supplier_router.delete("/{supplier_id}", response_model=MessageResponse)
def delete_supplier(store_id: str, supplier_id: str,
                    db: Session = Depends(get_db), _: User = Depends(require_admin)):
    s = db.query(Supplier).filter(Supplier.supplier_id == supplier_id,
                                    Supplier.store_id == store_id).first()
    if not s:
        raise HTTPException(404, "Supplier not found.")
    s.is_active = False
    db.commit()
    return MessageResponse(message="Supplier deactivated.")


# Purchase Orders
po_router = APIRouter(
    prefix="/stores/{store_id}/purchase-orders", tags=["Purchase Orders"]
)


@po_router.get("", response_model=list[PurchaseOrderOut])
def list_orders(store_id: str, db: Session = Depends(get_db),
                _: User = Depends(require_admin)):
    return db.query(PurchaseOrder).filter(
        PurchaseOrder.store_id == store_id
    ).order_by(PurchaseOrder.order_date.desc()).all()


@po_router.post("", response_model=PurchaseOrderOut, status_code=201)
def create_order(store_id: str, body: PurchaseOrderCreate,
                 db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    order = PurchaseOrder(
        store_id=store_id,
        supplier_id=body.supplier_id,
        ordered_by=admin.user_id,
        expected_date=body.expected_date,
        notes=body.notes,
    )
    db.add(order)
    db.flush()
    for i in body.items:
        db.add(PurchaseOrderItem(order_id=order.order_id, **i.model_dump()))
    db.commit()
    db.refresh(order)
    return order


@po_router.patch("/{order_id}/status", response_model=PurchaseOrderOut)
def update_order_status(
    store_id: str,
    order_id: int,
    body: PurchaseOrderStatusUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    order = db.query(PurchaseOrder).filter(
        PurchaseOrder.order_id == order_id,
        PurchaseOrder.store_id == store_id,
    ).first()
    if not order:
        raise HTTPException(404, "Purchase order not found.")

    if order.status == PurchaseOrderStatus.received and body.status != PurchaseOrderStatus.received:
        raise HTTPException(400, "Received purchase orders cannot be moved to another status.")

    receipt_map = {item.product_id: item.quantity_received for item in body.items}
    now_utc = datetime.now(timezone.utc).replace(tzinfo=None)

    if body.status in {PurchaseOrderStatus.partial, PurchaseOrderStatus.received}:
        for po_item in order.items:
            default_received = po_item.quantity_ordered if body.status == PurchaseOrderStatus.received else (po_item.quantity_received or 0)
            target_received = receipt_map.get(po_item.product_id, default_received)
            if target_received < 0:
                raise HTTPException(400, "Received quantity cannot be negative.")
            if target_received > po_item.quantity_ordered:
                raise HTTPException(
                    400,
                    f"Received quantity exceeds ordered quantity for product {po_item.product_id}.",
                )

            previous_received = po_item.quantity_received or 0
            if target_received < previous_received:
                raise HTTPException(
                    400,
                    f"Received quantity cannot be reduced for product {po_item.product_id}.",
                )

            delta = target_received - previous_received
            po_item.quantity_received = target_received
            if delta <= 0:
                continue

            inv = db.query(Inventory).filter(
                Inventory.product_id == po_item.product_id,
                Inventory.store_id == store_id,
            ).first()
            if not inv:
                inv = Inventory(product_id=po_item.product_id, store_id=store_id, quantity_in_stock=0)
                db.add(inv)
                db.flush()

            before = inv.quantity_in_stock
            inv.quantity_in_stock = before + delta
            inv.last_restocked_at = now_utc

            db.add(InventoryLog(
                inventory_id=inv.inventory_id,
                product_id=po_item.product_id,
                store_id=store_id,
                movement_type=MovementType.restock,
                quantity_change=delta,
                quantity_before=before,
                quantity_after=inv.quantity_in_stock,
                reference_type=InventoryReferenceType.manual,
                reference_id=order.order_id,
                notes=f"Stock received from purchase order #{order.order_id}",
                performed_by=admin.user_id,
            ))

    if body.status == PurchaseOrderStatus.received:
        order.received_date = now_utc
    else:
        order.received_date = None

    order.status = body.status
    db.commit()
    db.refresh(order)
    return order


# User management  (admin only)
user_router = APIRouter(prefix="/users", tags=["User Management"])


@user_router.get("", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return db.query(User).all()


@user_router.patch("/{user_id}/deactivate", response_model=MessageResponse)
def deactivate_user(user_id: str, db: Session = Depends(get_db),
                    _: User = Depends(require_admin)):
    u = db.query(User).filter(User.user_id == user_id).first()
    if not u:
        raise HTTPException(404, "User not found.")
    u.is_active = False
    db.commit()
    return MessageResponse(message="User deactivated.")


@user_router.patch("/{user_id}/activate", response_model=MessageResponse)
def activate_user(user_id: str, db: Session = Depends(get_db),
                  _: User = Depends(require_admin)):
    u = db.query(User).filter(User.user_id == user_id).first()
    if not u:
        raise HTTPException(404, "User not found.")
    u.is_active = True
    db.commit()
    return MessageResponse(message="User reactivated.")


@user_router.post("/assign-role", response_model=MessageResponse)
def assign_role(body: AssignRoleRequest, db: Session = Depends(get_db),
                _: User = Depends(require_admin)):
    role = db.query(Role).filter(Role.role_name == body.role).first()
    if not role:
        raise HTTPException(404, f"Role '{body.role}' not found.")
    ur = UserRoleModel(user_id=body.user_id, role_id=role.role_id,
                       store_id=body.store_id)
    db.add(ur)
    db.commit()
    return MessageResponse(message=f"Role '{body.role}' assigned.")


# Store FAQ & Policy  (admin only)
faq_router = APIRouter(prefix="/stores/{store_id}/faqs", tags=["Store FAQ"])

@faq_router.get("", response_model=list[FAQOut])
def list_faqs(store_id: str, db: Session = Depends(get_db),
              _: User = Depends(get_current_user)):
    return db.query(StoreFAQ).filter(StoreFAQ.store_id == store_id,
                                     StoreFAQ.is_active == True).all()


@faq_router.post("", response_model=FAQOut, status_code=201)
def create_faq(store_id: str, body: FAQCreate, db: Session = Depends(get_db),
               _: User = Depends(require_admin)):
    f = StoreFAQ(store_id=store_id, **body.model_dump())
    db.add(f)
    db.commit()
    db.refresh(f)
    return f


@faq_router.delete("/{faq_id}", response_model=MessageResponse)
def delete_faq(store_id: str, faq_id: str, db: Session = Depends(get_db),
               _: User = Depends(require_admin)):
    f = db.query(StoreFAQ).filter(StoreFAQ.faq_id == faq_id,
                                   StoreFAQ.store_id == store_id).first()
    if not f:
        raise HTTPException(404, "FAQ not found.")
    f.is_active = False
    db.commit()
    return MessageResponse(message="FAQ deleted.")


policy_router = APIRouter(prefix="/stores/{store_id}/policies", tags=["Store Policies"])


@policy_router.get("", response_model=list[PolicyOut])
def list_policies(store_id: str, db: Session = Depends(get_db),
                  _: User = Depends(get_current_user)):
    return db.query(StorePolicy).filter(StorePolicy.store_id == store_id,
                                         StorePolicy.is_active == True).all()


@policy_router.post("", response_model=PolicyOut, status_code=201)
def create_policy(store_id: str, body: PolicyCreate,
                  db: Session = Depends(get_db), _: User = Depends(require_admin)):
    p = StorePolicy(store_id=store_id, **body.model_dump())
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


# Notifications
notif_router = APIRouter(prefix="/notifications", tags=["Notifications"])


@notif_router.get("", response_model=list[NotificationOut])
def my_notifications(
    unread_only: bool = Query(False),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(Notification).filter(Notification.user_id == current_user.user_id)
    if unread_only:
        q = q.filter(Notification.read_at == None)
    return q.order_by(Notification.created_at.desc()).all()


@notif_router.patch("/{notification_id}/read", response_model=MessageResponse)
def mark_read(notification_id: str, current_user: User = Depends(get_current_user),
              db: Session = Depends(get_db)):
    from datetime import datetime, timezone
    n = db.query(Notification).filter(
        Notification.notification_id == notification_id,
        Notification.user_id == current_user.user_id,
    ).first()
    if not n:
        raise HTTPException(404, "Notification not found.")
    n.read_at = datetime.now(timezone.utc)
    n.status = NotificationStatus.read
    db.commit()
    return MessageResponse(message="Notification marked as read.")


# ── Discounts ─────────────────────────────────────────────────────────────────
discount_router = APIRouter(
    prefix="/stores/{store_id}/discounts", tags=["Discounts"]
)


@discount_router.get("", response_model=list[DiscountOut])
def list_discounts(
    store_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return (
        db.query(Discount)
        .filter(Discount.store_id == store_id, Discount.is_active == True)
        .all()
    )


@discount_router.post("", response_model=DiscountOut, status_code=201)
def create_discount(
    store_id: int,
    body: DiscountCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    d = Discount(store_id=store_id, **body.model_dump())
    db.add(d)
    db.commit()
    db.refresh(d)
    return d


@discount_router.patch("/{discount_id}", response_model=DiscountOut)
def update_discount(
    store_id: int,
    discount_id: int,
    body: DiscountUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    d = db.query(Discount).filter(
        Discount.discount_id == discount_id,
        Discount.store_id == store_id,
    ).first()
    if not d:
        raise HTTPException(404, "Discount not found.")
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(d, k, v)
    db.commit()
    db.refresh(d)
    return d


@discount_router.delete("/{discount_id}", response_model=MessageResponse)
def delete_discount(
    store_id: int,
    discount_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    d = db.query(Discount).filter(
        Discount.discount_id == discount_id,
        Discount.store_id == store_id,
    ).first()
    if not d:
        raise HTTPException(404, "Discount not found.")
    d.is_active = False
    db.commit()
    return MessageResponse(message="Discount deactivated.")


# ── Staff (cashiers + admins for a store) ─────────────────────────────────────
staff_router = APIRouter(
    prefix="/stores/{store_id}/staff", tags=["Staff"]
)


@staff_router.get("", response_model=list[StaffOut])
def list_staff(
    store_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    """Return all active admin/cashier users for the given store."""
    allowed_roles = {UserRoleEnum.admin.value, UserRoleEnum.cashier.value}
    role_rows = (
        db.query(UserRoleModel)
        .join(Role, UserRoleModel.role_id == Role.role_id)
        .filter(
            UserRoleModel.store_id == store_id,
            UserRoleModel.is_active == True,
            Role.role_name.in_(allowed_roles),
        )
        .all()
    )
    seen = set()
    result = []
    for ur in role_rows:
        user = ur.user
        role = ur.role
        if user.user_id in seen:
            continue
        seen.add(user.user_id)
        full_name = " ".join(filter(None, [user.first_name, user.last_name]))
        result.append(
            StaffOut(
                user_id=user.user_id,
                name=full_name,
                email=user.email,
                phone=user.phone,
                role=str(role.role_name),
                store_id=ur.store_id,
                is_active=user.is_active,
                created_at=user.created_at,
            )
        )
    return result


# ── Customers (registered users with customer role) ───────────────────────────
customer_router = APIRouter(
    prefix="/stores/{store_id}/customers", tags=["Customers"]
)


@customer_router.get("", response_model=list[UserOut])
def list_customers(
    store_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    """Return all registered customer users (customer role)."""
    customer_users = (
        db.query(User)
        .join(UserRoleModel, User.user_id == UserRoleModel.user_id)
        .join(Role, UserRoleModel.role_id == Role.role_id)
        .filter(
            Role.role_name == UserRoleEnum.customer.value,
            UserRoleModel.is_active == True,
            User.is_active == True,
        )
        .all()
    )
    return customer_users


# ── Store detail ──────────────────────────────────────────────────────────────
store_router = APIRouter(prefix="/stores", tags=["Stores"])


@store_router.get("/{store_id}", response_model=StoreOut)
def get_store(
    store_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    store = db.query(Store).filter(Store.store_id == store_id).first()
    if not store:
        raise HTTPException(404, "Store not found.")
    return store
