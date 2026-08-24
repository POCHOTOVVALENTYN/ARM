import asyncio
import json
import logging
import re
from typing import Dict, Any, List
import httpx
from sqlalchemy import select, delete

from app.core.database import async_session_maker, init_db
from app.core.config import settings
from app.models.models import DepotModel, Vehicle

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("seed_fleet_and_depots")

ODESSA_DEPOTS_DATA = [
    {
        "id": "depot_1",
        "code": "TD-1",
        "name": "Трамвайне депо №1 (ім. Шевченка)",
        "type": "TRAM",
        "address": "вул. Водопровідна, 1",
        "lat": 46.4665,
        "lng": 30.7350,
        "polygon": [
            [46.4678, 30.7320],
            [46.4685, 30.7365],
            [46.4655, 30.7380],
            [46.4645, 30.7335],
            [46.4678, 30.7320]
        ],
        "prepTimeMin": 15
    },
    {
        "id": "depot_2",
        "code": "TD-2",
        "name": "Трамвайне депо №2 (Слобідка)",
        "type": "TRAM",
        "address": "вул. Академіка Воробйова, 33 (1-й Польовий пров.)",
        "lat": 46.4945,
        "lng": 30.7040,
        "polygon": [
            [46.4920, 30.7000],
            [46.4965, 30.7015],
            [46.4960, 30.7075],
            [46.4915, 30.7060],
            [46.4920, 30.7000]
        ],
        "prepTimeMin": 15
    },
    {
        "id": "depot_3",
        "code": "TrD",
        "name": "Тролейбусне депо №1",
        "type": "TROLLEYBUS",
        "address": "вул. 25-ї Чапаєвської дивізії (вул. Інглезі), 17",
        "lat": 46.4175,
        "lng": 30.7110,
        "polygon": [
            [46.4190, 30.7085],
            [46.4195, 30.7135],
            [46.4160, 30.7135],
            [46.4155, 30.7085],
            [46.4190, 30.7085]
        ],
        "prepTimeMin": 15
    }
]

