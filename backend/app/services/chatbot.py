"""
Chatbot Service — RAG-based AI Assistant
Uses FAISS vector store + sentence embeddings + LLM API
"""

import json
import logging
import os
import faiss                          # Facebook AI Similarity Search — vector index library
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
TOP_K_RETRIEVAL = 5  # Number of most relevant chunks to retrieve per query
# Resolve absolute path for FAISS indexes based on settings
FAISS_INDEX_DIR = os.path.join(settings.BASE_DIR if hasattr(settings, "BASE_DIR") else os.path.dirname(os.path.dirname(os.path.dirname(__file__))), settings.FAISS_INDEX_DIR)


# Embedding Model
class EmbeddingService:
    """Singleton for embedding generation."""
    
    _instance: Optional["EmbeddingService"] = None
    _model = None
    
    def __new__(cls):
        # Singleton pattern: ensures only one instance is created across the app lifetime
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def get_model(self):
        """Lazy load the sentence transformer model."""
        if self._model is None:
            from sentence_transformers import SentenceTransformer
            model_name = settings.EMBEDDING_MODEL
            logger.info(f"Loading embedding model: {model_name}")
            self._model = SentenceTransformer(model_name)  # Loaded once and cached
        return self._model
    
    def embed(self, text: str):
        """Generate embedding for a single text."""
        model = self.get_model()
        embedding = model.encode(text, convert_to_numpy=True)
        return embedding.astype("float32")  # FAISS requires float32

    def embed_batch(self, texts: list[str]):
        """Generate embeddings for multiple texts."""
        model = self.get_model()
        embeddings = model.encode(texts, convert_to_numpy=True, show_progress_bar=False)
        return embeddings.astype("float32")


# Global singleton embedding service used across the module
embedding_service = EmbeddingService()


