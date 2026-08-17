from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, case
from datetime import date
from typing import List, Optional
from pydantic import BaseModel

from app.api.dependencies import get_db, get_current_dispatcher
from app.models.models import EtaLog, IncidentLog

router = APIRouter(prefix="/analytics", tags=["Analytics & Reporting"])

# --- Схеми відповідей ---
class RoutePerformance(BaseModel):
    route_id: str
    total_records: int
    avg_deviation_min: float
    max_deviation_min: float
    on_time_percentage: float  # Відсоток рейсів з відхиленням від -2 до +2 хв

class IncidentStats(BaseModel):
    total_incidents: int
    resolved_incidents: int
    unresolved_incidents: int

class HourlyDeviation(BaseModel):
    hour: int
    avg_deviation_min: float
    trips_count: int

# --- Ендпоінти ---
@router.get("/daily-performance", response_model=List[RoutePerformance], summary="Оцінка регулярності руху (OTP) за маршрутами")
async def get_daily_performance(
    target_date: Optional[date] = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_dispatcher)
):
    """
    Агрегує дані з eta_logs для кожного маршруту за вказану дату:
    середнє запізнення, максимальне запізнення та регулярність (OTP).
    """
    check_date = target_date or date.today()

    # Підзапит для підрахунку рейсів, що прибули вчасно (відхилення від -2 до +2 хв)
    on_time_case = func.sum(
        case(
            (and_(EtaLog.deviation_min >= -2.0, EtaLog.deviation_min <= 2.0), 1),
            else_=0
        )
    )

    query = (
        select(
            EtaLog.route_id,
            func.count(EtaLog.id).label("total_records"),
            func.avg(EtaLog.deviation_min).label("avg_deviation_min"),
            func.max(EtaLog.deviation_min).label("max_deviation_min"),
            on_time_case.label("on_time_count")
        )
        .where(func.date(EtaLog.recorded_at) == check_date)
        .group_by(EtaLog.route_id)
    )

    result = await db.execute(query)
    rows = result.all()

    performance_data = []
    for row in rows:
        total = row.total_records or 0
        on_time = row.on_time_count or 0
        otp = (on_time / total * 100.0) if total > 0 else 0.0
        
        performance_data.append(
            RoutePerformance(
                route_id=str(row.route_id),
                total_records=total,
                avg_deviation_min=round(float(row.avg_deviation_min or 0.0), 1),
                max_deviation_min=round(float(row.max_deviation_min or 0.0), 1),
                on_time_percentage=round(otp, 1)
            )
        )

    return performance_data

@router.get("/incidents-summary", response_model=IncidentStats, summary="Загальна статистика інцидентів за дату")
async def get_incidents_summary(
    target_date: Optional[date] = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_dispatcher)
):
    """Отримує загальну статистику по інцидентах за день."""
    check_date = target_date or date.today()
    
    query = select(
        func.count(IncidentLog.id).label("total"),
        func.sum(case((IncidentLog.status == 'RESOLVED', 1), else_=0)).label("resolved")
    ).where(func.date(IncidentLog.recorded_at) == check_date)
    
    result = await db.execute(query)
    row = result.one()
    
    total = row.total or 0
    resolved = row.resolved or 0
    
    return IncidentStats(
        total_incidents=total,
        resolved_incidents=resolved,
        unresolved_incidents=total - resolved
    )