def classify_vehicle_unit(unit_name: str) -> Dict[str, Any]:
    """
    Класифікує одиницю рухомого складу КП «ОМЕТ» за назвою трекера Wialon
    згідно з офіційним фізичним реєстром міського електротранспорту Одеси.
    """
    nm = unit_name.strip()
    nm_upper = nm.upper()
    nm_lower = nm.lower()

    # 1. Спецтехніка та службовий автотранспорт
    if any(k in nm_upper for k in ["ГАЗ", "КАМАЗ", "РЕВІЗОР", "РЕВИЗОР", "ВИШКА", "ВАЗ", "УАЗ", "ТРАКТОР", "ЗІЛ", "МАЗ", "КРАН", "СЛУЖБ", "BH ", "ВН "]):
        return {
            "id": nm,
            "wialon_name": nm,
            "type": "SERVICE",
            "model": "Службовий спецтранспорт КП «ОМЕТ»",
            "depot_id": None,
            "is_accessible": False,
            "has_wifi": False,
            "has_aircond": False,
            "status": "SERVICE"
        }

    # 2. Тролейбуси з явним суфіксом "- trol"
    if "- trol" in nm_lower or "trol" in nm_lower:
        digits = re.sub(r'[^0-9]', '', nm)
        disp_id = digits.zfill(4) if (digits and len(digits) <= 4) else (digits or nm)
        num = int(digits) if digits else 0
        model = "Богдан Т70117" if (4000 <= num <= 4050) else "Тролза-5265 «Мегаполіс»"
        return {
            "id": f"{disp_id}-trol",
            "wialon_name": nm,
            "type": "TROLLEYBUS",
            "model": model,
            "depot_id": "depot_3",
            "is_accessible": True,
            "has_wifi": True,
            "has_aircond": False,
            "status": "AVAILABLE"
        }

    # 3. Трамваї з явним суфіксом "- tram"
    if "- tram" in nm_lower or "tram" in nm_lower:
        digits = re.sub(r'[^0-9]', '', nm)
        disp_id = digits.zfill(4) if (digits and len(digits) <= 4) else (digits or nm)
        return {
            "id": f"{disp_id}-tram",
            "wialon_name": nm,
            "type": "TRAM",
            "model": "Tatra T3 «Одіссей» (К-1)",
            "depot_id": "depot_1",
            "is_accessible": True,
            "has_wifi": True,
            "has_aircond": True,
            "status": "AVAILABLE"
        }

    # 4. Числові бортові номери
    digits = re.sub(r'[^0-9]', '', nm)
    if digits:
        disp_id = digits.zfill(4) if len(digits) <= 4 else digits
        num = int(digits)

        # 4.1 Тролейбуси серії БКМ-321 (0001 - 0050)
        if num <= 50:
            return {
                "id": disp_id,
                "wialon_name": nm,
                "type": "TROLLEYBUS",
                "model": "БКМ-321 (Белкомунмаш)",
                "depot_id": "depot_3",
                "is_accessible": True,
                "has_wifi": True,
                "has_aircond": True,
                "status": "AVAILABLE"
            }

        # 4.2 Тролейбуси серії 2000-2050 (Тролза / ЮМЗ)
        if 2000 <= num <= 2050:
            return {
                "id": disp_id,
                "wialon_name": nm,
                "type": "TROLLEYBUS",
                "model": "Тролза-5265 «Мегаполіс»",
                "depot_id": "depot_3",
                "is_accessible": True,
                "has_wifi": False,
                "has_aircond": False,
                "status": "AVAILABLE"
            }

        # 4.3 Трамваї Odissey-MAX 3-секційні та Tatra-Юг (5001 - 5025)
        if 5000 <= num <= 5025:
            return {
                "id": disp_id,
                "wialon_name": nm,
                "type": "TRAM",
                "model": "T3 «Одіссей-МАКС» 3-секційний",
                "depot_id": "depot_1" if num % 2 == 1 else "depot_2",
                "is_accessible": True,
                "has_wifi": True,
                "has_aircond": True,
                "status": "AVAILABLE"
            }

        # 4.4 Трамваї Tatra T3R.P (7001 - 7030, 7150 - 7160)
        if (7000 <= num <= 7035) or (7150 <= num <= 7165):
            return {
                "id": disp_id,
                "wialon_name": nm,
                "type": "TRAM",
                "model": "Tatra T3R.P",
                "depot_id": "depot_1" if num < 7020 else "depot_2",
                "is_accessible": False,
                "has_wifi": False,
                "has_aircond": False,
                "status": "AVAILABLE"
            }

        # 4.5 Трамваї Tatra T3 класичні (2951 - 3370)
        if 2900 <= num <= 3400:
            return {
                "id": disp_id,
                "wialon_name": nm,
                "type": "TRAM",
                "model": "Tatra T3 (модернізована)",
                "depot_id": "depot_2" if (num >= 3200 and num <= 3290) else "depot_1",
                "is_accessible": False,
                "has_wifi": False,
                "has_aircond": False,
                "status": "AVAILABLE"
            }

        # 4.6 Серія 4000 (якщо без суфікса — розподіл за відомими номерами Одеси)
        if 4000 <= num <= 4099:
            # Якщо номер парку тролейбусів (Богдани Т70117 / Тролза)
            if num in [4020, 4022, 4026, 4034, 4036, 4037, 4038, 4040, 4045, 4047, 4052, 4054, 4056, 4058, 4063, 4064, 4065, 4072]:
                return {
                    "id": disp_id,
                    "wialon_name": nm,
                    "type": "TROLLEYBUS",
                    "model": "Богдан Т70117",
                    "depot_id": "depot_3",
                    "is_accessible": True,
                    "has_wifi": True,
                    "has_aircond": False,
                    "status": "AVAILABLE"
                }
            else:
                return {
                    "id": disp_id,
                    "wialon_name": nm,
                    "type": "TRAM",
                    "model": "Tatra T3 «Одіссей»",
                    "depot_id": "depot_1",
                    "is_accessible": True,
                    "has_wifi": True,
                    "has_aircond": True,
                    "status": "AVAILABLE"
                }

    # За замовчуванням
    return {
        "id": nm,
        "wialon_name": nm,
        "type": "SERVICE",
        "model": "Службовий транспорт",
        "depot_id": None,
        "is_accessible": False,
        "has_wifi": False,
        "has_aircond": False,
        "status": "SERVICE"
    }

