import asyncio
import os
import sys

# Add backend directory to sys.path so we can import 'app'
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from sqlalchemy.future import select
import app.core.database as db_module
from app.models.models import (
    EmergencyTemplateModel,
    HubNodeModel,
    DepotModel,
    RouteDepotConfigModel,
    BreakLocationConfigModel,
    RouteModel,
    StationModel,
    RouteStation
)

ODESSA_ROUTES = [
    {
        "id": "7",
        "number": "7",
        "name": "вул. Паустовського — 11-та ст. Люстдорфської дороги",
        "type": "TRAM",
        "status": "ACTIVE",
        "length_km": 33.2,
        "default_speed_kmh": 16.5,
        "color": "#2563EB",
        "description": "Магістральний маршрут прямого сполучення «Північ-Південь» через Пересипський міст та Старосінну площу"
    },
    {
        "id": "18",
        "number": "18",
        "name": "Куликове поле — 16-та ст. Великого Фонтану",
        "type": "TRAM",
        "status": "ACTIVE",
        "length_km": 11.8,
        "default_speed_kmh": 15.0,
        "color": "#DC2626",
        "description": "Основна магістраль Великого Фонтану (ізольована лінія Фонтанської дороги; єдине проміжне кільце — 11 ст. Фонтану)"
    },
    {
        "id": "17",
        "number": "17",
        "name": "Куликове поле — 11-та ст. Великого Фонтану",
        "type": "TRAM",
        "status": "ACTIVE",
        "length_km": 8.8,
        "default_speed_kmh": 15.2,
        "color": "#F59E0B",
        "description": "Скорочений маршрут лінії Фонтану до кільця 11 ст. Великого Фонтану (Ванний провулок)"
    },
    {
        "id": "5",
        "number": "5",
        "name": "Аркадія — Центральний Автовокзал",
        "type": "TRAM",
        "status": "ACTIVE",
        "length_km": 14.2,
        "default_speed_kmh": 14.0,
        "color": "#16A34A",
        "description": "Зв'язок Аркадії, Французького бульвару, Привозу та Автовокзалу (з прямим розворотом на кільці «Парк Шевченка» маршруту №28)"
    },
    {
        "id": "28",
        "number": "28",
        "name": "Парк Шевченка — вул. Пастера",
        "type": "TRAM",
        "status": "ACTIVE",
        "length_km": 8.4,
        "default_speed_kmh": 13.5,
        "color": "#9333EA",
        "description": "Кільцевий центральний маршрут через вул. Леонтовича та Тираспольську площу"
    },
    {
        "id": "8",
        "number": "8",
        "name": "Залізничний вокзал — вул. Інглезі",
        "type": "TROLLEYBUS",
        "status": "ACTIVE",
        "length_km": 9.6,
        "default_speed_kmh": 16.0,
        "color": "#EA580C",
        "description": "Тролейбусна лінія через вул. Космонавтів та Адміральський проспект"
    },
    {
        "id": "9",
        "number": "9",
        "name": "вул. Інглезі — вул. Рішельєвська / Грецька",
        "type": "TROLLEYBUS",
        "status": "ACTIVE",
        "length_km": 12.0,
        "default_speed_kmh": 15.5,
        "color": "#0891B2",
        "description": "Тролейбусне сполучення спального району Черемушки з історичним центром міста"
    },
    {
        "id": "Tr7",
        "number": "7",
        "name": "вул. Архітекторська — вул. Новосельського",
        "type": "TROLLEYBUS",
        "status": "ACTIVE",
        "length_km": 15.4,
        "default_speed_kmh": 15.0,
        "color": "#4F46E5",
        "description": "Магістральний тролейбус Київського району (Таїрова) до Центру"
    },
    {
        "id": "10",
        "number": "10",
        "name": "вул. Інглезі — Пересипський міст",
        "type": "TROLLEYBUS",
        "status": "ACTIVE",
        "length_km": 13.8,
        "default_speed_kmh": 15.2,
        "color": "#D97706",
        "description": "Швидкісний тролейбусний діагональний маршрут Черемушки — Пересип"
    }
]

