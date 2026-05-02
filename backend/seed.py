"""
Database seed script for ERSIS.

Usage:
    python seed.py
"""

from datetime import datetime, timedelta
from decimal import Decimal
import random
import string

from sqlalchemy import text
from app.core.security import hash_password
from app.database import Base, SessionLocal, engine
from app.models import (
    Category,
    Discount,
    Inventory,
    Product,
    ProductSupplier,
    PurchaseOrder,
    PurchaseOrderItem,
    Role,
    Store,
    Supplier,
    User,
    UserRole,
    Transaction,
    TransactionItem,
    Payment,
)
from app.models.enums import (
    DiscountAppliesTo,
    DiscountType,
    PurchaseOrderStatus,
    TransactionStatus,
    PaymentMethod,
    PaymentStatus,
    UserRole as UserRoleEnum,
)


def _seed_roles(db) -> dict[str, Role]:
    roles: dict[str, Role] = {}
    for enum_role in UserRoleEnum:
        role = db.query(Role).filter(Role.role_name == enum_role).first()
        if not role:
            role = Role(role_name=enum_role, description=f"{enum_role.value} role")
            db.add(role)
            db.flush()
        roles[enum_role.value] = role
    return roles


def _seed_users(db) -> dict[str, User]:
    user_specs = [
        {
            "username": "admin",
            "email": "admin@store.np",
            "first_name": "System",
            "last_name": "Admin",
            "phone": "9800000001",
        },
        {
            "username": "cashier",
            "email": "cashier@store.np",
            "first_name": "Frontdesk",
            "last_name": "Cashier",
            "phone": "9800000002",
        },
        {
            "username": "customer",
            "email": "customer@store.np",
            "first_name": "Demo",
            "last_name": "Customer",
            "phone": "9800000003",
        },
        {
            "username": "staff1",
            "email": "staff1@store.np",
            "first_name": "Staff",
            "last_name": "One",
            "phone": "9800000004",
        },
        {
            "username": "admin2",
            "email": "admin2@store.np",
            "first_name": "System",
            "last_name": "Admin Two",
            "phone": "9800000005",
        },
    ]

    users: dict[str, User] = {}
    for spec in user_specs:
        user = db.query(User).filter(User.email == spec["email"]).first()
        if not user:
            user = User(
                username=spec["username"],
                email=spec["email"],
                password_hash=hash_password("Admin@123"),
                first_name=spec["first_name"],
                last_name=spec["last_name"],
                phone=spec["phone"],
                is_active=True,
            )
            db.add(user)
            db.flush()
        users[spec["email"]] = user
    return users


def _seed_store(db, owner_id: int) -> Store:
    store = db.query(Store).filter(Store.store_id == 1).first()
    if store:
        return store

    store = Store(
        store_name="Default Store",
        owner_id=owner_id,
        address="Kathmandu, Nepal",
        contact_email="store@ersis.com",
        contact_phone="9801000000",
        is_active=True,
    )
    db.add(store)
    db.flush()
    return store


def _ensure_user_role(db, user_id: int, role_id: int, store_id: int) -> None:
    row = (
        db.query(UserRole)
        .filter(
            UserRole.user_id == user_id,
            UserRole.role_id == role_id,
            UserRole.store_id == store_id,
        )
        .first()
    )
    if not row:
        db.add(UserRole(user_id=user_id, role_id=role_id, store_id=store_id, is_active=True))


def _seed_categories(db, store_id: int) -> dict[str, Category]:
    category_specs = ["Beverages", "Snacks", "Personal Care", "Dairy", "Bakery", "Produce", "Meat", "Household", "Electronics", "Stationery"]
    categories: dict[str, Category] = {}
    for name in category_specs:
        category = (
            db.query(Category)
            .filter(Category.store_id == store_id, Category.category_name == name)
            .first()
        )
        if not category:
            category = Category(
                store_id=store_id,
                category_name=name,
                description=f"{name} category",
            )
            db.add(category)
            db.flush()
        categories[name] = category
    return categories


