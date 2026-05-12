"""
Chatbot Router — /api/v1/chatbot

Endpoints:
  - POST /chat              → Send message, get AI response
  - GET  /sessions          → List user's chat sessions
  - GET  /sessions/{id}     → Get session with messages
  - POST /sessions/{id}/end → End a session
  - POST /admin/ingest      → Ingest FAQs, policies, products (admin only)
  - POST /admin/rebuild     → Rebuild FAISS index (admin only)
"""

import logging
from typing import Optional

# FastAPI core: router creation, dependency injection, HTTP error handling
from fastapi import APIRouter, Depends, HTTPException, status
# Pydantic: data validation and schema definition for request/response bodies
from pydantic import BaseModel, Field
# SQLAlchemy session used for all DB operations
from sqlalchemy.orm import Session

# Project-level DB session provider
from app.database import get_db
# Auth helpers: get logged-in user, enforce admin-only access
from app.core.deps import get_current_user, require_admin
# ORM models for chatbot sessions, messages, users, and role assignments
from app.models import ChatbotMessage, ChatbotSession, User, UserRole
# Service layer: AI chat logic, ingestion functions, and FAISS vector store
from app.services.chatbot import (
    ChatbotService,
    ingest_faqs,
    ingest_policies,
    ingest_products,
    ingest_store_statistics,
    vector_store,
)

# Module-level logger — logs errors and debug info for this router
logger = logging.getLogger(__name__)

# All routes in this file are prefixed with /chatbot and grouped under "Chatbot" in API docs
router = APIRouter(prefix="/chatbot", tags=["Chatbot"])


# ══════════════════════════════════════════════════════════════════════════════
# Schemas
# ══════════════════════════════════════════════════════════════════════════════

# Request body for sending a chat message
class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)  # User's message; must be 1–2000 chars
    store_id: int  # Which store's chatbot to query


# Response returned after a successful chat interaction
class ChatResponse(BaseModel):
    response: str       # AI-generated reply text
    session_id: int     # ID of the active chat session


# Schema representing a single chat message (for output only)
class MessageOut(BaseModel):
    message_id: int
    sender_type: str    # Either 'user' or 'bot'
    message_text: str
    sent_at: str        # ISO 8601 timestamp string

    class Config:
        from_attributes = True  # Enables reading from SQLAlchemy model instances


# Summary view of a chat session (used in list endpoint)
class SessionOut(BaseModel):
    session_id: int
    store_id: int
    access_level: str   # Role-based level: 'admin', 'staff', or 'public'
    started_at: str
    ended_at: Optional[str]        # None if session is still active
    message_count: int = 0         # Total messages exchanged in this session

    class Config:
        from_attributes = True


# Detailed session view including full message history
class SessionDetailOut(BaseModel):
    session_id: int
    store_id: int
    access_level: str
    started_at: str
    ended_at: Optional[str]
    messages: list[MessageOut]  # All messages in chronological order

    class Config:
        from_attributes = True


# Request body for admin document ingestion
class IngestRequest(BaseModel):
    store_id: int
    ingest_faqs: bool = True        # Whether to ingest FAQ documents
    ingest_policies: bool = True    # Whether to ingest policy documents
    ingest_products: bool = True    # Whether to ingest product catalog


# Request body for triggering a FAISS index rebuild
class RebuildIndexRequest(BaseModel):
    store_id: int


# ══════════════════════════════════════════════════════════════════════════════
# Helper: Determine user's access level for a store
# ══════════════════════════════════════════════════════════════════════════════

def _get_user_access_level(user: User, store_id: int, db: Session) -> str:
    """
    Determine highest role the user has in this store.
    Returns: 'shopkeeper' > 'customer'
    """
    # Query only active, non-revoked role assignments for this user in the given store
    roles = (
        db.query(UserRole)
        .join(UserRole.role)
        .filter(
            UserRole.user_id == user.user_id,
            UserRole.store_id == store_id,
            UserRole.is_active.is_(True),       # Must be currently active
            UserRole.revoked_at.is_(None),       # Must not have been revoked
        )
        .all()
    )
    
    # Import the role enum to compare role names correctly
    from app.models.enums import UserRole as UserRoleEnum
    # Collect all role names the user holds in this store
    role_names = {ur.role.role_name for ur in roles}
    
    # Map roles to DB ENUM: public, staff, admin
    # Priority: admin > cashier (staff) > default public
    if UserRoleEnum.admin in role_names:
        return "admin"
    elif UserRoleEnum.cashier in role_names:
        return "staff"
    else:
        return "public"


# ══════════════════════════════════════════════════════════════════════════════
# Chat Endpoint
# ══════════════════════════════════════════════════════════════════════════════

