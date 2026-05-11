"""
Chatbot Service — RAG-based AI Assistant
Uses FAISS vector store + sentence embeddings + LLM API
"""

import json
import logging
import os
import faiss
import numpy as np
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models import (
    ChatbotMessage,
    ChatbotSession,
    Product,
    RAGDocumentChunk,
    StoreFAQ,
    StorePolicy,
)
from app.models.enums import RAGSourceType, RAGAccessLevel

logger = logging.getLogger(__name__)

# Configuration
TOP_K_RETRIEVAL = 5
# Resolve absolute path for FAISS indexes based on settings
FAISS_INDEX_DIR = os.path.join(settings.BASE_DIR if hasattr(settings, "BASE_DIR") else os.path.dirname(os.path.dirname(os.path.dirname(__file__))), settings.FAISS_INDEX_DIR)


# Embedding Model
class EmbeddingService:
    """Singleton for embedding generation."""
    
    _instance: Optional["EmbeddingService"] = None
    _model = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def get_model(self):
        """Lazy load the sentence transformer model."""
        if self._model is None:
            from sentence_transformers import SentenceTransformer
            model_name = settings.EMBEDDING_MODEL
            logger.info(f"Loading embedding model: {model_name}")
            self._model = SentenceTransformer(model_name)
        return self._model
    
    def embed(self, text: str):
        """Generate embedding for a single text."""
        model = self.get_model()
        embedding = model.encode(text, convert_to_numpy=True)
        return embedding.astype("float32")

    def embed_batch(self, texts: list[str]):
        """Generate embeddings for multiple texts."""
        model = self.get_model()
        embeddings = model.encode(texts, convert_to_numpy=True, show_progress_bar=False)
        return embeddings.astype("float32")


embedding_service = EmbeddingService()


# FAISS Vector Store
class FAISSVectorStore:
    """Manages FAISS indexes per store."""
    
    def __init__(self):
        os.makedirs(FAISS_INDEX_DIR, exist_ok=True)
        self._indexes: dict[int, faiss.Index] = {}
        self._chunk_mappings: dict[int, list[int]] = {}  # store_id -> [chunk_ids]
    
    def _get_index_path(self, store_id: int) -> str:
        return os.path.join(FAISS_INDEX_DIR, f"store_{store_id}.faiss")
    
    def _get_mapping_path(self, store_id: int) -> str:
        return os.path.join(FAISS_INDEX_DIR, f"store_{store_id}_mapping.json")
    
    def load_or_create_index(self, store_id: int, dimension: int = 384):
        """Load existing index or create new one."""
        if store_id in self._indexes:
            return self._indexes[store_id]
        
        index_path = self._get_index_path(store_id)
        mapping_path = self._get_mapping_path(store_id)
        
        if os.path.exists(index_path):
            logger.info(f"Loading FAISS index for store {store_id}")
            index = faiss.read_index(index_path)
            with open(mapping_path, "r") as f:
                self._chunk_mappings[store_id] = json.load(f)
        else:
            logger.info(f"Creating new FAISS index for store {store_id}")
            index = faiss.IndexFlatIP(dimension)  # Inner Product (cosine similarity after normalization)
            self._chunk_mappings[store_id] = []
        
        self._indexes[store_id] = index
        return index
    
    def save_index(self, store_id: int):
        """Persist index and mapping to disk."""
        if store_id not in self._indexes:
            return
        
        index_path = self._get_index_path(store_id)
        mapping_path = self._get_mapping_path(store_id)
        
        faiss.write_index(self._indexes[store_id], index_path)
        with open(mapping_path, "w") as f:
            json.dump(self._chunk_mappings[store_id], f)
        
        logger.info(f"Saved FAISS index for store {store_id}")
    
    def add_chunks(
        self, store_id: int, chunk_ids: list[int], embeddings
    ):
        """Add new chunks to the index."""
        index = self.load_or_create_index(store_id, dimension=embeddings.shape[1])
        
        # Normalize for cosine similarity
        faiss.normalize_L2(embeddings)
        
        index.add(embeddings)
        self._chunk_mappings[store_id].extend(chunk_ids)
        
        self.save_index(store_id)
        logger.info(f"Added {len(chunk_ids)} chunks to store {store_id} index")
    
    def search(
        self, store_id: int, query_embedding, top_k: int = TOP_K_RETRIEVAL
    ) -> list[tuple[int, float]]:
        """Search for most similar chunks. Returns [(chunk_id, score), ...]"""
        index = self.load_or_create_index(store_id)
        
        if index.ntotal == 0:
            return []
        
        # Normalize query
        query_embedding = query_embedding.reshape(1, -1).astype("float32")
        faiss.normalize_L2(query_embedding)
        
        # Search
        scores, indices = index.search(query_embedding, min(top_k, index.ntotal))
        
        results = []
        for idx, score in zip(indices[0], scores[0]):
            if idx < len(self._chunk_mappings[store_id]):
                chunk_id = self._chunk_mappings[store_id][idx]
                results.append((chunk_id, float(score)))
        
        return results
    
    def rebuild_index(self, store_id: int, db: Session):
        """Rebuild index from scratch using DB chunks."""
        chunks = (
            db.query(RAGDocumentChunk)
            .filter(
                RAGDocumentChunk.store_id == store_id,
                RAGDocumentChunk.is_active.is_(True),
            )
            .all()
        )
        
        if not chunks:
            logger.warning(f"No chunks found for store {store_id}")
            return
        
        # Clear existing
        if store_id in self._indexes:
            del self._indexes[store_id]
        self._chunk_mappings[store_id] = []
        
        # Generate embeddings
        texts = [c.chunk_text for c in chunks]
        chunk_ids = [c.chunk_id for c in chunks]
        
        embeddings = embedding_service.embed_batch(texts)
        
        # Add to index
        self.add_chunks(store_id, chunk_ids, embeddings)
        logger.info(f"Rebuilt index for store {store_id} with {len(chunks)} chunks")


