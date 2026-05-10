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

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.deps import get_current_user, require_admin
from app.models import ChatbotMessage, ChatbotSession, User, UserRole
from app.services.chatbot import (
    ChatbotService,
    ingest_faqs,
    ingest_policies,
    ingest_products,
    ingest_store_statistics,
    vector_store,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chatbot", tags=["Chatbot"])


# ══════════════════════════════════════════════════════════════════════════════
# Schemas
# ══════════════════════════════════════════════════════════════════════════════

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    store_id: int


class ChatResponse(BaseModel):
    response: str
    session_id: int


class MessageOut(BaseModel):
    message_id: int
    sender_type: str
    message_text: str
    sent_at: str

    class Config:
        from_attributes = True


class SessionOut(BaseModel):
    session_id: int
    store_id: int
    access_level: str
    started_at: str
    ended_at: Optional[str]
    message_count: int = 0

    class Config:
        from_attributes = True


class SessionDetailOut(BaseModel):
    session_id: int
    store_id: int
    access_level: str
    started_at: str
    ended_at: Optional[str]
    messages: list[MessageOut]

    class Config:
        from_attributes = True


class IngestRequest(BaseModel):
    store_id: int
    ingest_faqs: bool = True
    ingest_policies: bool = True
    ingest_products: bool = True


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
    # Get user's active roles in this store
    roles = (
        db.query(UserRole)
        .join(UserRole.role)
        .filter(
            UserRole.user_id == user.user_id,
            UserRole.store_id == store_id,
            UserRole.is_active.is_(True),
            UserRole.revoked_at.is_(None),
        )
        .all()
    )
    
    from app.models.enums import UserRole as UserRoleEnum
    role_names = {ur.role.role_name for ur in roles}
    
    # Map roles to DB ENUM: public, staff, admin
    if UserRoleEnum.admin in role_names:
        return "admin"
    elif UserRoleEnum.cashier in role_names:
        return "staff"
    else:
        return "public"


# ══════════════════════════════════════════════════════════════════════════════
# Chat Endpoint
# ══════════════════════════════════════════════════════════════════════════════

@router.post("/chat", response_model=ChatResponse, summary="Send message to AI chatbot")
async def chat(
    body: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Send a message to the AI chatbot and receive a response.
    
    The chatbot uses RAG (Retrieval-Augmented Generation) to provide context-aware
    answers based on store FAQs, policies, and product information.
    """
    access_level = _get_user_access_level(current_user, body.store_id, db)
    
    chatbot = ChatbotService(db, body.store_id, access_level)
    
    try:
        response = await chatbot.chat(current_user.user_id, body.message)
        
        # Get the session that was just used
        session = (
            db.query(ChatbotSession)
            .filter(
                ChatbotSession.store_id == body.store_id,
                ChatbotSession.user_id == current_user.user_id,
                ChatbotSession.ended_at.is_(None),
            )
            .first()
        )
        
        return ChatResponse(response=response, session_id=session.session_id)
    
    except Exception as e:
        import traceback
        logger.error(f"Chat error: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chatbot error: {str(e)}",
        )


# ══════════════════════════════════════════════════════════════════════════════
# Session Management
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/sessions", response_model=list[SessionOut], summary="List user's chat sessions")
def list_sessions(
    store_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all chat sessions for the current user, optionally filtered by store."""
    query = db.query(ChatbotSession).filter(ChatbotSession.user_id == current_user.user_id)
    
    if store_id:
        query = query.filter(ChatbotSession.store_id == store_id)
    
    sessions = query.order_by(ChatbotSession.started_at.desc()).all()
    
    result = []
    for s in sessions:
        msg_count = (
            db.query(ChatbotMessage)
            .filter(ChatbotMessage.session_id == s.session_id)
            .count()
        )
        result.append(
            SessionOut(
                session_id=s.session_id,
                store_id=s.store_id,
                access_level=s.access_level.value if hasattr(s.access_level, "value") else s.access_level,
                started_at=s.started_at.isoformat(),
                ended_at=s.ended_at.isoformat() if s.ended_at else None,
                message_count=msg_count,
            )
        )
    
    return result


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
    
    messages = (
        db.query(ChatbotMessage)
        .filter(ChatbotMessage.session_id == session_id)
        .order_by(ChatbotMessage.sent_at)
        .all()
    )
    
    return SessionDetailOut(
        session_id=session.session_id,
        store_id=session.store_id,
        access_level=session.access_level.value if hasattr(session.access_level, "value") else session.access_level,
        started_at=session.started_at.isoformat(),
        ended_at=session.ended_at.isoformat() if session.ended_at else None,
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


@router.post("/sessions/{session_id}/end", summary="End a chat session")
def end_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark a chat session as ended."""
    from datetime import datetime, timezone
    
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
    
    session.ended_at = datetime.now(timezone.utc)
    db.commit()
    
    return {"message": "Session ended"}


# ══════════════════════════════════════════════════════════════════════════════
# Admin: Document Ingestion
# ══════════════════════════════════════════════════════════════════════════════

@router.post(
    "/admin/ingest",
    summary="Ingest store documents into RAG knowledge base",
    dependencies=[Depends(require_admin)],
)
def ingest_documents(
    body: IngestRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Admin endpoint to ingest FAQs, policies, and products into the RAG vector store.
    This should be called:
    - After adding/updating FAQs
    - After adding/updating policies
    - After adding new products
    - When setting up a new store
    """
    ingested = []
    
    if body.ingest_faqs:
        ingest_faqs(db, body.store_id)
        ingested.append("FAQs")
    
    if body.ingest_policies:
        ingest_policies(db, body.store_id)
        ingested.append("Policies")
    
    if body.ingest_products:
        ingest_products(db, body.store_id)
        ingested.append("Products")
        
    # Always ingest store stats during an ingest call to keep it fresh
    ingest_store_statistics(db, body.store_id)
    ingested.append("Store Stats")
    
    return {
        "message": f"Successfully ingested: {', '.join(ingested)}",
        "store_id": body.store_id,
    }


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
        vector_store.rebuild_index(body.store_id, db)
        return {"message": f"Successfully rebuilt index for store {body.store_id}"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to rebuild index: {str(e)}",
        )


# ══════════════════════════════════════════════════════════════════════════════
# Admin: View RAG Chunks
# ══════════════════════════════════════════════════════════════════════════════

@router.get(
    "/admin/chunks",
    summary="List all RAG chunks for a store",
    dependencies=[Depends(require_admin)],
)
def list_chunks(
    store_id: int,
    source_type: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    """Admin endpoint to view all RAG document chunks."""
    from app.models import RAGDocumentChunk
    
    query = db.query(RAGDocumentChunk).filter(RAGDocumentChunk.store_id == store_id)
    
    if source_type:
        query = query.filter(RAGDocumentChunk.source_type == source_type)
    
    chunks = query.offset(skip).limit(limit).all()
    
    return [
        {
            "chunk_id": c.chunk_id,
            "source_type": c.source_type.value if hasattr(c.source_type, "value") else c.source_type,
            "source_id": c.source_id,
            "chunk_text": c.chunk_text[:200] + "..." if len(c.chunk_text) > 200 else c.chunk_text,
            "is_active": c.is_active,
        }
        for c in chunks
    ]
