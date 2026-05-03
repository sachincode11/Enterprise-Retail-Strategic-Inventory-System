import random
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app.models import (
    Transaction, TransactionItem, Payment, User, Product, Inventory, 
    InventoryLog, Store, UserRole, Role
)
from app.models.enums import (
    TransactionStatus, PaymentMethod, PaymentStatus, 
    MovementType, InventoryReferenceType
)

def seed_report_data():
    db: Session = SessionLocal()
    try:
        store = db.query(Store).filter(Store.store_id == 1).first()
        if not store:
            print("Default store not found. Please run seed.py first.")
            return

        products = db.query(Product).all()
        if not products:
            print("No products found. Please run seed.py first.")
            return

        # Find cashiers and admins
        staff_users = db.query(User).join(UserRole).join(Role).filter(
            UserRole.store_id == store.store_id,
            Role.role_name.in_(['cashier', 'admin'])
        ).all()

        if not staff_users:
            print("No staff users found. Please run seed.py first.")
            return

        print(f"Seeding report data for store: {store.store_name}...")

        # Clear existing transactions to avoid duplicates/mess
        # db.query(Payment).delete()
        # db.query(TransactionItem).delete()
        # db.query(Transaction).delete()
        # db.commit()

        now = datetime.now(timezone.utc).replace(tzinfo=None)
        
        # 1. Generate Transactions for the last 6 months
        methods = [PaymentMethod.cash, PaymentMethod.card, PaymentMethod.qr]
        statuses = [TransactionStatus.completed] * 90 + [TransactionStatus.refunded] * 10
        
        total_created = 0
        for i in range(180): # 180 days
            day = now - timedelta(days=i)
            # Random number of transactions per day (2 to 8)
            num_txns = random.randint(2, 8)
            
            for _ in range(num_txns):
                cashier = random.choice(staff_users)
                status = random.choice(statuses)
                method = random.choice(methods)
                
                # Random time of day
                txn_time = day.replace(
                    hour=random.randint(9, 20),
                    minute=random.randint(0, 59),
                    second=random.randint(0, 59)
                )
                
                # Pick random products (1 to 5 items)
                num_items = random.randint(1, 5)
                txn_products = random.sample(products, min(num_items, len(products)))
                
                total_amount = Decimal(0)
                items = []
                for p in txn_products:
                    qty = random.randint(1, 3)
                    price = p.unit_price or Decimal(random.randint(100, 1000))
                    subtotal_item = price * qty
                    total_amount += subtotal_item
                    items.append(TransactionItem(
                        product_id=p.product_id,
                        quantity=qty,
                        unit_price_at_sale=price,
                        line_total=subtotal_item,
                        discount=Decimal(0)
                    ))
                
                txn = Transaction(
                    store_id=store.store_id,
                    cashier_id=cashier.user_id,
                    subtotal=total_amount,
                    tax_amount=Decimal(0),
                    discount_amount=Decimal(0),
                    total_amount=total_amount,
                    status=status,
                    transaction_date=txn_time,
                    invoice_number=f"INV-{txn_time.strftime('%Y%m%d')}-{random.randint(1000, 9999)}"
                )
                db.add(txn)
                db.flush()
                
                for item in items:
                    item.transaction_id = txn.transaction_id
                    db.add(item)
                
                # Create payment
                payment = Payment(
                    transaction_id=txn.transaction_id,
                    amount=total_amount,
                    payment_method=method,
                    payment_status=PaymentStatus.completed if status == TransactionStatus.completed else PaymentStatus.failed,
                    paid_at=txn_time
                )
                db.add(payment)
                total_created += 1

            if i % 30 == 0:
                db.commit()
                print(f"Processed {i} days...")

        db.commit()
        print(f"Successfully seeded {total_created} transactions.")

        # 2. Generate some Inventory Logs for the audit snapshot
        print("Seeding inventory logs...")
        for i in range(20):
            p = random.choice(products)
            u = random.choice(staff_users)
            
            # Fetch inventory_id for the product
            inv = db.query(Inventory).filter(
                Inventory.product_id == p.product_id,
                Inventory.store_id == store.store_id
            ).first()
            
            if not inv:
                continue

            change = random.randint(5, 50)
            log_time = now - timedelta(hours=random.randint(1, 48))
            
            db.add(InventoryLog(
                inventory_id=inv.inventory_id,
                product_id=p.product_id,
                store_id=store.store_id,
                movement_type=random.choice([MovementType.restock, MovementType.adjustment]),
                quantity_change=change,
                quantity_before=100,
                quantity_after=100 + change,
                reference_type=InventoryReferenceType.manual,
                performed_by=u.user_id,
                created_at=log_time,
                notes="Dummy seed data for report testing"
            ))
        
        db.commit()
        print("Done.")

    except Exception as e:
        db.rollback()
        print(f"Error seeding data: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_report_data()
