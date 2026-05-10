"""
Database seed script for AI (FAQs, Policies, Forecasts, and Chatbot Data).
Usage: python seed_ai.py
"""

import random
from datetime import datetime, timedelta
from decimal import Decimal

from app.database import Base, SessionLocal, engine
from app.models import (
    Store, Product, User, StoreFAQ, StorePolicy, 
    RAGDocumentChunk, ChatbotSession, ChatbotMessage, SalesForecast
)
from app.models.enums import (
    PolicyAccessLevel, RAGSourceType, RAGAccessLevel, ChatSenderType
)

def seed_ai():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        print("Fetching Store and Products...")
        store = db.query(Store).filter(Store.store_id == 1).first()
        if not store:
            print("Store not found! Run previous seeds first.")
            return

        products = db.query(Product).filter(Product.store_id == store.store_id).all()
        customers = db.query(User).filter(User.email.contains("customer")).all()

        print("Seeding FAQs...")
        faqs = [
            ("What is your return policy?", "Items can be returned within 7 days of purchase if unopened and with receipt."),
            ("Do you offer home delivery?", "Yes, we offer home delivery for orders above Rs. 1000 within a 5km radius."),
            ("What payment methods are accepted?", "We accept cash, credit/debit cards, and mobile QR payments (eSewa, Khalti)."),
        ]
        for q, a in faqs:
            faq = db.query(StoreFAQ).filter(StoreFAQ.store_id == store.store_id, StoreFAQ.question == q).first()
            if not faq:
                db.add(StoreFAQ(store_id=store.store_id, question=q, answer=a))

        print("Seeding Policies...")
        policies = [
            ("Return Policy", "Standard 7-day return policy for unopened items. Electronics require original packaging. No returns on perishable groceries.", PolicyAccessLevel.public),
            ("Staff Discount Policy", "All cashiers and admins receive a 10% discount on non-promotional items.", PolicyAccessLevel.public),
        ]
        for name, content, level in policies:
            policy = db.query(StorePolicy).filter(StorePolicy.store_id == store.store_id, StorePolicy.policy_name == name).first()
            if not policy:
                db.add(StorePolicy(store_id=store.store_id, policy_name=name, content=content, access_level=level))

        print("Seeding RAG Document Chunks...")
        # Add basic vector chunks for policies to simulate RAG
        for name, content, level in policies:
            chunk = db.query(RAGDocumentChunk).filter(RAGDocumentChunk.store_id == store.store_id, RAGDocumentChunk.chunk_text.contains(name)).first()
            if not chunk:
                db.add(RAGDocumentChunk(
                    store_id=store.store_id,
                    source_type=RAGSourceType.store_policy,
                    access_level=RAGAccessLevel.public if level == PolicyAccessLevel.public else RAGAccessLevel.staff,
                    chunk_text=f"Policy: {name}. Details: {content}",
                    embedding_model="mock-embedding-v1"
                ))

        print("Seeding Sales Forecasts...")
        # Create a forecast for the next 7 days for the first 5 products
        now_date = datetime.now().date()
        for prod in products[:5]:
            for i in range(1, 8):
                f_date = now_date + timedelta(days=i)
                forecast = db.query(SalesForecast).filter(
                    SalesForecast.store_id == store.store_id, 
                    SalesForecast.product_id == prod.product_id, 
                    SalesForecast.forecast_date == f_date
                ).first()
                
                if not forecast:
                    db.add(SalesForecast(
                        store_id=store.store_id,
                        product_id=prod.product_id,
                        forecast_date=f_date,
                        predicted_quantity=Decimal(str(random.randint(5, 20))),
                        rmse_score=Decimal("1.2"),
                        mae_score=Decimal("0.9"),
                        model_version="v1.0"
                    ))

        print("Seeding Chatbot Sessions...")
        # One mock session per customer (up to 3)
        if customers:
            for cust in customers[:3]:
                sess = db.query(ChatbotSession).filter(ChatbotSession.store_id == store.store_id, ChatbotSession.user_id == cust.user_id).first()
                if not sess:
                    sess = ChatbotSession(
                        user_id=cust.user_id,
                        store_id=store.store_id,
                        access_level=RAGAccessLevel.public,
                        started_at=datetime.now() - timedelta(hours=random.randint(1, 24))
                    )
                    db.add(sess)
                    db.flush()
                    
                    db.add(ChatbotMessage(
                        session_id=sess.session_id, sender_type=ChatSenderType.user, message_text="What is your return policy?"
                    ))
                    db.add(ChatbotMessage(
                        session_id=sess.session_id, sender_type=ChatSenderType.bot, message_text="Items can be returned within 7 days if unopened.",
                        retrieved_context="Policy: Return Policy. Details: Standard 7-day return policy..."
                    ))

        db.commit()
        print("Successfully seeded AI context: FAQs, Policies, Forecasts, and Chat!")

    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_ai()
