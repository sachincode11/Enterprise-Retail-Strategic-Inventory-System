"""
Main seed script for Enterprise-Retail-Strategic-Inventory-System.
Runs all individual seeders in the correct order.
Usage: python seed.py
"""

from seed_users import seed_users
from seed_products import seed_products
from seed_transactions import seed_transactions
from seed_knowledge_base import seed_knowledge_base
from seed_ai import seed_ai

def main():
    print("==================================================")
    print("      ERSIS GLOBAL DATABASE SEEDING START       ")
    print("==================================================")
    
    # 1. Users and Store (The foundation)
    print("\n[STEP 1/5] Seeding Users, Roles, and Store...")
    seed_users()
    
    # 2. Products and Categories (Depends on Store)
    print("\n[STEP 2/5] Seeding Suppliers, Categories, and Products...")
    seed_products()
    
    # 3. Transactions (Depends on Users and Products)
    print("\n[STEP 3/5] Seeding Historical Transactions (60 Days)...")
    seed_transactions()
    
    # 4. Knowledge Base (Depends on Store)
    print("\n[STEP 4/5] Seeding Store FAQs and Policies...")
    seed_knowledge_base()
    
    # 5. AI Context (Depends on Knowledge Base and Products)
    print("\n[STEP 5/5] Seeding AI Forecasts and Chat Sessions...")
    seed_ai()
    
    print("\n==================================================")
    print("      ERSIS GLOBAL DATABASE SEEDING COMPLETE      ")
    print("==================================================")

if __name__ == "__main__":
    main()
