from typing import List, Optional
from fastapi import APIRouter, Query

from schemas import Decision
from services.memory import list_decisions

router = APIRouter(prefix="/decisions", tags=["Decisions"])

@router.get("", response_model=List[Decision])
async def get_decisions(
    status: Optional[str] = Query(None, description="Filter by status: active | superseded | conflicted"),
    q: Optional[str] = Query(None, description="Semantic search query across decisions")
):
    """
    Search and retrieve the persistent cross-meeting decision memory log.
    Supports filtering by status and semantic similarity query.
    """
    records = list_decisions(status=status, query=q)
    return [
        Decision(
            id=r["id"],
            meeting_id=r["meeting_id"],
            text=r["text"],
            owner=r.get("owner"),
            date=r.get("date"),
            status=r.get("status", "active"),
            source_line=r.get("source_line"),
            chroma_id=r.get("chroma_id"),
            created_at=r.get("created_at")
        )
        for r in records
    ]
