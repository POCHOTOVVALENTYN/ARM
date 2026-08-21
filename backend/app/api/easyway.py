from fastapi import APIRouter, HTTPException, Query, BackgroundTasks
from typing import Dict, Any, Optional

from app.services.easyway import easyway_service, EWAY_ROUTE_MAPPING

router = APIRouter(prefix="/easyway", tags=["EasyWay Integration"])

@router.get("/routes")
async def get_easyway_routes_mapping():
    """Повертає перелік підключених маршрутів та їх ID в системі EasyWay."""
    return EWAY_ROUTE_MAPPING

@router.get("/route/{route_number}/display")
async def get_easyway_route_display(route_number: str):
    """
    Отримує офіційну геометрію траси, кільця розвороту та зупинки з EasyWay.
    """
    clean_num = route_number.replace("T", "").replace("Tr", "").strip()
    mapping = EWAY_ROUTE_MAPPING.get(clean_num)
    if not mapping:
        raise HTTPException(status_code=404, detail=f"Маршрут №{route_number} не знайдено в мапінгу EasyWay")
    
    data = await easyway_service.get_route_to_display(mapping["id"])
    return data

@router.get("/route/{route_number}/gps")
async def get_easyway_route_gps(route_number: str):
    """
    Отримує живі GPS-координати рухомого складу на маршруті з EasyWay.
    """
    clean_num = route_number.replace("T", "").replace("Tr", "").strip()
    mapping = EWAY_ROUTE_MAPPING.get(clean_num)
    if not mapping:
        raise HTTPException(status_code=404, detail=f"Маршрут №{route_number} не знайдено в мапінгу EasyWay")
    
    vehicles = await easyway_service.get_route_gps(mapping["id"])
    return {
        "route_number": clean_num,
        "eway_id": mapping["id"],
        "count": len(vehicles),
        "vehicles": vehicles
    }

@router.get("/stop/{stop_id}/info")
async def get_easyway_stop_info(stop_id: str):
    """
    Отримує точний час прибуття транспорту на зупинку (API v1.2) з визначенням джерела часу:
    - gps: розраховано на основі реального GPS-руху
    - schedule: за офіційним розкладом
    - interval: за інтервалом руху
    """
    data = await easyway_service.get_stop_info(stop_id)
    return data

@router.post("/sync")
async def sync_easyway_data(background_tasks: BackgroundTasks):
    """
    Запускає синхронізацію високоточних геометрій, кілець розвороту та зупинок EasyWay у PostgreSQL.
    """
    res = await easyway_service.sync_all_routes_to_database()
    return res
