from fastapi import APIRouter, HTTPException, Query
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from app.services.transit_solver import transit_solver

router = APIRouter()

class DelayCascadeRequest(BaseModel):
    block_id: str
    start_time: int  # minutes from midnight
    delay_minutes: int
    schedule_data: List[Dict[str, Any]]
    ambient_temp_c: Optional[float] = 20.0

class DutyValidationRequest(BaseModel):
    duty_id: str
    transport_type: str = "tram"
    shift_start_min: int
    shift_end_min: int
    driving_min: int
    actual_lunch_min: int
    lunch_start_min: Optional[int] = None
    lunch_location_name: Optional[str] = None

class ElectrobusBatteryRequest(BaseModel):
    block_id: str
    route_length_km: float = 12.4
    idle_minutes_at_terminal: float = 15.0
    current_soc_pct: float = 95.0
    battery_capacity_kwh: float = 200.0
    ambient_temp_c: float = 20.0

@router.post("/apply-delay")
async def apply_delay(request: DelayCascadeRequest):
    """
    Каскадне застосування відтяжки/затримки до рейсів вагона.
    """
    try:
        updated_schedule, warnings = transit_solver.apply_delay_cascade(
            schedule_data=request.schedule_data,
            block_id=request.block_id,
            start_time_min=request.start_time,
            delay_min=request.delay_minutes,
            ambient_temp_c=request.ambient_temp_c or 20.0
        )
        return {
            "status": "SUCCESS",
            "updated_schedule": updated_schedule,
            "warnings": warnings
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/validate-duty")
async def validate_duty(request: DutyValidationRequest):
    """
    Валідація зміни водія відповідно до норм КЗпП та стандарту обідів КП «ОМЕТ».
    """
    result = transit_solver.validate_driver_duty(
        duty_id=request.duty_id,
        transport_type=request.transport_type,
        shift_start_min=request.shift_start_min,
        shift_end_min=request.shift_end_min,
        driving_min=request.driving_min,
        actual_lunch_min=request.actual_lunch_min,
        lunch_start_min=request.lunch_start_min,
        lunch_location_name=request.lunch_location_name
    )
    return result

@router.post("/validate-electrobus")
async def validate_electrobus(request: ElectrobusBatteryRequest):
    """
    Валідація розряду батареї та часу зарядки електробуса.
    """
    result = transit_solver.calculate_electrobus_battery(
        block_id=request.block_id,
        route_length_km=request.route_length_km,
        idle_minutes_at_terminal=request.idle_minutes_at_terminal,
        current_soc_pct=request.current_soc_pct,
        battery_capacity_kwh=request.battery_capacity_kwh,
        ambient_temp_c=request.ambient_temp_c
    )
    return result
