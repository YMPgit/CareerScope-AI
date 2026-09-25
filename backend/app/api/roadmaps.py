from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db
from app.models.roadmap_item import RoadmapItem
from app.models.user import User
from app.services import analysis_service

router = APIRouter()


@router.get("/{analysis_id}")
def get_roadmap(analysis_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    analysis = analysis_service.get_owned_analysis(db, analysis_id, current_user.id)
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    roadmap = analysis_service.roadmap_payload(db, analysis)
    if not roadmap:
        raise HTTPException(status_code=404, detail="No roadmap yet for this analysis.")
    return roadmap


@router.put("/{analysis_id}/items/{item_id}")
def update_roadmap_item(
    analysis_id: int,
    item_id: int,
    body: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    analysis = analysis_service.get_owned_analysis(db, analysis_id, current_user.id)
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")

    item = db.query(RoadmapItem).filter(RoadmapItem.id == item_id).first()
    if not item or not item.roadmap or item.roadmap.analysis_id != analysis.id:
        raise HTTPException(status_code=404, detail="Roadmap item not found")

    new_status = (body.get("status") or "").strip()
    if new_status not in ("pending", "in_progress", "completed"):
        raise HTTPException(status_code=400, detail="Invalid status.")
    item.status = new_status
    db.commit()
    return {"id": item.id, "status": item.status}