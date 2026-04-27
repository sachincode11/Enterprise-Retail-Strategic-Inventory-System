"""
Product & Inventory routers.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, require_admin, require_cashier
from app.database import get_db
from app.models.enums import InventoryReferenceType
from app.models import (
    Category, Inventory, InventoryLog, ProductPriceHistory, Product, User
)
from app.schemas import (
    CategoryCreate, CategoryOut, InventoryAdjust, InventoryOut,
    MessageResponse, PaginatedResponse, ProductCreate, ProductOut, ProductUpdate,
)

# Categories
cat_router = APIRouter(prefix="/stores/{store_id}/categories", tags=["Categories"])

@cat_router.get("", response_model=list[CategoryOut])
def list_categories(
    store_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return db.query(Category).filter(Category.store_id == store_id).all()


@cat_router.post("", response_model=CategoryOut, status_code=201)
def create_category(
    store_id: str,
    body: CategoryCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    cat = Category(store_id=store_id, **body.model_dump())
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat


@cat_router.delete("/{category_id}", response_model=MessageResponse)
def delete_category(
    store_id: str,
    category_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    cat = db.query(Category).filter(
        Category.category_id == category_id, Category.store_id == store_id
    ).first()
    if not cat:
        raise HTTPException(404, "Category not found.")
    db.delete(cat)
    db.commit()
    return MessageResponse(message="Category deleted.")


# Products
prod_router = APIRouter(prefix="/stores/{store_id}/products", tags=["Products"])


@prod_router.get("", response_model=PaginatedResponse)
def list_products(
    store_id: str,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    search: str | None = Query(None),
    category_id: str | None = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = db.query(Product).filter(Product.store_id == store_id, Product.is_active == True)
    if search:
        like = f"%{search}%"
        q = q.filter(
            Product.product_name.ilike(like) | Product.barcode.ilike(like)
        )
    if category_id:
        q = q.filter(Product.category_id == category_id)
    total = q.count()
    items = q.offset((page - 1) * size).limit(size).all()
    return PaginatedResponse(total=total, page=page, size=size,
                             items=[ProductOut.model_validate(p) for p in items])


@prod_router.get("/{product_id}", response_model=ProductOut)
def get_product(
    store_id: str,
    product_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    p = db.query(Product).filter(
        Product.product_id == product_id, Product.store_id == store_id
    ).first()
    if not p:
        raise HTTPException(404, "Product not found.")
    return p


@prod_router.get("/barcode/{barcode}", response_model=ProductOut)
def get_product_by_barcode(
    store_id: str,
    barcode: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_cashier),
):
    p = db.query(Product).filter(
        Product.barcode == barcode, Product.store_id == store_id,
        Product.is_active == True
    ).first()
    if not p:
        raise HTTPException(404, f"No product found for barcode '{barcode}'.")
    return p


@prod_router.post("", response_model=ProductOut, status_code=201)
def create_product(
    store_id: str,
    body: ProductCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    if db.query(Product).filter(Product.barcode == body.barcode,
                                  Product.store_id == store_id).first():
        raise HTTPException(400, "Barcode already exists in this store.")
    p = Product(store_id=store_id, **body.model_dump())
    db.add(p)
    db.flush()

    # Initialise inventory row
    db.add(Inventory(product_id=p.product_id, store_id=store_id,
                     quantity_in_stock=0))
    db.commit()
    db.refresh(p)
    return p


@prod_router.patch("/{product_id}", response_model=ProductOut)
def update_product(
    store_id: str,
    product_id: str,
    body: ProductUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    p = db.query(Product).filter(
        Product.product_id == product_id, Product.store_id == store_id
    ).first()
    if not p:
        raise HTTPException(404, "Product not found.")

    old_price = p.unit_price
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(p, field, value)

    # Record price history if price changed
    if body.unit_price and body.unit_price != old_price:
        db.add(ProductPriceHistory(
            product_id=p.product_id,
            old_price=old_price,
            new_price=body.unit_price,
            changed_by=admin.user_id,
        ))

    db.commit()
    db.refresh(p)
    return p


@prod_router.delete("/{product_id}", response_model=MessageResponse)
def deactivate_product(
    store_id: str,
    product_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    """Soft-delete: set is_active = False."""
    p = db.query(Product).filter(
        Product.product_id == product_id, Product.store_id == store_id
    ).first()
    if not p:
        raise HTTPException(404, "Product not found.")
    p.is_active = False
    db.commit()
    return MessageResponse(message="Product deactivated.")


# Inventory
inv_router = APIRouter(prefix="/stores/{store_id}/inventory", tags=["Inventory"])

@inv_router.get("", response_model=list[InventoryOut])
def list_inventory(
    store_id: str,
    low_stock: bool = Query(False),
    db: Session = Depends(get_db),
    _: User = Depends(require_cashier),
):
    q = db.query(Inventory).filter(Inventory.store_id == store_id)
    if low_stock:
        q = q.filter(
            Inventory.reorder_level != None,
            Inventory.quantity_in_stock <= Inventory.reorder_level,
        )
    return q.all()


@inv_router.post("/{product_id}/adjust", response_model=InventoryOut)
def adjust_inventory(
    store_id: str,
    product_id: str,
    body: InventoryAdjust,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    inv = db.query(Inventory).filter(
        Inventory.product_id == product_id, Inventory.store_id == store_id
    ).first()
    if not inv:
        raise HTTPException(404, "Inventory record not found.")

    before = inv.quantity_in_stock
    inv.quantity_in_stock = max(0, before + body.quantity_change)

    log = InventoryLog(
        inventory_id=inv.inventory_id,
        product_id=product_id,
        store_id=store_id,
        movement_type=body.movement_type,
        quantity_change=body.quantity_change,
        quantity_before=before,
        quantity_after=inv.quantity_in_stock,
        reference_type=body.reference_type,
        reference_id=body.reference_id,
        notes=body.notes,
        performed_by=admin.user_id,
    )
    db.add(log)
    db.commit()
    db.refresh(inv)
    return inv