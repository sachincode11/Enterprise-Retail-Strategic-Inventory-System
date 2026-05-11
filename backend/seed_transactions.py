"""
Database seed script for Transactions (past 2 months).
Usage: python seed_transactions.py
"""

import random
from datetime import datetime, timedelta
from decimal import Decimal

from app.database import Base, SessionLocal, engine
from app.models import (
    Store, User, Product, Transaction, TransactionItem, 
    Payment, GuestCustomer, Inventory, InventoryLog
)
from app.models.enums import (
    TransactionStatus, PaymentMethod, PaymentStatus, MovementType, InventoryReferenceType
)

def seed_transactions():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        print("Fetching Store and Products...")
        store = db.query(Store).filter(Store.store_id == 1).first()
        if not store:
            print("Store not found! Run seed_users.py and seed_products.py first.")
            return

        products = db.query(Product).filter(Product.store_id == store.store_id).all()
        if not products:
            print("No products found! Run seed_products.py first.")
            return
            
        inventories = {inv.product_id: inv for inv in db.query(Inventory).filter(Inventory.store_id == store.store_id).all()}

        print("Fetching Cashiers and Customers...")
        cashiers = db.query(User).filter(User.email.in_(["cashier_seed1@store.np", "cashier_seed2@store.np"])).all()
        if not cashiers:
            cashiers = db.query(User).all()

        target_customers = db.query(User).filter(User.email.in_([
            "customer_seed1@store.np", 
            "customer_seed2@store.np", 
            "customer_seed3@store.np"
        ])).all()

        # Create some guest customers
        guests = []
        for i in range(3):
            g = GuestCustomer(name=f"Walk-in Guest {i+1}", phone=f"980000111{i}")
            db.add(g)
        db.flush()
        guests = db.query(GuestCustomer).all()

        print("Generating 80 Transactions over the past 2 months...")
        now = datetime.now()
        
        # We want to create trends for reports
        for i in range(80):
            # Random date within last 60 days
            # Create a slight bias towards recent days for realistic report curves
            days_ago = int(random.triangular(0, 60, 10))
            txn_date = now - timedelta(days=days_ago, hours=random.randint(0, 10), minutes=random.randint(0, 59))
            
            cashier = random.choice(cashiers)
            
            is_guest = random.random() < 0.3 # 30% guest
            customer = None
            guest = None
            if is_guest:
                guest = random.choice(guests)
            else:
                customer = random.choice(target_customers) if target_customers else None

            # Pick 1 to 5 distinct products
            num_items = random.randint(1, 5)
            txn_products = random.sample(products, min(num_items, len(products)))
            
            subtotal = Decimal("0.00")
            tax_amount = Decimal("0.00")
            
            txn_items = []
            
            for prod in txn_products:
                qty = random.randint(1, 3)
                
                # Update inventory
                inv = inventories.get(prod.product_id)
                if inv:
                    inv.quantity_in_stock -= qty
                
                line_total = prod.unit_price * qty
                tax_rate = prod.tax_rate / Decimal("100")
                item_tax = line_total * tax_rate
                
                subtotal += line_total
                tax_amount += item_tax
                
                txn_items.append({
                    "product": prod,
                    "qty": qty,
                    "unit_price": prod.unit_price,
                    "line_total": line_total
                })
                
            discount_amount = Decimal("0.00")
            # 10% chance of a random discount
            if random.random() < 0.1:
                discount_amount = Decimal("50.00")
                
            total_amount = subtotal + tax_amount - discount_amount
            if total_amount < 0:
                total_amount = Decimal("0.00")
                
            invoice_num = f"INV-{txn_date.strftime('%Y%m%d')}-{random.randint(1000,9999)}"
            
            # Status
            status = TransactionStatus.completed
            if random.random() < 0.05: # 5% refunded
                status = TransactionStatus.refunded

            txn = Transaction(
                invoice_number=invoice_num,
                store_id=store.store_id,
                cashier_id=cashier.user_id,
                customer_id=customer.user_id if customer else None,
                guest_customer_id=guest.guest_id if guest else None,
                transaction_date=txn_date,
                subtotal=subtotal,
                tax_amount=tax_amount,
                discount_amount=discount_amount,
                total_amount=total_amount,
                status=status,
                created_at=txn_date,
                updated_at=txn_date
            )
            db.add(txn)
            db.flush() # To get transaction_id
            
            for item in txn_items:
                ti = TransactionItem(
                    transaction_id=txn.transaction_id,
                    product_id=item["product"].product_id,
                    quantity=item["qty"],
                    unit_price_at_sale=item["unit_price"],
                    discount=Decimal("0.00"),
                    line_total=item["line_total"]
                )
                db.add(ti)
                
                # Inventory Log
                inv = inventories.get(item["product"].product_id)
                if inv:
                    log = InventoryLog(
                        inventory_id=inv.inventory_id,
                        product_id=item["product"].product_id,
                        store_id=store.store_id,
                        movement_type=MovementType.sale,
                        quantity_change=-item["qty"],
                        quantity_before=inv.quantity_in_stock + item["qty"],
                        quantity_after=inv.quantity_in_stock,
                        reference_type=InventoryReferenceType.transaction,
                        reference_id=txn.transaction_id,
                        notes="Sale via seed_transactions",
                        performed_by=cashier.user_id,
                        created_at=txn_date
                    )
                    db.add(log)
            
            payment_method = random.choice([PaymentMethod.cash, PaymentMethod.card, PaymentMethod.qr])
            payment_status = PaymentStatus.completed if status == TransactionStatus.completed else PaymentStatus.refunded
            
            payment = Payment(
                transaction_id=txn.transaction_id,
                payment_method=payment_method,
                amount=total_amount,
                payment_status=payment_status,
                payment_reference=f"REF-{random.randint(10000,99999)}" if payment_method != PaymentMethod.cash else None,
                paid_at=txn_date
            )
            db.add(payment)

        db.commit()
        print("Successfully seeded 80 transactions!")

    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_transactions()
