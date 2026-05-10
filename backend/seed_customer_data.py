from datetime import datetime, timedelta
import random
from decimal import Decimal
from app.database import SessionLocal
from app.models import (
    User, Store, Transaction, TransactionItem, Payment, 
    Notification, Product, Category, UserRole, Role
)
from app.models.enums import (
    TransactionStatus, PaymentMethod, PaymentStatus, 
    NotificationType, NotificationChannel, NotificationStatus,
    UserRole as UserRoleEnum
)
from app.core.security import hash_password

def seed_detailed_customer():
    db = SessionLocal()
    try:
        # 1. Get or Create Customer
        email = "customer@store.np"
        customer = db.query(User).filter(User.email == email).first()
        if not customer:
            customer = User(
                username="customer",
                email=email,
                password_hash=hash_password("Admin@123"),
                first_name="Sanchit",
                last_name="Pandey",
                phone="9841234567",
                is_active=True
            )
            db.add(customer)
            db.flush()
            print(f"Created customer: {customer.first_name}")
        
        # 2. Get Store and Cashier
        store = db.query(Store).first()
        if not store:
            print("No store found. Please run main seed first.")
            return

        cashier = db.query(User).filter(User.username == "cashier").first()
        if not cashier:
            cashier = db.query(User).first() # Fallback

        # Ensure customer has a role in the store
        role_enum = UserRoleEnum.customer
        role = db.query(Role).filter(Role.role_name == role_enum).first()
        if role:
            existing_role = db.query(UserRole).filter(
                UserRole.user_id == customer.user_id,
                UserRole.store_id == store.store_id
            ).first()
            if not existing_role:
                db.add(UserRole(user_id=customer.user_id, role_id=role.role_id, store_id=store.store_id))
                db.flush()

        # 3. Create Diverse Products if needed
        products = db.query(Product).filter(Product.store_id == store.store_id).all()
        if len(products) < 5:
            print("Not enough products. Seeding some...")
            # (Assuming categories exist from main seed)
            cat = db.query(Category).filter(Category.store_id == store.store_id).first()
            new_prods = [
                ("Organic Apple", 250, "8801"),
                ("Milk 1L", 120, "8802"),
                ("Whole Wheat Bread", 85, "8803"),
                ("Dark Chocolate", 450, "8804"),
                ("Green Tea Pack", 550, "8805"),
            ]
            for name, price, bar in new_prods:
                p = Product(
                    store_id=store.store_id,
                    product_name=name,
                    barcode=bar,
                    unit_price=Decimal(price),
                    category_id=cat.category_id if cat else None
                )
                db.add(p)
            db.flush()
            products = db.query(Product).filter(Product.store_id == store.store_id).all()

        # 4. Create 15-20 Transactions over the last 30 days
        print("Seeding transactions...")
        for i in range(15):
            days_ago = random.randint(0, 30)
            txn_date = datetime.now() - timedelta(days=days_ago, hours=random.randint(0, 8))
            
            # Select 1-4 random products
            txn_items = random.sample(products, k=random.randint(1, 4))
            subtotal = Decimal(0)
            
            # Create Transaction
            invoice_no = f"INV-{txn_date.strftime('%Y%m%d')}-{random.randint(1000, 9999)}"
            txn = Transaction(
                invoice_number=invoice_no,
                store_id=store.store_id,
                cashier_id=cashier.user_id,
                customer_id=customer.user_id,
                transaction_date=txn_date,
                status=TransactionStatus.completed,
                subtotal=0, # update later
                tax_amount=0,
                discount_amount=0,
                total_amount=0
            )
            db.add(txn)
            db.flush()

            for p in txn_items:
                qty = random.randint(1, 3)
                line_total = p.unit_price * qty
                item = TransactionItem(
                    transaction_id=txn.transaction_id,
                    product_id=p.product_id,
                    quantity=qty,
                    unit_price_at_sale=p.unit_price,
                    line_total=line_total
                )
                db.add(item)
                subtotal += line_total
            
            tax = subtotal * Decimal("0.13")
            discount = Decimal(random.choice([0, 0, 50, 100]))
            total = subtotal + tax - discount
            
            txn.subtotal = subtotal
            txn.tax_amount = tax
            txn.discount_amount = discount
            txn.total_amount = total
            
            # Create Payment
            pm = random.choice(list(PaymentMethod))
            payment = Payment(
                transaction_id=txn.transaction_id,
                payment_method=pm,
                amount=total,
                payment_status=PaymentStatus.completed,
                paid_at=txn_date
            )
            db.add(payment)

        # 5. Create some Notifications
        print("Seeding notifications...")
        notif_types = [
            (NotificationType.system_alert, "New Summer Deal!", "Get 20% off on all organic fruits this weekend at SuperMart."),
            (NotificationType.system_alert, "Security Alert", "A new login was detected on your account from a new device."),
            (NotificationType.transaction_receipt, "Loyalty Points Updated", "You just earned 45 points from your last purchase! Total: 340."),
            (NotificationType.transaction_receipt, "Digital Receipt", "Your receipt for INV-20260509-4412 is now available."),
        ]
        for ntype, subject, body in notif_types:
            db.add(Notification(
                user_id=customer.user_id,
                store_id=store.store_id,
                notification_type=ntype,
                channel=NotificationChannel.in_app,
                subject=subject,
                body=body,
                status=NotificationStatus.sent,
                sent_at=datetime.now() - timedelta(days=random.randint(0, 5))
            ))

        db.commit()
        print("Successfully seeded detailed customer data!")

    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_detailed_customer()
