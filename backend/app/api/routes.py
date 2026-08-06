from fastapi import APIRouter
from app.models.schemas import RecalculationRequest
from app.services.transit_solver import TransitSolver

router = APIRouter()

@router.post("/recalculate")
async def recalculate_schedule(request: RecalculationRequest):
    solver = TransitSolver()
    
    # Виконуємо каскадний перерахунок графіка
    result = solver.recalculate_cascade(
        incident=request.incident,
        blocks=request.current_blocks,
        safety_headway=request.safety_headway
    )
    
    return result