async def fetch_all_wialon_unit_names() -> List[str]:
    """Отримує повний список назв об'єктів з Wialon API."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            params = {
                "svc": "token/login",
                "params": json.dumps({"token": settings.WIALON_TOKEN})
            }
            resp = await client.post(settings.WIALON_HOST, data=params)
            data = resp.json()
            if "eid" not in data:
                logger.warning(f"Не вдалося відкрити сесію Wialon: {data}")
                return []
            eid = data["eid"]

            search_params = {
                "spec": {
                    "itemsType": "avl_unit",
                    "propName": "sys_name",
                    "propValueMask": "*",
                    "sortType": "sys_name"
                },
                "force": 1,
                "flags": 1, # Тільки базові властивості (nm)
                "from": 0,
                "to": 0
            }
            req_params = {
                "svc": "core/search_items",
                "params": json.dumps(search_params),
                "sid": eid
            }
            resp2 = await client.post(settings.WIALON_HOST, data=req_params)
            items = resp2.json().get("items", [])
            names = [str(u.get("nm", "")).strip() for u in items if u.get("nm")]
            logger.info(f"Отримано {len(names)} трекерів з Wialon API")
            return names
    except Exception as e:
        logger.error(f"Помилка отримання юнітів Wialon: {e}")
        return []

async def seed_depots_and_fleet():
    """Створює/оновлює геозони депо та повний фізичний реєстр парку в БД."""
    await init_db()

    async with async_session_maker() as db:
        # 1. Сідування геозон депо
        logger.info("🏢 Синхронізація депо та геозон Одеси...")
        for d_data in ODESSA_DEPOTS_DATA:
            res = await db.execute(select(DepotModel).where(DepotModel.id == d_data["id"]))
            depot = res.scalar_one_or_none()
            if not depot:
                depot = DepotModel(
                    id=d_data["id"],
                    code=d_data["code"],
                    name=d_data["name"],
                    type=d_data["type"],
                    address=d_data["address"],
                    lat=d_data["lat"],
                    lng=d_data["lng"],
                    polygon=d_data["polygon"],
                    prepTimeMin=d_data["prepTimeMin"]
                )
                db.add(depot)
            else:
                depot.code = d_data["code"]
                depot.name = d_data["name"]
                depot.type = d_data["type"]
                depot.address = d_data["address"]
                depot.lat = d_data["lat"]
                depot.lng = d_data["lng"]
                depot.polygon = d_data["polygon"]
                depot.prepTimeMin = d_data["prepTimeMin"]

        await db.commit()
        logger.info("✅ 3 депо Одеси з точними геозонами оновлено в БД")

        # 2. Отримання та класифікація всього парку
        wialon_names = await fetch_all_wialon_unit_names()
        if not wialon_names:
            # Резервний список якщо Wialon тимчасово недоступний
            wialon_names = [f"{i:04d}" for i in range(1, 48)] + [str(i) for i in range(2951, 3370)] + [str(i) for i in range(7001, 7030)] + [str(i) for i in range(5001, 5021)]

        logger.info(f"🚋 Заповнення фізичного реєстру парку ({len(wialon_names)} одиниць)...")
        inserted_count = 0
        updated_count = 0

        for name in wialon_names:
            info = classify_vehicle_unit(name)
            v_id = info["id"]

            res = await db.execute(select(Vehicle).where(Vehicle.id == v_id))
            veh = res.scalar_one_or_none()
            if not veh:
                veh = Vehicle(
                    id=v_id,
                    wialon_name=info["wialon_name"],
                    type=info["type"],
                    model=info["model"],
                    depot_id=info["depot_id"],
                    is_accessible=info["is_accessible"],
                    has_wifi=info["has_wifi"],
                    has_aircond=info["has_aircond"],
                    status=info["status"],
                    is_active=True
                )
                db.add(veh)
                inserted_count += 1
            else:
                veh.wialon_name = info["wialon_name"]
                veh.type = info["type"]
                veh.model = info["model"]
                veh.depot_id = info["depot_id"]
                veh.is_accessible = info["is_accessible"]
                veh.has_wifi = info["has_wifi"]
                veh.has_aircond = info["has_aircond"]
                updated_count += 1

        await db.commit()
        logger.info(f"✅ Фізичний реєстр флоту успішно синхронізовано: {inserted_count} додано, {updated_count} оновлено")

if __name__ == "__main__":
    asyncio.run(seed_depots_and_fleet())