def _seed_products(db, store_id: int, categories: dict[str, Category]) -> dict[str, Product]:
    product_specs = [
        {
            "name": "Coca Cola 500ml",
            "barcode": "100000000001",
            "sku": "BEV-COKE-500",
            "category": "Beverages",
            "price": Decimal("120.00"),
            "tax_rate": Decimal("13.00"),
            "uom": "bottle",
        },
        {
            "name": "Potato Chips 100g",
            "barcode": "100000000002",
            "sku": "SNK-POT-100",
            "category": "Snacks",
            "price": Decimal("80.00"),
            "tax_rate": Decimal("13.00"),
            "uom": "pack",
        },
        {
            "name": "Hand Wash 250ml",
            "barcode": "100000000003",
            "sku": "PC-HW-250",
            "category": "Personal Care",
            "price": Decimal("150.00"),
            "tax_rate": Decimal("13.00"),
            "uom": "bottle",
        },
        {
            "name": "Pepsi 500ml",
            "barcode": "100000000004",
            "sku": "BEV-PEPSI-500",
            "category": "Beverages",
            "price": Decimal("115.00"),
            "tax_rate": Decimal("13.00"),
            "uom": "bottle",
        },
        {
            "name": "Lays Classic 50g",
            "barcode": "100000000005",
            "sku": "SNK-LAYS-50",
            "category": "Snacks",
            "price": Decimal("50.00"),
            "tax_rate": Decimal("13.00"),
            "uom": "pack",
        },
        {
            "name": "Dove Soap 100g",
            "barcode": "100000000006",
            "sku": "PC-DOVE-100",
            "category": "Personal Care",
            "price": Decimal("65.00"),
            "tax_rate": Decimal("13.00"),
            "uom": "piece",
        },
        {
            "name": "Full Cream Milk 1L",
            "barcode": "100000000007",
            "sku": "DRY-MILK-1L",
            "category": "Dairy",
            "price": Decimal("110.00"),
            "tax_rate": Decimal("0.00"),
            "uom": "packet",
        },
        {
            "name": "Brown Bread 400g",
            "barcode": "100000000008",
            "sku": "BKY-BREAD-400",
            "category": "Bakery",
            "price": Decimal("90.00"),
            "tax_rate": Decimal("0.00"),
            "uom": "pack",
        },
        {
            "name": "Red Bull 250ml",
            "barcode": "100000000009",
            "sku": "BEV-RB-250",
            "category": "Beverages",
            "price": Decimal("250.00"),
            "tax_rate": Decimal("13.00"),
            "uom": "can",
        },
        {
            "name": "Kurkure 100g",
            "barcode": "100000000010",
            "sku": "SNK-KUR-100",
            "category": "Snacks",
            "price": Decimal("50.00"),
            "tax_rate": Decimal("13.00"),
            "uom": "pack",
        },
        {
            "name": "Shampoo 200ml",
            "barcode": "100000000011",
            "sku": "PC-SHMP-200",
            "category": "Personal Care",
            "price": Decimal("280.00"),
            "tax_rate": Decimal("13.00"),
            "uom": "bottle",
        },
        {
            "name": "Cheddar Cheese 200g",
            "barcode": "100000000012",
            "sku": "DRY-CHZ-200",
            "category": "Dairy",
            "price": Decimal("450.00"),
            "tax_rate": Decimal("13.00"),
            "uom": "pack",
        },
        {
            "name": "Chocolate Cake 500g",
            "barcode": "100000000013",
            "sku": "BKY-CAKE-500",
            "category": "Bakery",
            "price": Decimal("600.00"),
            "tax_rate": Decimal("13.00"),
            "uom": "piece",
        },
        {
            "name": "Apple 1kg",
            "barcode": "100000000014",
            "sku": "PRO-APP-1KG",
            "category": "Produce",
            "price": Decimal("250.00"),
            "tax_rate": Decimal("0.00"),
            "uom": "kg",
        },
        {
            "name": "Banana 1 Dozen",
            "barcode": "100000000015",
            "sku": "PRO-BAN-1DZ",
            "category": "Produce",
            "price": Decimal("120.00"),
            "tax_rate": Decimal("0.00"),
            "uom": "dozen",
        },
        {
            "name": "Chicken Breast 1kg",
            "barcode": "100000000016",
            "sku": "MEA-CHK-1KG",
            "category": "Meat",
            "price": Decimal("450.00"),
            "tax_rate": Decimal("0.00"),
            "uom": "kg",
        },
        {
            "name": "Dishwashing Liquid 500ml",
            "barcode": "100000000017",
            "sku": "HOU-DISH-500",
            "category": "Household",
            "price": Decimal("180.00"),
            "tax_rate": Decimal("13.00"),
            "uom": "bottle",
        },
        {
            "name": "AA Batteries 4-pack",
            "barcode": "100000000018",
            "sku": "ELE-BATT-AA4",
            "category": "Electronics",
            "price": Decimal("150.00"),
            "tax_rate": Decimal("13.00"),
            "uom": "pack",
        },
        {
            "name": "A4 Paper Ream",
            "barcode": "100000000019",
            "sku": "STA-A4-500",
            "category": "Stationery",
            "price": Decimal("650.00"),
            "tax_rate": Decimal("13.00"),
            "uom": "ream",
        },
        {
            "name": "Blue Pen",
            "barcode": "100000000020",
            "sku": "STA-PEN-BLU",
            "category": "Stationery",
            "price": Decimal("20.00"),
            "tax_rate": Decimal("13.00"),
            "uom": "piece",
        },
        {
            "name": "USB Cable 1m",
            "barcode": "100000000021",
            "sku": "ELE-USB-1M",
            "category": "Electronics",
            "price": Decimal("300.00"),
            "tax_rate": Decimal("13.00"),
            "uom": "piece",
        },
        {
            "name": "Laundry Detergent 1kg",
            "barcode": "100000000022",
            "sku": "HOU-DET-1KG",
            "category": "Household",
            "price": Decimal("250.00"),
            "tax_rate": Decimal("13.00"),
            "uom": "pack",
        },
        {
            "name": "Mutton 1kg",
            "barcode": "100000000023",
            "sku": "MEA-MUT-1KG",
            "category": "Meat",
            "price": Decimal("1200.00"),
            "tax_rate": Decimal("0.00"),
            "uom": "kg",
        },
        {
            "name": "Orange 1kg",
            "barcode": "100000000024",
            "sku": "PRO-ORG-1KG",
            "category": "Produce",
            "price": Decimal("200.00"),
            "tax_rate": Decimal("0.00"),
            "uom": "kg",
        },
        {
            "name": "Toothpaste 150g",
            "barcode": "100000000025",
            "sku": "PC-TP-150",
            "category": "Personal Care",
            "price": Decimal("120.00"),
            "tax_rate": Decimal("13.00"),
            "uom": "tube",
        },
    ]

    products: dict[str, Product] = {}
    for spec in product_specs:
        product = (
            db.query(Product)
            .filter(Product.store_id == store_id, Product.barcode == spec["barcode"])
            .first()
        )
        if not product:
            product = Product(
                store_id=store_id,
                category_id=categories[spec["category"]].category_id,
                product_name=spec["name"],
                barcode=spec["barcode"],
                sku=spec["sku"],
                description=f"Seed product: {spec['name']}",
                unit_price=spec["price"],
                tax_rate=spec["tax_rate"],
                unit_of_measure=spec["uom"],
                is_active=True,
            )
            db.add(product)
            db.flush()
        products[spec["barcode"]] = product
    return products


