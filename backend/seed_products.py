"""
Database seed script for Products (15 products).
Usage: python seed_products.py
"""

from decimal import Decimal
from app.database import Base, SessionLocal, engine
from app.models import Store, Category, Product, Inventory, Supplier, ProductSupplier

def seed_products():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        print("Checking/Creating Store...")
        store = db.query(Store).filter(Store.store_id == 1).first()
        if not store:
            from app.models import User
            admin = db.query(User).first()
            store = Store(
                store_name="Default Store",
                owner_id=admin.user_id if admin else 1,
                address="Kathmandu, Nepal",
                contact_email="store@ersis.com",
                contact_phone="9801000000",
                is_active=True,
            )
            db.add(store)
            db.flush()
            print("Store created.")
            
        print("Checking/Creating Suppliers...")
        suppliers_data = [
            {"name": "Global Electronics & Home", "contact": "John Doe", "email": "john@globaltraders.com", "phone": "9803000001"},
            {"name": "Local Organics & Care", "contact": "Jane Smith", "email": "jane@localorganics.com", "phone": "9803000002"}
        ]
        suppliers = []
        for s_data in suppliers_data:
            sup = db.query(Supplier).filter(Supplier.store_id == store.store_id, Supplier.supplier_name == s_data["name"]).first()
            if not sup:
                sup = Supplier(
                    store_id=store.store_id,
                    supplier_name=s_data["name"],
                    contact_person=s_data["contact"],
                    email=s_data["email"],
                    phone=s_data["phone"],
                    address="Kathmandu, Nepal",
                    is_active=True
                )
                db.add(sup)
                db.flush()
            suppliers.append(sup)

        print("Checking/Creating Categories...")
        category_names = ["Electronics", "Groceries", "Clothing", "Home & Kitchen", "Personal Care"]
        categories = {}
        for name in category_names:
            cat = db.query(Category).filter(Category.store_id == store.store_id, Category.category_name == name).first()
            if not cat:
                cat = Category(store_id=store.store_id, category_name=name)
                db.add(cat)
                db.flush()
            categories[name] = cat
            
        product_specs = [
            # Electronics
            {"name": "Wireless Mouse", "barcode": "PROD-ELEC-001", "sku": "WM-01", "cat": "Electronics", "price": "1500.00", "tax": "13.00", "uom": "piece"},
            {"name": "Mechanical Keyboard", "barcode": "PROD-ELEC-002", "sku": "MK-01", "cat": "Electronics", "price": "4500.00", "tax": "13.00", "uom": "piece"},
            {"name": "27-inch Monitor", "barcode": "PROD-ELEC-003", "sku": "MN-27", "cat": "Electronics", "price": "25000.00", "tax": "13.00", "uom": "piece"},
            # Groceries
            {"name": "Organic Almonds 500g", "barcode": "PROD-GROC-001", "sku": "ALM-500", "cat": "Groceries", "price": "800.00", "tax": "0.00", "uom": "pack"},
            {"name": "Whole Wheat Bread", "barcode": "PROD-GROC-002", "sku": "BREAD-WW", "cat": "Groceries", "price": "100.00", "tax": "0.00", "uom": "pack"},
            {"name": "Instant Coffee 200g", "barcode": "PROD-GROC-003", "sku": "COF-200", "cat": "Groceries", "price": "600.00", "tax": "13.00", "uom": "jar"},
            # Clothing
            {"name": "Men's Cotton T-Shirt", "barcode": "PROD-CLOT-001", "sku": "TSHIRT-M", "cat": "Clothing", "price": "500.00", "tax": "13.00", "uom": "piece"},
            {"name": "Denim Jeans", "barcode": "PROD-CLOT-002", "sku": "JEANS-01", "cat": "Clothing", "price": "2000.00", "tax": "13.00", "uom": "piece"},
            {"name": "Running Shoes", "barcode": "PROD-CLOT-003", "sku": "SHOES-R", "cat": "Clothing", "price": "3500.00", "tax": "13.00", "uom": "pair"},
            # Home & Kitchen
            {"name": "Non-Stick Frying Pan", "barcode": "PROD-HOME-001", "sku": "PAN-NS", "cat": "Home & Kitchen", "price": "1200.00", "tax": "13.00", "uom": "piece"},
            {"name": "Coffee Mug", "barcode": "PROD-HOME-002", "sku": "MUG-01", "cat": "Home & Kitchen", "price": "250.00", "tax": "13.00", "uom": "piece"},
            {"name": "LED Desk Lamp", "barcode": "PROD-HOME-003", "sku": "LAMP-LED", "cat": "Home & Kitchen", "price": "800.00", "tax": "13.00", "uom": "piece"},
            # Personal Care
            {"name": "Shampoo 400ml", "barcode": "PROD-PERS-001", "sku": "SHMP-400", "cat": "Personal Care", "price": "450.00", "tax": "13.00", "uom": "bottle"},
            {"name": "Body Wash 500ml", "barcode": "PROD-PERS-002", "sku": "BW-500", "cat": "Personal Care", "price": "550.00", "tax": "13.00", "uom": "bottle"},
            {"name": "Toothpaste 150g", "barcode": "PROD-PERS-003", "sku": "TP-150", "cat": "Personal Care", "price": "120.00", "tax": "13.00", "uom": "tube"},
        ]

        print("Creating 15 Products, Inventory, and Supplier Links...")
        for spec in product_specs:
            prod = db.query(Product).filter(Product.store_id == store.store_id, Product.barcode == spec["barcode"]).first()
            if not prod:
                prod = Product(
                    store_id=store.store_id,
                    category_id=categories[spec["cat"]].category_id,
                    product_name=spec["name"],
                    barcode=spec["barcode"],
                    sku=spec["sku"],
                    unit_price=Decimal(spec["price"]),
                    tax_rate=Decimal(spec["tax"]),
                    unit_of_measure=spec["uom"],
                    is_active=True
                )
                db.add(prod)
                db.flush()
                print(f"Created product: {spec['name']}")
                
                # Add Inventory
                inv = Inventory(
                    product_id=prod.product_id,
                    store_id=store.store_id,
                    quantity_in_stock=50,
                    reorder_level=10
                )
                db.add(inv)
                
            # Map Supplier
            sup = suppliers[0] if "ELEC" in spec["barcode"] or "HOME" in spec["barcode"] else suppliers[1]
            ps = db.query(ProductSupplier).filter(ProductSupplier.product_id == prod.product_id, ProductSupplier.supplier_id == sup.supplier_id).first()
            if not ps:
                ps = ProductSupplier(
                    product_id=prod.product_id,
                    supplier_id=sup.supplier_id,
                    supply_price=Decimal(spec["price"]) * Decimal("0.75"), # 25% supply margin
                    lead_time_days=3,
                    is_preferred=True
                )
                db.add(ps)
                
        db.commit()
        print("Successfully seeded 15 products with inventory and supplier links!")

    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_products()