# FAISS Vector Store
class FAISSVectorStore:
    """Manages FAISS indexes per store."""
    
    def __init__(self):
        os.makedirs(FAISS_INDEX_DIR, exist_ok=True)  # Ensure index directory exists
        self._indexes: dict[int, faiss.Index] = {}           # In-memory FAISS index per store
        self._chunk_mappings: dict[int, list[int]] = {}      # store_id -> [chunk_ids]
    
    def _get_index_path(self, store_id: int) -> str:
        # Returns the file path for a store's FAISS index file
        return os.path.join(FAISS_INDEX_DIR, f"store_{store_id}.faiss")
    
    def _get_mapping_path(self, store_id: int) -> str:
        # Returns the file path for a store's chunk ID mapping (JSON)
        return os.path.join(FAISS_INDEX_DIR, f"store_{store_id}_mapping.json")
    
    def load_or_create_index(self, store_id: int, dimension: int = 384):
        """Load existing index or create new one."""
        # Return cached in-memory index if already loaded
        if store_id in self._indexes:
            return self._indexes[store_id]
        
        index_path = self._get_index_path(store_id)
        mapping_path = self._get_mapping_path(store_id)
        
        if os.path.exists(index_path):
            # Load persisted index and its chunk ID mapping from disk
            logger.info(f"Loading FAISS index for store {store_id}")
            index = faiss.read_index(index_path)
            with open(mapping_path, "r") as f:
                self._chunk_mappings[store_id] = json.load(f)
        else:
            logger.info(f"Creating new FAISS index for store {store_id}")
            # IndexFlatIP = Inner Product index; cosine similarity after L2 normalization
            index = faiss.IndexFlatIP(dimension)
            self._chunk_mappings[store_id] = []
        
        self._indexes[store_id] = index
        return index
    
    def save_index(self, store_id: int):
        """Persist index and mapping to disk."""
        if store_id not in self._indexes:
            return
        
        index_path = self._get_index_path(store_id)
        mapping_path = self._get_mapping_path(store_id)
        
        faiss.write_index(self._indexes[store_id], index_path)   # Save binary FAISS file
        with open(mapping_path, "w") as f:
            json.dump(self._chunk_mappings[store_id], f)          # Save chunk ID list as JSON
        
        logger.info(f"Saved FAISS index for store {store_id}")
    
    def add_chunks(
        self, store_id: int, chunk_ids: list[int], embeddings
    ):
        """Add new chunks to the index."""
        index = self.load_or_create_index(store_id, dimension=embeddings.shape[1])
        
        # Normalize for cosine similarity — required before adding to IndexFlatIP
        faiss.normalize_L2(embeddings)
        
        index.add(embeddings)                               # Add vectors to FAISS index
        self._chunk_mappings[store_id].extend(chunk_ids)   # Track which chunk_id maps to which FAISS position
        
        self.save_index(store_id)
        logger.info(f"Added {len(chunk_ids)} chunks to store {store_id} index")
    
    def search(
        self, store_id: int, query_embedding, top_k: int = TOP_K_RETRIEVAL
    ) -> list[tuple[int, float]]:
        """Search for most similar chunks. Returns [(chunk_id, score), ...]"""
        index = self.load_or_create_index(store_id)
        
        # Return empty list if the index has no vectors yet
        if index.ntotal == 0:
            return []
        
        # Normalize query
        query_embedding = query_embedding.reshape(1, -1).astype("float32")
        faiss.normalize_L2(query_embedding)
        
        # Search — returns top_k closest vectors as (scores, indices) arrays
        scores, indices = index.search(query_embedding, min(top_k, index.ntotal))
        
        # Map FAISS position indices back to actual chunk_ids
        results = []
        for idx, score in zip(indices[0], scores[0]):
            if idx < len(self._chunk_mappings[store_id]):
                chunk_id = self._chunk_mappings[store_id][idx]
                results.append((chunk_id, float(score)))
        
        return results
    
    def rebuild_index(self, store_id: int, db: Session):
        """Rebuild index from scratch using DB chunks."""
        # Fetch all active RAG chunks for this store from the database
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
        
        # Clear existing in-memory index before rebuilding
        if store_id in self._indexes:
            del self._indexes[store_id]
        self._chunk_mappings[store_id] = []
        
        # Generate embeddings for all chunks in one batch
        texts = [c.chunk_text for c in chunks]
        chunk_ids = [c.chunk_id for c in chunks]
        
        embeddings = embedding_service.embed_batch(texts)
        
        # Add all embeddings to the freshly created index
        self.add_chunks(store_id, chunk_ids, embeddings)
        logger.info(f"Rebuilt index for store {store_id} with {len(chunks)} chunks")


# Global FAISS vector store instance shared across all requests
vector_store = FAISSVectorStore()


# Document Ingestion
def ingest_faqs(db: Session, store_id: int, access_level: str = "public"):
    """Ingest store FAQs into RAG chunks."""
    # Fetch all active FAQs for this store
    faqs = (
        db.query(StoreFAQ)
        .filter(StoreFAQ.store_id == store_id, StoreFAQ.is_active.is_(True))
        .all()
    )
    
    chunks_to_add = []
    for faq in faqs:
        # Check if already exists — skip to avoid duplicate chunks in the vector store
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
        
        # Create chunk combining question and answer for better semantic retrieval
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
    
    db.flush()  # Write to DB to get chunk_ids assigned before embedding
    
    # Generate embeddings and add to FAISS
    if chunks_to_add:
        texts = [c.chunk_text for c in chunks_to_add]
        chunk_ids = [c.chunk_id for c in chunks_to_add]
        embeddings = embedding_service.embed_batch(texts)
        
        vector_store.add_chunks(store_id, chunk_ids, embeddings)  # Add to FAISS index
        
        # Update FAISS index IDs
        for chunk, idx in zip(chunks_to_add, range(len(chunk_ids))):
            chunk.faiss_index_id = idx  # Store FAISS position for reference
    
    db.commit()
    logger.info(f"Ingested {len(chunks_to_add)} FAQ chunks for store {store_id}")