def _seed_inventory(db, store_id: int, products: dict[str, Product]) -> None:
    for barcode, product in products.items():
        row = (
            db.query(Inventory)
            .filter(Inventory.store_id == store_id, Inventory.product_id == product.product_id)
            .first()
        )
        if row:
            continue
        qty = 25 if barcode.endswith("1") else 40
        db.add(
            Inventory(
                product_id=product.product_id,
                store_id=store_id,
                quantity_in_stock=qty,
                reorder_level=10,
            )
        )


def _seed_supplier_and_links(db, store_id: int, products: dict[str, Product]) -> tuple[Supplier, Supplier]:
    supplier1 = (
        db.query(Supplier)
        .filter(Supplier.store_id == store_id, Supplier.supplier_name == "Himalaya Distributors")
        .first()
    )
    if not supplier1:
        supplier1 = Supplier(
            store_id=store_id,
            supplier_name="Himalaya Distributors",
            contact_person="Procurement Team",
            email="supply@himalaya.example",
            phone="9802000000",
            address="Lalitpur, Nepal",
            is_active=True,
        )
        db.add(supplier1)
        db.flush()

    supplier2 = (
        db.query(Supplier)
        .filter(Supplier.store_id == store_id, Supplier.supplier_name == "Everest Supplies")
        .first()
    )
    if not supplier2:
        supplier2 = Supplier(
            store_id=store_id,
            supplier_name="Everest Supplies",
            contact_person="Sales Manager",
            email="sales@everest.example",
            phone="9802000001",
            address="Kathmandu, Nepal",
            is_active=True,
        )
        db.add(supplier2)
        db.flush()

    products_list = list(products.values())
    for i, product in enumerate(products_list):
        sup = supplier1 if i % 2 == 0 else supplier2
        link = (
            db.query(ProductSupplier)
            .filter(
                ProductSupplier.product_id == product.product_id,
                ProductSupplier.supplier_id == sup.supplier_id,
            )
            .first()
        )
        if not link:
            db.add(
                ProductSupplier(
                    product_id=product.product_id,
                    supplier_id=sup.supplier_id,
                    supply_price=product.unit_price * Decimal("0.8"),
                    lead_time_days=3 if sup == supplier1 else 5,
                    is_preferred=True,
                )
            )

        if i % 3 == 0:
            sec_sup = supplier2 if i % 2 == 0 else supplier1
            sec_link = (
                db.query(ProductSupplier)
                .filter(
                    ProductSupplier.product_id == product.product_id,
                    ProductSupplier.supplier_id == sec_sup.supplier_id,
                )
                .first()
            )
            if not sec_link:
                db.add(
                    ProductSupplier(
                        product_id=product.product_id,
                        supplier_id=sec_sup.supplier_id,
                        supply_price=product.unit_price * Decimal("0.85"),
                        lead_time_days=7,
                        is_preferred=False,
                    )
                )

    return supplier1, supplier2