vector_store = FAISSVectorStore()


# Document Ingestion
def ingest_faqs(db: Session, store_id: int, access_level: str = "public"):
    """Ingest store FAQs into RAG chunks."""
    faqs = (
        db.query(StoreFAQ)
        .filter(StoreFAQ.store_id == store_id, StoreFAQ.is_active.is_(True))
        .all()
    )
    
    chunks_to_add = []
    for faq in faqs:
        # Check if already exists
        existing = (
            db.query(RAGDocumentChunk)
            .filter(
                RAGDocumentChunk.store_id == store_id,
                RAGDocumentChunk.source_type == RAGSourceType.faq,
                RAGDocumentChunk.source_id == faq.faq_id,
            )
            .first()
        )
        
        if existing:
            continue
        
        # Create chunk combining question and answer
        chunk_text = f"Q: {faq.question}\nA: {faq.answer}"
        
        chunk = RAGDocumentChunk(
            store_id=store_id,
            source_type=RAGSourceType.faq,
            access_level=access_level,
            source_id=faq.faq_id,
            chunk_text=chunk_text,
            embedding_model=getattr(settings, 'EMBEDDING_MODEL', 'all-MiniLM-L6-v2'),
        )
        db.add(chunk)
        chunks_to_add.append(chunk)
    
    db.flush()
    
    # Generate embeddings and add to FAISS
    if chunks_to_add:
        texts = [c.chunk_text for c in chunks_to_add]
        chunk_ids = [c.chunk_id for c in chunks_to_add]
        embeddings = embedding_service.embed_batch(texts)
        
        vector_store.add_chunks(store_id, chunk_ids, embeddings)
        
        # Update FAISS index IDs
        for chunk, idx in zip(chunks_to_add, range(len(chunk_ids))):
            chunk.faiss_index_id = idx
    
    db.commit()
    logger.info(f"Ingested {len(chunks_to_add)} FAQ chunks for store {store_id}")