# Ключові станції та зупинки Одеси з реальними GPS координатами
ODESSA_STATIONS = [
    # Трамваї 18 та 17 (Лінія Фонтану)
    {"id": "st_kulykove", "name": "Куликове поле (Кінцева)", "type": "HUB", "lat": 46.4668, "lng": 30.7441, "is_dispatch_station": True, "break_capacity": 3},
    {"id": "st_4_fontan", "name": "4-та станція В. Фонтану", "type": "STOP", "lat": 46.4520, "lng": 30.7485, "is_dispatch_station": False, "break_capacity": 0},
    {"id": "st_5_fontan", "name": "5-та станція В. Фонтану", "type": "STOP", "lat": 46.4465, "lng": 30.7502, "is_dispatch_station": False, "break_capacity": 0},
    {"id": "st_6_fontan", "name": "6-та станція В. Фонтану", "type": "STOP", "lat": 46.4402, "lng": 30.7521, "is_dispatch_station": False, "break_capacity": 0},
    {"id": "st_7_fontan", "name": "7-ма станція В. Фонтану", "type": "STOP", "lat": 46.4345, "lng": 30.7540, "is_dispatch_station": False, "break_capacity": 0},
    {"id": "st_8_fontan", "name": "8-ма станція В. Фонтану", "type": "STOP", "lat": 46.4290, "lng": 30.7558, "is_dispatch_station": False, "break_capacity": 0},
    {"id": "st_9_fontan", "name": "9-та станція В. Фонтану", "type": "STOP", "lat": 46.4230, "lng": 30.7570, "is_dispatch_station": False, "break_capacity": 0},
    {"id": "st_11_fontan", "name": "11-та станція В. Фонтану (Кільце)", "type": "HUB", "lat": 46.4150, "lng": 30.7585, "is_dispatch_station": True, "break_capacity": 2},
    {"id": "st_16_fontan", "name": "16-та станція В. Фонтану (Золотий Берег)", "type": "HUB", "lat": 46.3885, "lng": 30.7520, "is_dispatch_station": True, "break_capacity": 3},
    
    # Трамвай 7 & Вузли
    {"id": "st_paustovskoho", "name": "вул. Паустовського (Кінцева)", "type": "HUB", "lat": 46.5925, "lng": 30.8010, "is_dispatch_station": True, "break_capacity": 4},
    {"id": "st_moloda_gvardiya", "name": "Молода Гвардія", "type": "STOP", "lat": 46.5540, "lng": 30.7720, "is_dispatch_station": False, "break_capacity": 0},
    {"id": "st_luzanivka", "name": "Лузанівка (Кільце)", "type": "HUB", "lat": 46.5450, "lng": 30.7620, "is_dispatch_station": True, "break_capacity": 3},
    {"id": "st_peresyp", "name": "Пересипський міст (Херсонський сквер)", "type": "HUB", "lat": 46.4975, "lng": 30.7245, "is_dispatch_station": True, "break_capacity": 3},
    {"id": "st_starosinna", "name": "Старосінна площа (Головний Хаб)", "type": "HUB", "lat": 46.4685, "lng": 30.7380, "is_dispatch_station": True, "break_capacity": 4},
    {"id": "st_lustdorf_11", "name": "11-та станція Люстдорфської дороги", "type": "HUB", "lat": 46.3980, "lng": 30.7180, "is_dispatch_station": True, "break_capacity": 3},
    
    # Трамвай 5 & 28
    {"id": "st_arkadia", "name": "Аркадія (Кільце)", "type": "HUB", "lat": 46.4295, "lng": 30.7660, "is_dispatch_station": True, "break_capacity": 3},
    {"id": "st_muzkomediya", "name": "Театр Музкомедії (Поворот на Парк Шевченка)", "type": "STOP", "lat": 46.4720, "lng": 30.7510, "is_dispatch_station": False, "break_capacity": 0},
    {"id": "st_autovokzal", "name": "Центральний Автовокзал", "type": "HUB", "lat": 46.4780, "lng": 30.7085, "is_dispatch_station": True, "break_capacity": 2},
    {"id": "st_oleksiivska", "name": "Олексіївська площа", "type": "HUB", "lat": 46.4670, "lng": 30.7150, "is_dispatch_station": True, "break_capacity": 2},
    {"id": "st_tyraspolska", "name": "Тираспольська площа", "type": "HUB", "lat": 46.4815, "lng": 30.7320, "is_dispatch_station": True, "break_capacity": 2},
    {"id": "st_shevchenko_park", "name": "Парк ім. Т. Шевченка (Кільце)", "type": "HUB", "lat": 46.4830, "lng": 30.7550, "is_dispatch_station": True, "break_capacity": 2},
    {"id": "st_pastera", "name": "вул. Пастера (Міська лікарня)", "type": "HUB", "lat": 46.4950, "lng": 30.7220, "is_dispatch_station": True, "break_capacity": 2},
]

# Маршрутна прив'язка зупинок для Трамвая №18
ROUTE_18_STOPS = [
    "st_kulykove", "st_4_fontan", "st_5_fontan", "st_6_fontan", 
    "st_7_fontan", "st_8_fontan", "st_9_fontan", "st_11_fontan", "st_16_fontan"
]

async def seed_data():
    print("Ініціалізація структури бази даних...")
    await db_module.init_db()
    
    print("Наповнення еталонними маршрутами та зупинками Одеси...")
    async with db_module.AsyncSessionLocal() as db:
        # 1. Станції
        for st in ODESSA_STATIONS:
            exists = await db.execute(select(StationModel).filter_by(id=st["id"]))
            if not exists.scalars().first():
                db.add(StationModel(**st))
        await db.commit()

        # 2. Маршрути
        for r in ODESSA_ROUTES:
            exists = await db.execute(select(RouteModel).filter_by(id=r["id"]))
            if not exists.scalars().first():
                db.add(RouteModel(**r))
        await db.commit()

        # 3. Прив'язка зупинок для Маршруту 18 (Прямий та зворотний напрямки)
        for idx, st_id in enumerate(ROUTE_18_STOPS, start=1):
            exists_0 = await db.execute(
                select(RouteStation).filter_by(route_id="18", direction_id=0, stop_id=st_id)
            )
            if not exists_0.scalars().first():
                db.add(RouteStation(route_id="18", direction_id=0, stop_id=st_id, stop_sequence=idx))
                
        rev_18_stops = list(reversed(ROUTE_18_STOPS))
        for idx, st_id in enumerate(rev_18_stops, start=1):
            exists_1 = await db.execute(
                select(RouteStation).filter_by(route_id="18", direction_id=1, stop_id=st_id)
            )
            if not exists_1.scalars().first():
                db.add(RouteStation(route_id="18", direction_id=1, stop_id=st_id, stop_sequence=idx))

        await db.commit()
    print("✅ Наповнення бази даних Одеси успішно завершено!")

if __name__ == "__main__":
    asyncio.run(seed_data())