def _seed_discount(db, store_id: int, categories: dict[str, Category], products: dict[str, Product]) -> None:
    discount1 = (
        db.query(Discount)
        .filter(Discount.store_id == store_id, Discount.discount_name == "Snacks 10% Off")
        .first()
    )
    if not discount1:
        db.add(
            Discount(
                store_id=store_id,
                discount_name="Snacks 10% Off",
                discount_type=DiscountType.percentage,
                discount_value=Decimal("10.00"),
                applies_to=DiscountAppliesTo.category,
                category_id=categories["Snacks"].category_id,
                is_active=True,
            )
        )

    discount2 = (
        db.query(Discount)
        .filter(Discount.store_id == store_id, Discount.discount_name == "Festival Rs. 500 Off (Min 5000)")
        .first()
    )
    if not discount2:
        db.add(
            Discount(
                store_id=store_id,
                discount_name="Festival Rs. 500 Off (Min 5000)",
                discount_type=DiscountType.fixed_amount,
                discount_value=Decimal("500.00"),
                applies_to=DiscountAppliesTo.transaction,
                min_purchase_amount=Decimal("5000.00"),
                is_active=True,
            )
        )

    target_product = products.get("100000000001")
    if target_product:
        discount3 = (
            db.query(Discount)
            .filter(Discount.store_id == store_id, Discount.discount_name == "Coke Promo 5% Off")
            .first()
        )
        if not discount3:
            db.add(
                Discount(
                    store_id=store_id,
                    discount_name="Coke Promo 5% Off",
                    discount_type=DiscountType.percentage,
                    discount_value=Decimal("5.00"),
                    applies_to=DiscountAppliesTo.product,
                    product_id=target_product.product_id,
                    is_active=True,
                )
            )


