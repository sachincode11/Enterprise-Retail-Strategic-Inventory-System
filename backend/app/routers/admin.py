"""
Supplier, Purchase-Order, User-management, Store-admin, Notification routers.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, require_admin, require_cashier
from app.database import get_db

from app.models import (
    PurchaseOrder, PurchaseOrderItem, Supplier, ProductSupplier,
    Notification,
    User, UserRole as UserRoleModel, Role, StoreFAQ, StorePolicy,

)
from app.models.enums import NotificationStatus, UserRole as UserRoleEnum

from app.schemas import (
    AssignRoleRequest, FAQCreate, FAQOut, MessageResponse,
    NotificationOut, PolicyCreate, PolicyOut,
    PurchaseOrderCreate, PurchaseOrderOut,
    SupplierCreate, SupplierOut, UserOut,
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