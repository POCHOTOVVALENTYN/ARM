# backend/app/api/blocks.py
from fastapi import APIRouter, HTTPException
from app.models.schemas import VehicleBlock, Trip

router = APIRouter(prefix="/blocks", tags=["Blocks & Waybills"])

@router.get("/{vehicle_id}/today", response_model=VehicleBlock)
async def get_vehicle_block_today(vehicle_id: str):
    """
    Повертає розклад (VehicleBlock) для заданого бортового номера на сьогодні.
    Наразі це заглушка для Smart Waybill (Електронної путівки).
    """
    
    # Згенеруємо кілька фейкових рейсів для демонстрації
    # start_time / end_time тут у хвилинах від початку доби.
    # 480 = 08:00, 540 = 09:00
    mock_trips = [
        Trip(
            id=f"trip_1_{vehicle_id}",
            route_id="10",
            start_time=480,  # 08:00
            end_time=530,    # 08:50
            start_station_id="st_starosinna",
            end_station_id="st_tiraspolska"
        ),
        Trip(
            id=f"trip_2_{vehicle_id}",
            route_id="10",
            start_time=540,  # 09:00
            end_time=590,    # 09:50
            start_station_id="st_tiraspolska",
            end_station_id="st_starosinna"
        ),
        Trip(
            id=f"trip_3_{vehicle_id}",
            route_id="10",
            start_time=600,  # 10:00
            end_time=650,    # 10:50
            start_station_id="st_starosinna",
            end_station_id="st_tiraspolska"
        )
    ]
    
    mock_block = VehicleBlock(
        block_id=f"block_{vehicle_id}_today",
        vehicle_type="TRAM" if "tram" in vehicle_id.lower() or vehicle_id.startswith("3") else "TROLLEYBUS",
        trips=mock_trips
    )
    
    return mock_block