def _seed_purchase_order(
    db,
    store_id: int,
    suppliers: tuple[Supplier, Supplier],
    ordered_by: int,
    products: dict[str, Product],
) -> None:
    supplier1, supplier2 = suppliers

    order1 = (
        db.query(PurchaseOrder)
        .filter(
            PurchaseOrder.store_id == store_id,
            PurchaseOrder.supplier_id == supplier1.supplier_id,
            PurchaseOrder.notes == "Initial seed purchase order",
        )
        .first()
    )
    if not order1:
        order1 = PurchaseOrder(
            store_id=store_id,
            supplier_id=supplier1.supplier_id,
            ordered_by=ordered_by,
            status=PurchaseOrderStatus.pending,
            expected_date=(datetime.utcnow() + timedelta(days=3)).date(),
            notes="Initial seed purchase order",
        )
        db.add(order1)
        db.flush()

        item_specs1 = [
            {"barcode": "100000000001", "qty": 12},
            {"barcode": "100000000002", "qty": 20},
            {"barcode": "100000000003", "qty": 10},
        ]
        for spec in item_specs1:
            product = products.get(spec["barcode"])
            if product:
                db.add(
                    PurchaseOrderItem(
                        order_id=order1.order_id,
                        product_id=product.product_id,
                        quantity_ordered=spec["qty"],
                        unit_cost=product.unit_price * Decimal("0.8"),
                        quantity_received=0,
                    )
                )

    order2 = (
        db.query(PurchaseOrder)
        .filter(
            PurchaseOrder.store_id == store_id,
            PurchaseOrder.supplier_id == supplier2.supplier_id,
            PurchaseOrder.notes == "Secondary seed order",
        )
        .first()
    )
    if not order2:
        order2 = PurchaseOrder(
            store_id=store_id,
            supplier_id=supplier2.supplier_id,
            ordered_by=ordered_by,
            status=PurchaseOrderStatus.received,
            expected_date=(datetime.utcnow() - timedelta(days=1)).date(),
            notes="Secondary seed order",
        )
        db.add(order2)
        db.flush()

        item_specs2 = [
            {"barcode": "100000000014", "qty": 50},
            {"barcode": "100000000015", "qty": 30},
        ]
        for spec in item_specs2:
            product = products.get(spec["barcode"])
            if product:
                db.add(
                    PurchaseOrderItem(
                        order_id=order2.order_id,
                        product_id=product.product_id,
                        quantity_ordered=spec["qty"],
                        unit_cost=product.unit_price * Decimal("0.8"),
                        quantity_received=spec["qty"],
                    )
                )