def ingest_policies(db: Session, store_id: int):
    """Ingest store policies into RAG chunks."""
    print(f"DEBUG: RUNNING ingest_policies for store {store_id}")
    policies = (
        db.query(StorePolicy)
        .filter(StorePolicy.store_id == store_id, StorePolicy.is_active.is_(True))
        .all()
    )
    
    chunks_to_add = []
    for policy in policies:
        existing = (
            db.query(RAGDocumentChunk)
            .filter(
                RAGDocumentChunk.store_id == store_id,
                RAGDocumentChunk.source_type == RAGSourceType.store_policy,
                RAGDocumentChunk.source_id == policy.policy_id,
            )
            .first()
        )
        
        if existing:
            continue
        
        chunk_text = f"Policy: {policy.policy_name}\n{policy.content}"
        
        # Map policy access to RAG access
        # PolicyAccessLevel is 'public' or 'private'
        p_access = policy.access_level.value if hasattr(policy.access_level, "value") else policy.access_level
        rag_access = RAGAccessLevel.public if p_access == "public" else RAGAccessLevel.admin
        
        chunk = RAGDocumentChunk(
            store_id=store_id,
            source_type=RAGSourceType.store_policy,
            access_level=rag_access,
            source_id=policy.policy_id,
            chunk_text=chunk_text,
            embedding_model=getattr(settings, 'EMBEDDING_MODEL', 'all-MiniLM-L6-v2'),
        )
        db.add(chunk)
        chunks_to_add.append(chunk)
    
    db.flush()
    
    if chunks_to_add:
        texts = [c.chunk_text for c in chunks_to_add]
        chunk_ids = [c.chunk_id for c in chunks_to_add]
        embeddings = embedding_service.embed_batch(texts)
        
        vector_store.add_chunks(store_id, chunk_ids, embeddings)
        
        for chunk, idx in zip(chunks_to_add, range(len(chunk_ids))):
            chunk.faiss_index_id = idx
    
    db.commit()
    logger.info(f"Ingested {len(chunks_to_add)} policy chunks for store {store_id}")


def ingest_products(db: Session, store_id: int, access_level: str = "public"):
    """Ingest product info into RAG chunks."""
    products = (
        db.query(Product)
        .filter(Product.store_id == store_id, Product.is_active.is_(True))
        .all()
    )
    
    chunks_to_add = []
    for product in products:
        existing = (
            db.query(RAGDocumentChunk)
            .filter(
                RAGDocumentChunk.store_id == store_id,
                RAGDocumentChunk.source_type == RAGSourceType.product,
                RAGDocumentChunk.source_id == product.product_id,
            )
            .first()
        )
        
        if existing:
            continue
        
        chunk_text = (
            f"Product: {product.product_name}\n"
            f"Barcode: {product.barcode}\n"
            f"Price: NPR {product.unit_price}\n"
            f"Category: {product.category.category_name if product.category else 'N/A'}\n"
        )
        if product.description:
            chunk_text += f"Description: {product.description}"
        
        chunk = RAGDocumentChunk(
            store_id=store_id,
            source_type=RAGSourceType.product,
            access_level=access_level,
            source_id=product.product_id,
            chunk_text=chunk_text,
            embedding_model=getattr(settings, 'EMBEDDING_MODEL', 'all-MiniLM-L6-v2'),
        )
        db.add(chunk)
        chunks_to_add.append(chunk)
    
    db.flush()
    
    if chunks_to_add:
        texts = [c.chunk_text for c in chunks_to_add]
        chunk_ids = [c.chunk_id for c in chunks_to_add]
        embeddings = embedding_service.embed_batch(texts)
        
        vector_store.add_chunks(store_id, chunk_ids, embeddings)
        
        for chunk, idx in zip(chunks_to_add, range(len(chunk_ids))):
            chunk.faiss_index_id = idx
    
    db.commit()
    logger.info(f"Ingested {len(chunks_to_add)} product chunks for store {store_id}")