# POST /chatbot/chat — Main endpoint for sending a message and getting an AI reply
@router.post("/chat", response_model=ChatResponse, summary="Send message to AI chatbot")
async def chat(
    body: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),  # Requires authenticated user
):
    """
    Send a message to the AI chatbot and receive a response.
    
    The chatbot uses RAG (Retrieval-Augmented Generation) to provide context-aware
    answers based on store FAQs, policies, and product information.
    """
    # Resolve the user's permission level for this store (admin/staff/public)
    access_level = _get_user_access_level(current_user, body.store_id, db)
    
    # Instantiate the chatbot service with DB, store context, and access level
    chatbot = ChatbotService(db, body.store_id, access_level)
    
    try:
        # Await the async AI response generation using RAG pipeline
        response = await chatbot.chat(current_user.user_id, body.message)
        
        # Get the session that was just used
        # Fetch the currently active (not ended) session for this user and store
        session = (
            db.query(ChatbotSession)
            .filter(
                ChatbotSession.store_id == body.store_id,
                ChatbotSession.user_id == current_user.user_id,
                ChatbotSession.ended_at.is_(None),  # Only open sessions
            )
            .first()
        )
        
        # Return the AI reply along with the session ID for frontend tracking
        return ChatResponse(response=response, session_id=session.session_id)
    
    except Exception as e:
        import traceback
        # Log the error message and full stack trace for debugging
        logger.error(f"Chat error: {str(e)}")
        logger.error(traceback.format_exc())
        # Return a 500 error to the client with the exception message
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chatbot error: {str(e)}",
        )


# ══════════════════════════════════════════════════════════════════════════════
# Session Management
# ══════════════════════════════════════════════════════════════════════════════

# GET /chatbot/sessions — Returns all sessions for the logged-in user
@router.get("/sessions", response_model=list[SessionOut], summary="List user's chat sessions")
def list_sessions(
    store_id: Optional[int] = None,            # Optional filter by store
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all chat sessions for the current user, optionally filtered by store."""
    # Base query: all sessions belonging to the current user
    query = db.query(ChatbotSession).filter(ChatbotSession.user_id == current_user.user_id)
    
    # Apply optional store filter if store_id is provided
    if store_id:
        query = query.filter(ChatbotSession.store_id == store_id)
    
    # Return sessions sorted newest first
    sessions = query.order_by(ChatbotSession.started_at.desc()).all()
    
    result = []
    for s in sessions:
        # Count total messages for each session separately
        msg_count = (
            db.query(ChatbotMessage)
            .filter(ChatbotMessage.session_id == s.session_id)
            .count()
        )
        result.append(
            SessionOut(
                session_id=s.session_id,
                store_id=s.store_id,
                # Handle both Enum and plain string values for access_level
                access_level=s.access_level.value if hasattr(s.access_level, "value") else s.access_level,
                started_at=s.started_at.isoformat(),
                ended_at=s.ended_at.isoformat() if s.ended_at else None,  # None if session is still open
                message_count=msg_count,
            )
        )
    
    return result


# GET /chatbot/sessions/{session_id} — Returns a single session with all messages
@router.get(
    "/sessions/{session_id}",
    response_model=SessionDetailOut,
    summary="Get session with full message history",
)
def get_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific chat session with all messages."""
    # Fetch the session — must belong to the current user (ownership check)
    session = (
        db.query(ChatbotSession)
        .filter(
            ChatbotSession.session_id == session_id,
            ChatbotSession.user_id == current_user.user_id,
        )
        .first()
    )
    
    # Return 404 if session doesn't exist or belongs to another user
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Fetch all messages in this session, ordered chronologically
    messages = (
        db.query(ChatbotMessage)
        .filter(ChatbotMessage.session_id == session_id)
        .order_by(ChatbotMessage.sent_at)  # Ascending order = oldest first
        .all()
    )
    
    return SessionDetailOut(
        session_id=session.session_id,
        store_id=session.store_id,
        # Safely extract string value from Enum or use as-is
        access_level=session.access_level.value if hasattr(session.access_level, "value") else session.access_level,
        started_at=session.started_at.isoformat(),
        ended_at=session.ended_at.isoformat() if session.ended_at else None,
        # Build list of MessageOut objects from DB records using list comprehension
        messages=[
            MessageOut(
                message_id=m.message_id,
                sender_type=m.sender_type.value if hasattr(m.sender_type, "value") else m.sender_type,
                message_text=m.message_text,
                sent_at=m.sent_at.isoformat(),
            )
            for m in messages
        ],
    )


# POST /chatbot/sessions/{session_id}/end — Closes an active chat session
@router.post("/sessions/{session_id}/end", summary="End a chat session")
def end_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark a chat session as ended."""
    from datetime import datetime, timezone  # Imported here to keep global scope clean
    
    # Verify the session exists and belongs to the current user
    session = (
        db.query(ChatbotSession)
        .filter(
            ChatbotSession.session_id == session_id,
            ChatbotSession.user_id == current_user.user_id,
        )
        .first()
    )
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Stamp the current UTC time as the session end time
    session.ended_at = datetime.now(timezone.utc)
    db.commit()  # Persist the change to the database
    
    return {"message": "Session ended"}


# ══════════════════════════════════════════════════════════════════════════════
# Admin: Document Ingestion
# ══════════════════════════════════════════════════════════════════════════════

# POST /chatbot/admin/ingest — Admin-only: loads knowledge into the RAG vector store
@router.post(
    "/admin/ingest",
    summary="Ingest store documents into RAG knowledge base",
    dependencies=[Depends(require_admin)],  # Route-level admin guard
)
def ingest_documents(
    body: IngestRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),  # Also enforces admin at function level
):
    """
    Admin endpoint to ingest FAQs, policies, and products into the RAG vector store.
    This should be called:
    - After adding/updating FAQs
    - After adding/updating policies
    - After adding new products
    - When setting up a new store
    """
    ingested = []  # Track which data types were ingested for the response message
    
    # Conditionally ingest each document type based on request flags
    if body.ingest_faqs:
        ingest_faqs(db, body.store_id)         # Pull FAQs from DB into vector store
        ingested.append("FAQs")
    
    if body.ingest_policies:
        ingest_policies(db, body.store_id)     # Pull store policies into vector store
        ingested.append("Policies")
    
    if body.ingest_products:
        ingest_products(db, body.store_id)     # Pull product catalog into vector store
        ingested.append("Products")
        
    # Always ingest store stats during an ingest call to keep it fresh
    ingest_store_statistics(db, body.store_id)  # Always refreshed regardless of flags
    ingested.append("Store Stats")
    
    return {
        "message": f"Successfully ingested: {', '.join(ingested)}",  # Summary of what was ingested
        "store_id": body.store_id,
    }


# POST /chatbot/admin/rebuild — Admin-only: rebuilds the FAISS vector index from scratch
@router.post(
    "/admin/rebuild",
    summary="Rebuild FAISS index from scratch",
    dependencies=[Depends(require_admin)],
)
def rebuild_index(
    body: RebuildIndexRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Admin endpoint to rebuild the entire FAISS index from database chunks.
    Use this if:
    - The index becomes corrupted
    - You've manually edited chunks in the database
    - After a database restore
    """
    try:
        # Trigger full FAISS index reconstruction using stored DB chunks
        vector_store.rebuild_index(body.store_id, db)
        return {"message": f"Successfully rebuilt index for store {body.store_id}"}
    except Exception as e:
        # Propagate failure details back to the admin caller
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to rebuild index: {str(e)}",
        )