def _seed_transactions(db, store_id: int, cashier_id: int, customer_id: int, products: dict[str, Product]) -> None:
    products_list = list(products.values())
    if not products_list:
        return

    existing_txn_count = db.query(Transaction).filter(Transaction.store_id == store_id).count()
    if existing_txn_count >= 30:
        return

    for i in range(30):
        days_ago = random.randint(0, 30)
        hours_ago = random.randint(0, 23)
        txn_date = datetime.utcnow() - timedelta(days=days_ago, hours=hours_ago)

        num_items = random.randint(1, 5)
        selected_products = random.sample(products_list, min(num_items, len(products_list)))
        
        subtotal = Decimal("0.00")
        tax_amount = Decimal("0.00")
        
        items = []
        for prod in selected_products:
            qty = random.randint(1, 4)
            line_total = prod.unit_price * qty
            tax_rate = prod.tax_rate / Decimal("100")
            item_tax = line_total * tax_rate

            subtotal += line_total
            tax_amount += item_tax

            items.append(
                TransactionItem(
                    product_id=prod.product_id,
                    quantity=qty,
                    unit_price_at_sale=prod.unit_price,
                    discount=Decimal("0.00"),
                    line_total=line_total,
                )
            )

        discount_amount = Decimal("0.00")
        if random.random() < 0.2:
            discount_amount = Decimal("10.00")
            
        total_amount = subtotal + tax_amount - discount_amount

        invoice_num = f"INV-{txn_date.strftime('%Y%m%d')}-{random.randint(1000,9999)}"

        transaction = Transaction(
            invoice_number=invoice_num,
            store_id=store_id,
            cashier_id=cashier_id,
            customer_id=customer_id if random.random() > 0.5 else None,
            transaction_date=txn_date,
            subtotal=subtotal,
            tax_amount=tax_amount,
            discount_amount=discount_amount,
            total_amount=total_amount,
            status=TransactionStatus.completed,
        )
        
        db.add(transaction)
        db.flush()

        for item in items:
            item.transaction_id = transaction.transaction_id
            db.add(item)
        
        payment_method = random.choice(list(PaymentMethod))
        payment = Payment(
            transaction_id=transaction.transaction_id,
            amount=total_amount,
            payment_method=payment_method,
            payment_status=PaymentStatus.completed,
        )
        db.add(payment)


def run_seed() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Ensure the payment_method enum supports 'qr' even on old schemas
        db.execute(text("ALTER TABLE payments MODIFY COLUMN payment_method ENUM('cash', 'card', 'qr') NOT NULL"))
        db.commit()
        
        roles = _seed_roles(db)
        users = _seed_users(db)
        store = _seed_store(db, owner_id=users["admin@store.np"].user_id)

        _ensure_user_role(
            db,
            user_id=users["admin@store.np"].user_id,
            role_id=roles[UserRoleEnum.admin.value].role_id,
            store_id=store.store_id,
        )
        _ensure_user_role(
            db,
            user_id=users["cashier@store.np"].user_id,
            role_id=roles[UserRoleEnum.cashier.value].role_id,
            store_id=store.store_id,
        )
        _ensure_user_role(
            db,
            user_id=users["customer@store.np"].user_id,
            role_id=roles[UserRoleEnum.customer.value].role_id,
            store_id=store.store_id,
        )
        _ensure_user_role(
            db,
            user_id=users["staff1@store.np"].user_id,
            role_id=roles[UserRoleEnum.cashier.value].role_id,
            store_id=store.store_id,
        )
        _ensure_user_role(
            db,
            user_id=users["admin2@store.np"].user_id,
            role_id=roles[UserRoleEnum.admin.value].role_id,
            store_id=store.store_id,
        )

        categories = _seed_categories(db, store.store_id)
        products = _seed_products(db, store.store_id, categories)
        _seed_inventory(db, store.store_id, products)
        suppliers = _seed_supplier_and_links(db, store.store_id, products)
        _seed_purchase_order(
            db,
            store_id=store.store_id,
            suppliers=suppliers,
            ordered_by=users["admin@store.np"].user_id,
            products=products,
        )
        _seed_discount(db, store.store_id, categories, products)
        
        _seed_transactions(
            db,
            store_id=store.store_id,
            cashier_id=users["cashier@store.np"].user_id,
            customer_id=users["customer@store.np"].user_id,
            products=products,
        )

        db.commit()
        print("[SEED] Seed data completed successfully.")
        print("[SEED] Admin login: admin@store.np / Admin@123")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    run_seed()