def ingest_store_statistics(db: Session, store_id: int):
    """Ingest aggregated store statistics into RAG chunks for admin query support."""
    from sqlalchemy import func
    from app.models import Product, Category, Transaction
    from app.models.enums import RAGSourceType, RAGAccessLevel
    
    total_products = db.query(func.count(Product.product_id)).filter(Product.store_id == store_id, Product.is_active.is_(True)).scalar() or 0
    total_categories = db.query(func.count(Category.category_id)).filter(Category.store_id == store_id).scalar() or 0
    total_transactions = db.query(func.count(Transaction.transaction_id)).filter(Transaction.store_id == store_id).scalar() or 0
    
    chunk_text = (
        f"STORE STATISTICS AND OVERVIEW:\n"
        f"Total active products in inventory: {total_products}\n"
        f"Total categories: {total_categories}\n"
        f"Total sales transactions processed: {total_transactions}\n"
        f"This document contains the exact total count of products and sales for the store."
    )
    
    existing = (
        db.query(RAGDocumentChunk)
        .filter(
            RAGDocumentChunk.store_id == store_id,
            RAGDocumentChunk.source_type == RAGSourceType.inventory_summary,
        )
        .first()
    )
    
    chunks_to_add = []
    if existing:
        existing.chunk_text = chunk_text
        db.commit()
        logger.info(f"Updated store statistics chunk for store {store_id}")
    else:
        chunk = RAGDocumentChunk(
            store_id=store_id,
            source_type=RAGSourceType.inventory_summary,
            access_level=RAGAccessLevel.admin,
            source_id=0,
            chunk_text=chunk_text,
            embedding_model=getattr(settings, 'EMBEDDING_MODEL', 'all-MiniLM-L6-v2'),
        )
        db.add(chunk)
        chunks_to_add.append(chunk)
        db.flush()
        
        texts = [chunk.chunk_text]
        chunk_ids = [chunk.chunk_id]
        embeddings = embedding_service.embed_batch(texts)
        
        vector_store.add_chunks(store_id, chunk_ids, embeddings)
        chunk.faiss_index_id = 0
        db.commit()
        logger.info(f"Ingested store statistics chunk for store {store_id}")


# LLM Integration
async def call_llm(
    messages: list[dict[str, str]],
    system_prompt: str,
    max_tokens: int = 1000,
) -> str:
    """
    Call LLM API (OpenAI/Anthropic).
    In production, use actual API. For MVP, this uses httpx to call OpenAI-compatible endpoint.
    """
    import httpx
    
    # Check which API to use based on settings
    api_provider = getattr(settings, "LLM_PROVIDER", "groq")
    
    if api_provider == "groq":
        # Groq API (OpenAI compatible)
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {getattr(settings, 'GROQ_API_KEY', '')}",
            "Content-Type": "application/json",
        }
        
        payload = {
            "model": "llama-3.1-8b-instant",
            "messages": [{"role": "system", "content": system_prompt}] + messages,
            "max_tokens": max_tokens,
            "temperature": 0.7,
        }
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.post(url, headers=headers, json=payload)
                if response.status_code != 200:
                    logger.error(f"Groq API Error: {response.status_code} - {response.text}")
                response.raise_for_status()
                data = response.json()
                return data["choices"][0]["message"]["content"]
            except Exception as e:
                logger.error(f"HTTP error calling LLM: {str(e)}")
                raise
    else:
        raise ValueError(f"Unsupported LLM provider: {api_provider}")