# ══════════════════════════════════════════════════════════════════════════════
# Admin: View RAG Chunks
# ══════════════════════════════════════════════════════════════════════════════

# GET /chatbot/admin/chunks — Admin-only: inspect stored RAG document chunks
@router.get(
    "/admin/chunks",
    summary="List all RAG chunks for a store",
    dependencies=[Depends(require_admin)],
)
def list_chunks(
    store_id: int,
    source_type: Optional[str] = None,  # Filter by source: 'faq', 'policy', 'product', etc.
    skip: int = 0,                       # Pagination offset
    limit: int = 50,                     # Max chunks to return per request
    db: Session = Depends(get_db),
):
    """Admin endpoint to view all RAG document chunks."""
    from app.models import RAGDocumentChunk  # Local import to avoid circular dependency issues
    
    # Base query: all chunks belonging to the specified store
    query = db.query(RAGDocumentChunk).filter(RAGDocumentChunk.store_id == store_id)
    
    # Optionally narrow results to a specific source type (e.g., 'faq', 'policy')
    if source_type:
        query = query.filter(RAGDocumentChunk.source_type == source_type)
    
    # Apply pagination: skip N records, then return up to `limit` records
    chunks = query.offset(skip).limit(limit).all()
    
    # Return a lightweight list of chunk summaries (truncate long text for readability)
    return [
        {
            "chunk_id": c.chunk_id,
            # Safely convert Enum to its string value if applicable
            "source_type": c.source_type.value if hasattr(c.source_type, "value") else c.source_type,
            "source_id": c.source_id,
            # Truncate chunk text to first 200 chars to keep response compact
            "chunk_text": c.chunk_text[:200] + "..." if len(c.chunk_text) > 200 else c.chunk_text,
            "is_active": c.is_active,
        }
        for c in chunks
    ]
