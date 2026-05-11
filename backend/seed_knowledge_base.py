"""
Database seed script for Knowledge Base (FAQs and Policies).
Usage: python seed_knowledge_base.py
"""

from app.database import Base, SessionLocal, engine
from app.models import Store, StoreFAQ, StorePolicy, RAGDocumentChunk
from app.models.enums import PolicyAccessLevel, RAGSourceType, RAGAccessLevel

def seed_knowledge_base():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        print("Fetching Store...")
        store = db.query(Store).filter(Store.store_id == 1).first()
        if not store:
            print("Store not found! Run previous seeds first.")
            return

        print("Seeding Multiple FAQs...")
        faqs = [
            ("What is your return policy?", "Items can be returned within 7 days of purchase if unopened and with receipt."),
            ("Do you offer home delivery?", "Yes, we offer home delivery for orders above Rs. 1000 within a 5km radius."),
            ("What payment methods are accepted?", "We accept cash, credit/debit cards, and mobile QR payments (eSewa, Khalti)."),
            ("How do I earn loyalty points?", "You earn 1 point for every Rs. 100 spent. Points can be redeemed for discounts on future purchases."),
            ("Can I order items online and pick them up in-store?", "Yes, click-and-collect is available. Your items will be ready 2 hours after placing the order."),
            ("What are your store hours?", "We are open from 8:00 AM to 9:00 PM, seven days a week."),
            ("Do you sell organic products?", "Yes, we have a dedicated organic section for produce and pantry items."),
            ("How can I track my home delivery order?", "Once your order is dispatched, you will receive an SMS with a tracking link."),
            ("Is there a warranty on electronic items?", "Yes, electronics carry a manufacturer's warranty. Please keep the receipt as proof of purchase."),
            ("Can I modify my order after placing it?", "Orders can be modified within 1 hour of placement by calling customer support."),
            ("What happens if an item is out of stock?", "We will notify you and offer a similar replacement, or issue a refund for that item."),
            ("Do you offer gift cards?", "Yes, physical and digital gift cards are available starting from Rs. 500."),
            ("Are pets allowed in the store?", "Only certified service animals are permitted inside the store."),
            ("How do I contact customer support?", "You can email support@ersis.com or call our toll-free number 1800-123-456."),
            ("Do you have parking available?", "Yes, we have a free underground parking lot for all customers.")
        ]
        
        faq_count = 0
        for q, a in faqs:
            faq = db.query(StoreFAQ).filter(StoreFAQ.store_id == store.store_id, StoreFAQ.question == q).first()
            if not faq:
                db.add(StoreFAQ(store_id=store.store_id, question=q, answer=a, is_active=True))
                faq_count += 1
                
        print("Seeding Multiple Policies...")
        # Note: Using 'public' for all to avoid legacy DB ENUM truncation errors on 'private'
        policies = [
            ("General Return Policy", """# General Return Policy

At ERSIS Default Store, we strive for customer satisfaction. Our return policy guidelines are as follows:
- **Timeframe:** Items can be returned within 7 days of purchase.
- **Condition:** All items must be unopened, unused, and in their original packaging.
- **Electronics:** Electronic goods must have their original factory seal intact. Opened electronics can only be returned if they are defective.
- **Perishables:** We do not accept returns on perishable items such as fresh produce, meat, or dairy products for health and safety reasons.
- **Proof of Purchase:** A valid physical or digital receipt is strictly required for all returns and exchanges.
- **Refund Method:** Refunds will be issued to the original payment method. Cash purchases will be refunded in cash; card purchases will be refunded to the same card.
"""),
            ("Staff Discount Policy", """# Staff Discount Policy

We value our employees and offer the following discounts:
- **Eligibility:** All active cashiers, admins, and support staff are eligible.
- **Discount Rate:** A flat 10% discount on the retail price.
- **Exclusions:** The discount cannot be applied to already promotional or clearance items. 
- **Usage Limits:** The maximum discount limit per month per staff member is Rs. 5000.
- **Purchasing for Others:** Staff discounts are strictly for personal use or immediate family members. Buying items for resale using the staff discount is a violation of company policy.
"""),
            ("Privacy Policy", """# Privacy Policy

Your privacy is important to us. Here is how we handle your data:
- **Data Collection:** We collect your name, phone number, and email address during registration or checkout.
- **Data Usage:** Your data is used exclusively to process your transactions, send order updates, and manage your loyalty points.
- **Third Parties:** We do NOT sell or share your personal data with any third-party marketing agencies.
- **Communications:** You will only receive promotional emails if you explicitly opt-in during account creation.
- **Security:** All user data is encrypted and stored securely within our enterprise database.
"""),
            ("Home Delivery Policy", """# Home Delivery Policy

We offer convenient home delivery services under the following terms:
- **Delivery Zone:** Deliveries are restricted to a strictly 5km radius from the store location.
- **Delivery Fees:** Free delivery for orders above Rs. 1000. A nominal fee of Rs. 50 is applied to all orders below this threshold.
- **Timings:** Deliveries are processed between 9:00 AM and 7:00 PM. Expected delivery time is typically 2-4 hours from order confirmation.
- **Receiving Orders:** Customers must be present to receive the order or designate someone. Unattended deliveries are not permitted.
"""),
            ("Inventory Count Policy", """# Inventory Count Policy

Accurate inventory is the backbone of our operations:
- **Schedule:** Full physical inventory counts are conducted on the last Sunday of every month.
- **Operations:** The store will remain closed to customers in the morning and will open at 12 PM on count days.
- **Discrepancies:** Any discrepancies between physical counts and system counts (shrinkage) must be logged and reviewed by the Store Manager.
"""),
            ("Cash Handling Policy", """# Cash Handling Policy

Strict adherence to cash handling procedures is mandatory for all cashiers:
- **Drop Limit:** Cashiers must execute a cash drop into the smart safe whenever the drawer exceeds Rs. 50,000.
- **End of Shift:** Drawers must be balanced exactly at the end of every shift.
- **Shortages/Overages:** Any discrepancy above Rs. 100 must be immediately reported to the floor manager and accompanied by an incident report.
"""),
            ("Damaged Goods Policy", """# Damaged Goods Policy

Handling of damaged items must be thoroughly documented:
- **Discovery:** Any items found damaged during receiving, stocking, or on the floor must be removed immediately.
- **Logging:** Items must be logged in the ERSIS system under the 'damage' movement type to accurately adjust inventory.
- **Quarantine:** Logged items must be placed in the designated quarantine zone in the warehouse pending supplier review or disposal.
"""),
            ("Customer Grievance Policy", """# Customer Grievance Policy

We are committed to resolving customer issues swiftly and fairly:
- **Logging:** All formal customer complaints must be logged in the system.
- **Resolution Authority:** Cashiers are authorized to resolve disputes up to Rs. 500. Any refunds or compensations exceeding Rs. 2000 require direct Manager approval.
- **De-escalation:** Staff must always remain polite, apologize for the inconvenience, and offer a 5% discount coupon for future use as a goodwill gesture.
"""),
        ]
        
        policy_count = 0
        chunk_count = 0
        for name, content in policies:
            policy = db.query(StorePolicy).filter(StorePolicy.store_id == store.store_id, StorePolicy.policy_name == name).first()
            if not policy:
                db.add(StorePolicy(store_id=store.store_id, policy_name=name, content=content, access_level=PolicyAccessLevel.public, is_active=True))
                policy_count += 1
            else:
                policy.content = content
                
            # RAG Chunk for the policy
            chunk = db.query(RAGDocumentChunk).filter(RAGDocumentChunk.store_id == store.store_id, RAGDocumentChunk.source_type == RAGSourceType.store_policy, RAGDocumentChunk.chunk_text.contains(f"Policy Title: {name}")).first()
            if not chunk:
                db.add(RAGDocumentChunk(
                    store_id=store.store_id,
                    source_type=RAGSourceType.store_policy,
                    access_level=RAGAccessLevel.public,
                    chunk_text=f"Policy Title: {name}\nDetails: {content}",
                    embedding_model="mock-embedding-v1",
                    is_active=True
                ))
                chunk_count += 1
            else:
                chunk.chunk_text = f"Policy Title: {name}\nDetails: {content}"
                
        # Also create RAG chunks for FAQs
        for q, a in faqs:
            chunk_text = f"FAQ Question: {q}\nAnswer: {a}"
            chunk = db.query(RAGDocumentChunk).filter(RAGDocumentChunk.store_id == store.store_id, RAGDocumentChunk.chunk_text == chunk_text).first()
            if not chunk:
                db.add(RAGDocumentChunk(
                    store_id=store.store_id,
                    source_type=RAGSourceType.faq,
                    access_level=RAGAccessLevel.public,
                    chunk_text=chunk_text,
                    embedding_model="mock-embedding-v1",
                    is_active=True
                ))
                chunk_count += 1

        db.commit()
        print(f"Successfully seeded {faq_count} new FAQs, {policy_count} new Policies, and {chunk_count} new RAG Document Chunks!")

    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_knowledge_base()
