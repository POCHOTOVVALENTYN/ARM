# backend/app/api/deadhead.py
"""
API ендпоінти для Оптимізатора нульових рейсів (Deadhead & Pull-Out Optimizer)
КП «Одесміськелектротранс».
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any, Optional
from pydantic import BaseModel

from app.api.dependencies import get_db, get_current_dispatcher
from app.services.deadhead_optimizer import DeadheadOptimizer, get_deadhead_between
from app.api.websocket import ws_manager

router = APIRouter(prefix="/deadhead", tags=["Deadhead & Pull-Out Optimizer"])

class DeadheadCalculateRequest(BaseModel):
    depot_id: str
    terminal_name: str
    transport_type: Optional[str] = "TRAM"

class DeadheadOptimizeRequest(BaseModel):
    apply_to_db: Optional[bool] = False
    custom_electricity_tariff: Optional[float] = None

@router.get("/matrix")
async def get_deadhead_matrix():
    """
    Отримання повної топологічної матриці нульових рейсів (відстані, тривалості, вузли)
    між 3 депо Одеси та всіма кінцевими пунктами.
    """
    return DeadheadOptimizer.get_full_matrix()

@router.get("/network")
async def get_network_evaluation(db: AsyncSession = Depends(get_db)):
    """
    Оцінка поточної мережі маршрутів: поточні депо vs оптимальні депо,
    добові втрати та потенційна економія (км, години водіїв, кВт·год, грн).
    """
    return await DeadheadOptimizer.evaluate_network(db)

@router.post("/calculate")
async def calculate_custom_run(req: DeadheadCalculateRequest):
    """
    Калькулятор одиничного нульового рейсу між будь-яким депо та кінцевою зупинкою.
    """
    result = get_deadhead_between(req.depot_id, req.terminal_name, req.transport_type)
    return result

@router.post("/optimize")
async def optimize_network(
    req: DeadheadOptimizeRequest = DeadheadOptimizeRequest(),
    db: AsyncSession = Depends(get_db)
):
    """
    Запуск математичної глобальної оптимізації закріплення маршрутів за депо.
    Якщо apply_to_db=True, автоматично зберігає нові параметри в БД.
    """
    if req.apply_to_db:
        apply_res = await DeadheadOptimizer.apply_optimal_assignments(db)
        await ws_manager.broadcast({
            "type": "DEADHEAD_OPTIMIZATION_APPLIED",
            "data": apply_res
        })
        return apply_res

    eval_res = await DeadheadOptimizer.evaluate_network(db)
    return eval_res

@router.post("/apply")
async def apply_optimal_assignments(
    db: AsyncSession = Depends(get_db)
):
    """
    Застосування оптимальних призначень депо та нормативних тривалостей виїздів/заїздів.
    Оновлює таблиці `routes` та `route_depot_configs`.
    """
    apply_res = await DeadheadOptimizer.apply_optimal_assignments(db)
    await ws_manager.broadcast({
        "type": "DEADHEAD_OPTIMIZATION_APPLIED",
        "data": {
            "applied_count": apply_res["applied_count"],
            "savings": apply_res["savings_summary"]
        }
    })
    return apply_res
