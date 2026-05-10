"""
Database seed script for Users (1 Admin, 2 Cashiers, 10 Customers).
Usage: python seed_users.py
"""

from app.database import Base, SessionLocal, engine
from app.models import User, Store, Role, UserRole
from app.models.enums import UserRole as UserRoleEnum
from app.core.security import hash_password

def seed_users():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Helper to create user
        def get_or_create_user(username, email, first_name, last_name, phone):
            user = db.query(User).filter(User.email == email).first()
            if not user:
                user = User(
                    username=username,
                    email=email,
                    password_hash=hash_password("Password@123"),
                    first_name=first_name,
                    last_name=last_name,
                    phone=phone,
                    is_active=True,
                    is_verified=True
                )
                db.add(user)
                db.flush()
                print(f"Created user: {username} ({email})")
            else:
                print(f"User already exists: {username} ({email})")
            return user

        print("Creating Admin...")
        # 1 Admin
        admin_user = get_or_create_user("admin_seed", "admin_seed@store.np", "Seed", "Admin", "9800000010")

        print("Checking/Creating Store...")
        # Create Store if not exists
        store = db.query(Store).filter(Store.store_id == 1).first()
        if not store:
            store = Store(
                store_name="Default Store",
                owner_id=admin_user.user_id,
                address="Kathmandu, Nepal",
                contact_email="store@ersis.com",
                contact_phone="9801000000",
                is_active=True,
            )
            db.add(store)
            db.flush()
            print("Store created.")
        else:
            print("Store already exists.")

        print("Checking/Creating Roles...")
        # Ensure Roles exist
        roles = {}
        for enum_role in UserRoleEnum:
            role = db.query(Role).filter(Role.role_name == enum_role).first()
            if not role:
                role = Role(role_name=enum_role, description=f"{enum_role.value} role")
                db.add(role)
                db.flush()
            roles[enum_role.value] = role

        # Helper to assign role
        def ensure_user_role(user_id, role_id, store_id, role_name):
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
                db.flush()
                print(f"Assigned role {role_name} to user_id {user_id}")

        print("Assigning Admin role...")
        ensure_user_role(admin_user.user_id, roles[UserRoleEnum.admin.value].role_id, store.store_id, "Admin")

        print("Creating 2 Cashiers...")
        cashier1 = get_or_create_user("cashier_seed1", "cashier_seed1@store.np", "Seed", "Cashier1", "9800000011")
        ensure_user_role(cashier1.user_id, roles[UserRoleEnum.cashier.value].role_id, store.store_id, "Cashier")
        
        cashier2 = get_or_create_user("cashier_seed2", "cashier_seed2@store.np", "Seed", "Cashier2", "9800000012")
        ensure_user_role(cashier2.user_id, roles[UserRoleEnum.cashier.value].role_id, store.store_id, "Cashier")

        print("Creating 10 Customers...")
        for i in range(1, 11):
            cust = get_or_create_user(
                f"customer_seed{i}", 
                f"customer_seed{i}@store.np", 
                "Seed", 
                f"Customer{i}", 
                f"9810000{i:03d}"
            )
            ensure_user_role(cust.user_id, roles[UserRoleEnum.customer.value].role_id, store.store_id, "Customer")

        db.commit()
        print("Successfully seeded 1 admin, 2 cashiers, and 10 customers!")

    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_users()
