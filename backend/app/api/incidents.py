from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
import time
import uuid

from app.services.incident_ai import incident_ai_service
from app.api.websocket import manager as ws_manager

router = APIRouter()

# Тимчасове сховище in-memory (замінити на БД в production)
active_incidents = {}

class IncidentReport(BaseModel):
    vehicle_id: str
    description: str
    lat: float = None
    lon: float = None

@router.post("/report")
async def report_incident(report: IncidentReport, background_tasks: BackgroundTasks):
    incident_id = str(uuid.uuid4())
    current_time = time.time()
    
    # 1. Створюємо базовий запис, щоб не блокувати UI
    active_incidents[incident_id] = {
        "id": incident_id,
        "vehicle_id": report.vehicle_id,
        "description": report.description,
        "status": "ANALYZING",
        "timestamp": current_time,
        "location": {"lat": report.lat, "lon": report.lon}
    }
    
    # Сповіщаємо клієнтів про новий інцидент (статус ANALYZING)
    await ws_manager.broadcast({
        "type": "INCIDENT_UPDATE",
        "payload": active_incidents
    })

    # 2. Делегуємо виклик нейромережі у фонову задачу
    background_tasks.add_task(process_incident_ai, incident_id, report.description)
    
    return {"status": "accepted", "incident_id": incident_id}

async def process_incident_ai(incident_id: str, description: str):
    try:
        # Отримуємо структуровані дані від AI
        ai_data = await incident_ai_service.analyze_incident(description)
        
        # Оновлюємо інцидент
        if incident_id in active_incidents:
            active_incidents[incident_id].update({
                "status": "ACTIVE",
                "category": ai_data.get("category"),
                "severity": ai_data.get("severity"),
                "estimated_delay": ai_data.get("estimated_delay_minutes"),
                "action": ai_data.get("recommended_action")
            })
            
            # Сповіщаємо диспетчерів про результати аналізу
            await ws_manager.broadcast({
                "type": "INCIDENT_UPDATE",
                "payload": active_incidents
            })
    except Exception as e:
        print(f"Помилка аналізу інциденту: {e}")
        # Переводимо в ручний режим у разі збою AI
        if incident_id in active_incidents:
            active_incidents[incident_id]["status"] = "MANUAL_REVIEW"
            await ws_manager.broadcast({
                "type": "INCIDENT_UPDATE",
                "payload": active_incidents
            })