def ingest_policies(db: Session, store_id: int):
    """Ingest store policies into RAG chunks."""
    print(f"DEBUG: RUNNING ingest_policies for store {store_id}")
    # Fetch all active store policies
    policies = (
        db.query(StorePolicy)
        .filter(StorePolicy.store_id == store_id, StorePolicy.is_active.is_(True))
        .all()
    )
    
    chunks_to_add = []
    for policy in policies:
        # Skip if this policy has already been ingested
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
        
        # Format policy as a readable text chunk for embedding
        chunk_text = f"Policy: {policy.policy_name}\n{policy.content}"
        
        # Map policy access to RAG access
        # PolicyAccessLevel is 'public' or 'private'
        p_access = policy.access_level.value if hasattr(policy.access_level, "value") else policy.access_level
        # Map: public policies remain public; private/internal policies become admin-only
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
    
    db.flush()  # Assign chunk_ids before embedding
    
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
    # Fetch all active products for this store
    products = (
        db.query(Product)
        .filter(Product.store_id == store_id, Product.is_active.is_(True))
        .all()
    )
    
    chunks_to_add = []
    for product in products:
        # Skip products already present in the vector store
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
        
        # Build a descriptive text block for the product (used for semantic search)
        chunk_text = (
            f"Product: {product.product_name}\n"
            f"Barcode: {product.barcode}\n"
            f"Price: NPR {product.unit_price}\n"
            f"Category: {product.category.category_name if product.category else 'N/A'}\n"
        )
        if product.description:
            chunk_text += f"Description: {product.description}"  # Append only if available
        
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
    
    # Compute live aggregate statistics directly from the database
    total_products = db.query(func.count(Product.product_id)).filter(Product.store_id == store_id, Product.is_active.is_(True)).scalar() or 0
    total_categories = db.query(func.count(Category.category_id)).filter(Category.store_id == store_id).scalar() or 0
    total_transactions = db.query(func.count(Transaction.transaction_id)).filter(Transaction.store_id == store_id).scalar() or 0
    
    # Build a human-readable summary that the LLM can reference when answering stats questions
    chunk_text = (
        f"STORE STATISTICS AND OVERVIEW:\n"
        f"Total active products in inventory: {total_products}\n"
        f"Total categories: {total_categories}\n"
        f"Total sales transactions processed: {total_transactions}\n"
        f"This document contains the exact total count of products and sales for the store."
    )
    
    # Check if a statistics chunk already exists for this store
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
        # Update in place to keep stats current without creating duplicate chunks
        existing.chunk_text = chunk_text
        db.commit()
        logger.info(f"Updated store statistics chunk for store {store_id}")
    else:
        # First-time ingestion: create new chunk and add to FAISS
        chunk = RAGDocumentChunk(
            store_id=store_id,
            source_type=RAGSourceType.inventory_summary,
            access_level=RAGAccessLevel.admin,  # Only admins should see store-level statistics
            source_id=0,                         # No specific source record; use 0 as placeholder
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
            "Authorization": f"Bearer {getattr(settings, 'GROQ_API_KEY', '')}",  # Bearer token auth
            "Content-Type": "application/json",
        }
        
        # Build the request payload: system prompt prepended to conversation history
        payload = {
            "model": "llama-3.1-8b-instant",  # Fast Llama 3.1 8B model via Groq
            "messages": [{"role": "system", "content": system_prompt}] + messages,
            "max_tokens": max_tokens,
            "temperature": 0.7,  # Balanced between creativity and factual accuracy
        }
        
        # Use async HTTP client with a 30s timeout to avoid hanging on slow API calls
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.post(url, headers=headers, json=payload)
                if response.status_code != 200:
                    logger.error(f"Groq API Error: {response.status_code} - {response.text}")
                response.raise_for_status()  # Raise exception for 4xx/5xx responses
                data = response.json()
                return data["choices"][0]["message"]["content"]  # Extract LLM reply text
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
        self.access_level = access_level  # Controls which RAG chunks the user can access
    
    def retrieve_context(self, query: str, top_k: int = TOP_K_RETRIEVAL) -> list[str]:
        """Retrieve relevant chunks for the query."""
        # Generate query embedding
        query_embedding = embedding_service.embed(query)
        
        # Search FAISS for the top_k most semantically similar chunks
        results = vector_store.search(self.store_id, query_embedding, top_k)
        
        if not results:
            return []
        
        # Fetch chunks from DB
        chunk_ids = [r[0] for r in results]  # Extract chunk IDs from (id, score) tuples
        chunks = (
            self.db.query(RAGDocumentChunk)
            .filter(
                RAGDocumentChunk.chunk_id.in_(chunk_ids),
                RAGDocumentChunk.is_active.is_(True),
            )
            .all()
        )
        
        # Filter by access level (public < staff < admin)
        # Users can only see chunks at or below their own access level
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
        # Short greetings (< 6 words) matching known patterns skip the RAG retrieval step
        is_simple_greet = any(p in user_message.lower() for p in greet_patterns) and len(user_message.split()) < 6
        
        context_chunks = []
        if not is_simple_greet:
            # Only retrieve RAG context for non-trivial queries
            context_chunks = self.retrieve_context(user_message)
        
        # 2. Build strict Retail-Only System Prompt
        # Inject retrieved chunks as context; fallback message if nothing is found
        context_str = "\n\n---\n\n".join(context_chunks) if context_chunks else "No specific store data retrieved."
        
        # System prompt instructs the LLM to stay within retail scope and use context
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
        
        # Build message history — append the latest user message at the end
        messages = conversation_history + [{"role": "user", "content": user_message}]
        
        # Call LLM
        try:
            response = await call_llm(messages, system_prompt, max_tokens=500)
        except Exception as e:
            logger.error(f"Error in call_llm: {str(e)}")
            raise
        
        # Return response + context (for logging)
        context_json = json.dumps(context_chunks)  # Serialize retrieved chunks for DB storage
        return response, context_json
    
    def get_or_create_session(self, user_id: Optional[int]) -> ChatbotSession:
        """Get active session or create new one."""
        # Find active session (ended_at is null)
        # Active session = same store, user, and access level, not yet ended
        session = (
            self.db.query(ChatbotSession)
            .filter(
                ChatbotSession.store_id == self.store_id,
                ChatbotSession.user_id == user_id,
                ChatbotSession.access_level == self.access_level,
                ChatbotSession.ended_at.is_(None),  # Only open sessions
            )
            .first()
        )
        
        if not session:
            # No active session found — create a fresh one
            session = ChatbotSession(
                store_id=self.store_id,
                user_id=user_id,
                access_level=self.access_level,
            )
            self.db.add(session)
            self.db.flush()  # Flush to get session_id before saving messages
        
        return session
    
    def save_message(
        self,
        session_id: int,
        sender_type: str,         # Either 'user' or 'bot'
        message_text: str,
        retrieved_context: Optional[str] = None,  # JSON-encoded list of retrieved chunks
    ):
        """Save a message to the session."""
        msg = ChatbotMessage(
            session_id=session_id,
            sender_type=sender_type,
            message_text=message_text,
            retrieved_context=retrieved_context,  # Stored for audit/debugging purposes
        )
        self.db.add(msg)
        self.db.commit()
    
    def get_conversation_history(
        self, session_id: int, max_messages: int = 10
    ) -> list[dict]:
        """Get recent conversation history for context."""
        # Fetch the most recent N messages (desc order, then reverse for chronology)
        messages = (
            self.db.query(ChatbotMessage)
            .filter(ChatbotMessage.session_id == session_id)
            .order_by(ChatbotMessage.sent_at.desc())
            .limit(max_messages)
            .all()
        )
        
        # Reverse to get chronological order (oldest → newest)
        messages = list(reversed(messages))
        
        history = []
        for msg in messages:
            # Map sender type to OpenAI-compatible role names
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
        
        # Generate response — uses RAG retrieval + LLM call
        response, context = await self.generate_response(user_message, history)
        
        # Save bot response with retrieved context for audit trail
        self.save_message(session.session_id, "bot", response, context)
        
        return response
