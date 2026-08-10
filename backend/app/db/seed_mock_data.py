import asyncio
import os
import sys

# Add backend directory to sys.path so we can import 'app'
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from sqlalchemy.future import select
from app.core.database import AsyncSessionLocal, init_db
from app.models.models import (
    EmergencyTemplateModel,
    HubNodeModel,
    DepotModel,
    RouteDepotConfigModel,
    BreakLocationConfigModel
)

EMERGENCY_TEMPLATES = [
  {
    "id": "em_1",
    "title": "Аварія на вул. Преображенській (блокування трамваїв)",
    "cause": "ДТП стороннього автотранспорту на коліях біля вул. Тираспольської",
    "affectedRouteIds": ["T3", "T10"],
    "affectedStationIds": ["st_tiraspol"],
    "detourDescription": "Перенаправлення вагонів маршруту №3 через Старосінну площу та Прохоровську колію із заїздом у Трамвайне депо №1.",
    "alternativeStations": ["st_starosinna", "st_vodoprovidna"]
  },
  {
    "id": "em_2",
    "title": "Обрив контактного дроту на Пересипському мості",
    "cause": "Пошкодження габаритною вантажівкою контактної мережі тролейбусів та трамваїв",
    "affectedRouteIds": ["T7"],
    "affectedStationIds": ["st_peresyp"],
    "detourDescription": "Переведення трамваїв маршруту №7 у скорочений режим \"вул. Паустовського — Пересипський міст\" та \"Старосінна пл. — 11-та ст. Люстдорфської дороги\".",
    "alternativeStations": ["st_paustovskoho", "st_peresyp", "st_starosinna"]
  },
  {
    "id": "em_3",
    "title": "Неналежне паркування на Старосінній площі (Колія №1)",
    "cause": "Приватне авто заблокувало виїзд з колії №1",
    "affectedRouteIds": ["T3", "T7"],
    "affectedStationIds": ["st_starosinna"],
    "detourDescription": "Автоматичне перенаправлення траєкторії на резервну Колію №4 Старосінньої площі.",
    "alternativeStations": ["st_starosinna"]
  }
]

DEPOTS = [
  {
    "id": "depot_tram_1",
    "name": "Трамвайне депо №1",
    "type": "tram",
    "address": "вул. Водопровідна, 1",
    "lat": 46.4678,
    "lng": 30.7311,
    "prepTimeMin": 10
  },
  {
    "id": "depot_tram_2",
    "name": "Трамвайне депо №2",
    "type": "tram",
    "address": "вул. Академіка Воробйова, 1",
    "lat": 46.4952,
    "lng": 30.7183,
    "prepTimeMin": 10
  },
  {
    "id": "depot_trolley_1",
    "name": "Тролейбусне депо №1",
    "type": "trolleybus",
    "address": "вул. Інглезі, 2",
    "lat": 46.4281,
    "lng": 30.7042,
    "prepTimeMin": 19
  }
]

HUBS = [
  {
    "id": "hub_starosinna",
    "name": "Старосінна площа",
    "locationDescription": "Головне трамвайне кільце біля Залізничного вокзалу (4 паралельні колії)",
    "availableTracksCount": 4,
    "minHeadwayMin": 2,
    "routesConnecting": ["T3", "T7", "T10"],
    "channels": [
      { "trackId": "tr_1", "name": "Колія №1 (Люстдорфський напрямок)", "maxCapacity": 3, "directionVector": "South" },
      { "trackId": "tr_2", "name": "Колія №2 (Центральний напрямок)", "maxCapacity": 3, "directionVector": "North" },
      { "trackId": "tr_3", "name": "Колія №3 (Відстій / Обіди водіїв)", "maxCapacity": 2, "directionVector": "Idle" },
      { "trackId": "tr_4", "name": "Колія №4 (Обхідна колія)", "maxCapacity": 2, "directionVector": "Pass" }
    ]
  },
  {
    "id": "hub_tiraspol",
    "name": "Тираспольська площа",
    "locationDescription": "Кільцевий вузол перетину вулиць Преображенська та Тираспольська",
    "availableTracksCount": 3,
    "minHeadwayMin": 3,
    "routesConnecting": ["T3", "T10"],
    "channels": [
      { "trackId": "tr_t1", "name": "Колія №1 (Головне кільце)", "maxCapacity": 2, "directionVector": "Loop" },
      { "trackId": "tr_t2", "name": "Колія №2 (Західний об'їзд)", "maxCapacity": 2, "directionVector": "West" }
    ]
  },
  {
    "id": "hub_lustdorf_11th",
    "name": "11-та ст. Люстдорфської дороги",
    "locationDescription": "Кінцева станція та обгонова колія південного радіуса",
    "availableTracksCount": 2,
    "minHeadwayMin": 2,
    "routesConnecting": ["T3", "T7"],
    "channels": [
      { "trackId": "tr_l1", "name": "Колія №1 (Висаджувально-посадкова)", "maxCapacity": 2, "directionVector": "Terminal" },
      { "trackId": "tr_l2", "name": "Колія №2 (Запасна / Обіди)", "maxCapacity": 2, "directionVector": "Idle" }
    ]
  }
]

ROUTE_DEPOT_CONFIGS = [
  {
    "id": "cfg_1",
    "routeId": "Tr3",
    "primaryDepotId": "depot_trolley_1",
    "secondaryDepotId": None,
    "defaultOutboundTime": "05:00",
    "defaultInboundTime": "23:00"
  }
]

BREAK_LOCATIONS = [
  {
    "id": "brk_1",
    "routeId": "T3",
    "locationId": "st_starosinna",
    "locationName": "Старосінна площа",
    "locationType": "terminal",
    "maxCapacityVehicles": 4,
    "durationMin": 15
  },
  {
    "id": "brk_3",
    "routeId": "T3",
    "locationId": "st_lustdorf_11th",
    "locationName": "Кінцева станція «11-та ст. Люстдорфської дороги»",
    "locationType": "opposite_terminal",
    "maxCapacityVehicles": 2,
    "durationMin": 30
  }
]

async def seed_data():
    print("Initializing Database Tables...")
    await init_db()
    
    print("Seeding mock configuration data...")
    async with AsyncSessionLocal() as db:
        # Emergency Templates
        for item in EMERGENCY_TEMPLATES:
            exists = await db.execute(select(EmergencyTemplateModel).filter_by(id=item["id"]))
            if not exists.scalars().first():
                db.add(EmergencyTemplateModel(**item))
                
        # Hubs
        for item in HUBS:
            exists = await db.execute(select(HubNodeModel).filter_by(id=item["id"]))
            if not exists.scalars().first():
                db.add(HubNodeModel(**item))
                
        # Depots
        for item in DEPOTS:
            exists = await db.execute(select(DepotModel).filter_by(id=item["id"]))
            if not exists.scalars().first():
                db.add(DepotModel(**item))
                
        # Route Depot Configs
        for item in ROUTE_DEPOT_CONFIGS:
            exists = await db.execute(select(RouteDepotConfigModel).filter_by(id=item["id"]))
            if not exists.scalars().first():
                db.add(RouteDepotConfigModel(**item))
                
        # Break Locations
        for item in BREAK_LOCATIONS:
            exists = await db.execute(select(BreakLocationConfigModel).filter_by(id=item["id"]))
            if not exists.scalars().first():
                db.add(BreakLocationConfigModel(**item))
                
        await db.commit()
    print("Seed complete.")

if __name__ == "__main__":
    asyncio.run(seed_data())
