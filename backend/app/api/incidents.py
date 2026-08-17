from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends, Query, status
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import time
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.models import IncidentLog
from app.api.dependencies import get_db, get_current_dispatcher
from app.services.incident_ai import incident_ai_service
from app.api.websocket import manager as ws_manager
from app.models.schemas import HotReserveActivationRequest, HotReserveActivationResponse
from app.services.hot_reserve_manager import activate_hot_reserve_tx

router = APIRouter(prefix="/incidents", tags=["Incidents & Reserves"])

# Тимчасове сховище in-memory (для швидкої телеметрії)
active_incidents = {}

class IncidentReport(BaseModel):
    vehicle_id: str
    description: str
    lat: Optional[float] = None
    lon: Optional[float] = None

class IncidentResponse(BaseModel):
    id: int
    vehicle_id: Optional[str] = None
    route_id: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = "NEW"
    source: Optional[str] = "SYSTEM"
    recorded_at: Optional[datetime] = None
    resolution_notes: Optional[str] = None

    class Config:
        from_attributes = True

@router.get("/active", response_model=List[IncidentResponse], summary="Отримання активних інцидентів")
async def get_active_incidents(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_dispatcher)
):
    """Повертає всі інциденти, які ще не вирішені."""
    query = select(IncidentLog).where(IncidentLog.status != "RESOLVED").order_by(IncidentLog.id.desc())
    result = await db.execute(query)
    incidents = result.scalars().all()
    
    for inc in incidents:
        if inc.recorded_at is None:
            inc.recorded_at = inc.timestamp or datetime.utcnow()
            
    return incidents

class ResolveRequest(BaseModel):
    notes: Optional[str] = None

@router.put("/{incident_id}/resolve", summary="Закриття інциденту")
@router.post("/{incident_id}/resolve", summary="Закриття інциденту (POST)")
async def resolve_incident(
    incident_id: int, 
    notes: Optional[str] = Query(default=None),
    body: Optional[ResolveRequest] = None,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_dispatcher)
):
    """Переводить інцидент у статус RESOLVED та зберігає коментар диспетчера."""
    result = await db.execute(select(IncidentLog).where(IncidentLog.id == incident_id))
    incident = result.scalar_one_or_none()
    
    if not incident:
        raise HTTPException(status_code=404, detail="Інцидент не знайдено")
        
    if incident.status == "RESOLVED":
        raise HTTPException(status_code=400, detail="Інцидент вже закрито")

    # Отримуємо коментар з body або query
    resolution_text = (body.notes if body and body.notes else notes) or "Вирішено диспетчером"

    # Оновлюємо статус
    incident.status = "RESOLVED"
    incident.resolution_notes = resolution_text
    
    await db.commit()
    
    # Сповіщаємо інших диспетчерів через WebSocket, що інцидент закрито
    await ws_manager.broadcast({
        "type": "incident_resolved",
        "data": {"id": incident_id, "notes": incident.resolution_notes}
    })
    
    return {"message": "Інцидент успішно закрито", "id": incident_id}

@router.post("/report")
async def report_incident(report: IncidentReport, background_tasks: BackgroundTasks):
    incident_id = str(uuid.uuid4())
    current_time = time.time()
    
    active_incidents[incident_id] = {
        "id": incident_id,
        "vehicle_id": report.vehicle_id,
        "description": report.description,
        "status": "ANALYZING",
        "timestamp": current_time,
        "location": {"lat": report.lat, "lon": report.lon}
    }
    
    await ws_manager.broadcast({
        "type": "INCIDENT_UPDATE",
        "payload": active_incidents
    })

    background_tasks.add_task(process_incident_ai, incident_id, report.description)
    
    return {"status": "accepted", "incident_id": incident_id}

async def process_incident_ai(incident_id: str, description: str):
    try:
        ai_data = await incident_ai_service.analyze_incident(description)
        if incident_id in active_incidents:
            active_incidents[incident_id].update({
                "status": "ACTIVE",
                "category": ai_data.get("category"),
                "severity": ai_data.get("severity"),
                "estimated_delay": ai_data.get("estimated_delay_minutes"),
                "action": ai_data.get("recommended_action")
            })
            
            await ws_manager.broadcast({
                "type": "INCIDENT_UPDATE",
                "payload": active_incidents
            })
    except Exception as e:
        print(f"Помилка аналізу інциденту: {e}")
        if incident_id in active_incidents:
            active_incidents[incident_id]["status"] = "MANUAL_REVIEW"
            await ws_manager.broadcast({
                "type": "INCIDENT_UPDATE",
                "payload": active_incidents
            })

@router.post("/hot-reserve/activate", response_model=HotReserveActivationResponse)
async def activate_hot_reserve(
    payload: HotReserveActivationRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Ендпоінт для швидкої заміни рухомого складу на маршруті з гарячого резерву депо.
    """
    return await activate_hot_reserve_tx(db, payload)