# Chatbot Service
class ChatbotService:
    """Main chatbot service coordinating RAG retrieval + LLM generation."""
    
    def __init__(self, db: Session, store_id: int, access_level: str):
        self.db = db
        self.store_id = store_id
        self.access_level = access_level
    
    def retrieve_context(self, query: str, top_k: int = TOP_K_RETRIEVAL) -> list[str]:
        """Retrieve relevant chunks for the query."""
        # Generate query embedding
        query_embedding = embedding_service.embed(query)
        
        # Search FAISS
        results = vector_store.search(self.store_id, query_embedding, top_k)
        
        if not results:
            return []
        
        # Fetch chunks from DB
        chunk_ids = [r[0] for r in results]
        chunks = (
            self.db.query(RAGDocumentChunk)
            .filter(
                RAGDocumentChunk.chunk_id.in_(chunk_ids),
                RAGDocumentChunk.is_active.is_(True),
            )
            .all()
        )
        
        # Filter by access level (public < staff < admin)
        access_hierarchy = {"public": 0, "staff": 1, "admin": 2}
        user_level = access_hierarchy.get(self.access_level, 0)
        
        filtered_chunks = [
            c for c in chunks
            if access_hierarchy.get(
                c.access_level.value if hasattr(c.access_level, "value") else c.access_level, 0
            ) <= user_level
        ]
        
        return [c.chunk_text for c in filtered_chunks]
    
    async def generate_response(
        self, user_message: str, conversation_history: list[dict]
    ) -> tuple[str, str]:
        """
        Generate chatbot response using RAG.
        Returns (response_text, retrieved_context_json)
        """
        # 1. Intent Analysis: Decide if we need RAG
        # We trigger RAG if the query is not a simple greeting/identity/polite question
        greet_patterns = [
            "hi", "hello", "hey", "who are you", "what is your name", "what can you do",
            "namaste", "good morning", "good afternoon", "good evening", "how are you",
            "sanchai", "who created you", "who made you", "are you a bot", "help me"
        ]
        is_simple_greet = any(p in user_message.lower() for p in greet_patterns) and len(user_message.split()) < 6
        
        context_chunks = []
        if not is_simple_greet:
            context_chunks = self.retrieve_context(user_message)
        
        # 2. Build strict Retail-Only System Prompt
        context_str = "\n\n---\n\n".join(context_chunks) if context_chunks else "No specific store data retrieved."
        
        system_prompt = f"""You are "InvoSix AI", the professional assistant for this retail store.

### CORE OPERATING RULES:
1. **STRICT RETAIL FOCUS**: You only discuss topics related to THIS store, its products, inventory, staff, and policies.
2. **GREETINGS ARE OK**: Polite greetings (Hi, Hello, Good morning), identity questions ("Who are you?"), and basic "How can you help?" questions are part of store service. Answer them warmly and invite the user to ask about the shop.
3. **REFUSE OUT-OF-CONTEXT**: If the user asks about world news, politics, history, science, or other non-retail topics, politely say: "I'm sorry, I am only specialized in assisting with matters related to this store. How can I help you with our products or services today?"
4. **USE CONTEXT**: Use the provided "STORE DATA" below to answer facts about prices or stock. If the data is missing, suggest contacting a staff member.

### STORE DATA (from Knowledge Base):
{context_str}

### CURRENT TASK:
Answer the user's request professionally. If it's a greeting, be friendly! If it's a question, use the data!"""
        
        # Build message history
        messages = conversation_history + [{"role": "user", "content": user_message}]
        
        # Call LLM
        try:
            response = await call_llm(messages, system_prompt, max_tokens=500)
        except Exception as e:
            logger.error(f"Error in call_llm: {str(e)}")
            raise
        
        # Return response + context (for logging)
        context_json = json.dumps(context_chunks)
        return response, context_json
    
    def get_or_create_session(self, user_id: Optional[int]) -> ChatbotSession:
        """Get active session or create new one."""
        # Find active session (ended_at is null)
        session = (
            self.db.query(ChatbotSession)
            .filter(
                ChatbotSession.store_id == self.store_id,
                ChatbotSession.user_id == user_id,
                ChatbotSession.access_level == self.access_level,
                ChatbotSession.ended_at.is_(None),
            )
            .first()
        )
        
        if not session:
            session = ChatbotSession(
                store_id=self.store_id,
                user_id=user_id,
                access_level=self.access_level,
            )
            self.db.add(session)
            self.db.flush()
        
        return session
    
    def save_message(
        self,
        session_id: int,
        sender_type: str,
        message_text: str,
        retrieved_context: Optional[str] = None,
    ):
        """Save a message to the session."""
        msg = ChatbotMessage(
            session_id=session_id,
            sender_type=sender_type,
            message_text=message_text,
            retrieved_context=retrieved_context,
        )
        self.db.add(msg)
        self.db.commit()
    
    def get_conversation_history(
        self, session_id: int, max_messages: int = 10
    ) -> list[dict]:
        """Get recent conversation history for context."""
        messages = (
            self.db.query(ChatbotMessage)
            .filter(ChatbotMessage.session_id == session_id)
            .order_by(ChatbotMessage.sent_at.desc())
            .limit(max_messages)
            .all()
        )
        
        messages = list(reversed(messages))
        
        history = []
        for msg in messages:
            role = "user" if msg.sender_type.value == "user" else "assistant"
            history.append({"role": role, "content": msg.message_text})
        
        return history
    
    async def chat(self, user_id: Optional[int], user_message: str) -> str:
        """
        Main chat interface.
        1. Get/create session
        2. Save user message
        3. Retrieve context
        4. Generate response
        5. Save bot message
        6. Return response
        """
        session = self.get_or_create_session(user_id)
        
        # Get conversation history BEFORE saving new message to avoid duplication in LLM call
        history = self.get_conversation_history(session.session_id, max_messages=8)
        
        # Save user message
        self.save_message(session.session_id, "user", user_message)
        
        # Generate response
        response, context = await self.generate_response(user_message, history)
        
        # Save bot response
        self.save_message(session.session_id, "bot", response, context)
        
        return response
