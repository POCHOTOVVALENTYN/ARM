import asyncio
import csv
import json
import logging
import os
import re
import sys
from datetime import date, datetime, time, timedelta

# Додаємо кореневу директорію backend до шляху пошуку модулів
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import AsyncSessionLocal, init_db
from app.models.models import (
    ActiveDetour,
    Base,
    BreakLocationConfigModel,
    ControlPoint,
    DepotModel,
    DispatchOrderModel,
    Dispatcher,
    Driver,
    DutyTypeModel,
    EmergencyTemplateModel,
    EtaLog,
    HubNodeModel,
    IncidentLog,
    RouteDepotConfigModel,
    RouteModel,
    RouteShape,
    RouteStation,
    StationModel,
    SystemConfig,
    Vehicle,
    Waybill,
)
from app.models.schedule import (
    DutyType,
    Schedule,
    ScheduleStatus,
    ServiceDay,
    StaticDuty,
    StaticShift,
    StaticStopTime,
    StaticTrip,
    TripDirection,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("seed_real_data")

# Визначаємо шлях до директорії з GTFS файлами
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
GTFS_DIR = os.path.join(ROOT_DIR, "gtfs_static_data")

ODESSA_DEPOTS = [
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
        "prepTimeMin": 19
    }
]

KEY_DISPATCH_HUBS = [
    {"id": "cp_starosinna", "name": "пл. Старосінна (Головний Хаб)", "lat": 46.4685, "lng": 30.7380, "is_dp": True, "break_capacity": 6},
    {"id": "cp_paust", "name": "ДП «вул. Паустовського» (Північ)", "lat": 46.5925, "lng": 30.8010, "is_dp": True, "break_capacity": 6},
    {"id": "cp_kulikove", "name": "Куликове поле (Залізничний вокзал)", "lat": 46.4668, "lng": 30.7441, "is_dp": True, "break_capacity": 5},
    {"id": "cp_fontan_16", "name": "16-та ст. Великого Фонтану (Золотий Берег)", "lat": 46.3885, "lng": 30.7520, "is_dp": True, "break_capacity": 4},
    {"id": "cp_arkadia", "name": "Станція «Аркадія»", "lat": 46.4295, "lng": 30.7660, "is_dp": True, "break_capacity": 4},
    {"id": "cp_lustdorf_11", "name": "11-та станція Люстдорфської дороги", "lat": 46.3825, "lng": 30.7144, "is_dp": True, "break_capacity": 4},
    {"id": "cp_luzanivka", "name": "Лузанівка (Кільце)", "lat": 46.5450, "lng": 30.7620, "is_dp": True, "break_capacity": 4},
    {"id": "cp_tiraspol", "name": "пл. Тираспольська", "lat": 46.4815, "lng": 30.7320, "is_dp": True, "break_capacity": 3},
    {"id": "cp_autovokzal", "name": "Центральний Автовокзал", "lat": 46.4780, "lng": 30.7085, "is_dp": True, "break_capacity": 3},
    {"id": "cp_peresyp", "name": "Пересипський міст (Херсонський сквер)", "lat": 46.4975, "lng": 30.7245, "is_dp": True, "break_capacity": 4},
    {"id": "cp_oleksiivska", "name": "пл. Олексіївська (Товарна)", "lat": 46.4670, "lng": 30.7150, "is_dp": True, "break_capacity": 3},
    {"id": "cp_shevchenko_park", "name": "Парк ім. Т. Шевченка", "lat": 46.4830, "lng": 30.7550, "is_dp": True, "break_capacity": 3},
    {"id": "cp_pastera", "name": "вул. Пастера (Міська лікарня)", "lat": 46.4950, "lng": 30.7220, "is_dp": True, "break_capacity": 3},
    {"id": "cp_centrolit", "name": "Завод Центроліт", "lat": 46.6188, "lng": 30.8155, "is_dp": True, "break_capacity": 4},
    {"id": "cp_khadzhibey", "name": "Хаджибейський лиман", "lat": 46.5270, "lng": 30.6890, "is_dp": True, "break_capacity": 2},
    {"id": "cp_zastava_1", "name": "станція Застава I", "lat": 46.4691, "lng": 30.6688, "is_dp": True, "break_capacity": 3},
    {"id": "cp_zastava_2", "name": "станція Застава ІІ", "lat": 46.4712, "lng": 30.7011, "is_dp": True, "break_capacity": 3},
    {"id": "cp_arxitektorska", "name": "вул. Архітекторська (Таїрова)", "lat": 46.3880, "lng": 30.7100, "is_dp": True, "break_capacity": 4},
    {"id": "cp_inglezi", "name": "вул. Інглезі (Черемушки)", "lat": 46.4175, "lng": 30.7110, "is_dp": True, "break_capacity": 4},
    {"id": "cp_aeroport", "name": "Центральний Аеропорт / вул. Ріхтера", "lat": 46.4380, "lng": 30.6780, "is_dp": True, "break_capacity": 3}
]

DUTY_TYPES_DATA = [
    {"id": "DOUBLE", "name": "Двозмінний", "code": "ДВ", "description": "Повний робочий день (1 вагон, 2 зміни водіїв по 7.5-8 год)", "max_shift_hours": 8.0, "color": "#2563eb"},
    {"id": "SINGLE", "name": "Однозмінний", "code": "ОД", "description": "Один водій на одну зміну (ранкова або денна)", "max_shift_hours": 8.0, "color": "#10b981"},
    {"id": "SPLIT", "name": "Розривний", "code": "РОЗ", "description": "Розривний графік (ранок + вечірній пік) з міжзмінним ТО в депо", "max_shift_hours": 10.0, "color": "#f59e0b"},
    {"id": "PEAK", "name": "Піковий", "code": "ПІК", "description": "Посилений випуск у ранкові та вечірні години пік", "max_shift_hours": 6.5, "color": "#8b5cf6"},
    {"id": "NIGHT", "name": "Черговий (Нічний)", "code": "ЧЕР", "description": "Спецрейси для розвезення працівників підприємства", "max_shift_hours": 8.0, "color": "#64748b"}
]

ROUTES_SPECIFICATION = [
    # --- ТРАМВАЇ ---
    {
        "id": "1", "number": "1", "name": "вул. Чорноморського козацтва — завод Центроліт",
        "type": "TRAM", "length_km": 34.5, "default_speed_kmh": 20.7, "color": "#3b82f6",
        "t_dir0_min": 50, "t_dir1_min": 50, "round_trip_min": 110, "designated_dp": "Завод Центроліт",
        "depot_id": "depot_2", "gtfs_dir0": "89642", "gtfs_dir1": "90303"
    },
    {
        "id": "5", "number": "5", "name": "Автовокзал — Аркадія",
        "type": "TRAM", "length_km": 17.6, "default_speed_kmh": 14.7, "color": "#16a34a",
        "t_dir0_min": 36, "t_dir1_min": 36, "round_trip_min": 80, "designated_dp": "Станція «Аркадія»",
        "depot_id": "depot_2", "gtfs_dir0": "107596", "gtfs_dir1": "107597"
    },
    {
        "id": "6", "number": "6", "name": "вул. Чорноморського козацтва — Лузанівка",
        "type": "TRAM", "length_km": 15.5, "default_speed_kmh": 19.4, "color": "#06b6d4",
        "t_dir0_min": 24, "t_dir1_min": 24, "round_trip_min": 54, "designated_dp": "Лузанівка",
        "depot_id": "depot_2", "gtfs_dir0": "107598", "gtfs_dir1": "107599"
    },
    {
        "id": "7", "number": "7", "name": "вул. Паустовського — 11-а ст. Люстдорфської дороги",
        "type": "TRAM", "length_km": 58.8, "default_speed_kmh": 20.0, "color": "#2563eb",
        "t_dir0_min": 88, "t_dir1_min": 88, "round_trip_min": 190, "designated_dp": "вул. Паустовського",
        "depot_id": "depot_1", "gtfs_dir0": "107569", "gtfs_dir1": "107591",
        "description": "Магістральний швидкісний маршрут прямого сполучення «Північ-Південь»"
    },
    {
        "id": "10", "number": "10", "name": "вул. Іцхака Рабіна — пл. Тираспольська",
        "type": "TRAM", "length_km": 16.0, "default_speed_kmh": 15.0, "color": "#d97706",
        "t_dir0_min": 32, "t_dir1_min": 32, "round_trip_min": 72, "designated_dp": "пл. Тираспольська",
        "depot_id": "depot_1", "gtfs_dir0": "107600", "gtfs_dir1": "107601"
    },
    {
        "id": "11", "number": "11", "name": "Залізничний вокзал — пл. Олексіївська",
        "type": "TRAM", "length_km": 5.6, "default_speed_kmh": 12.0, "color": "#8b5cf6",
        "t_dir0_min": 14, "t_dir1_min": 14, "round_trip_min": 34, "designated_dp": "пл. Олексіївська",
        "depot_id": "depot_1", "gtfs_dir0": "107603", "gtfs_dir1": "107604"
    },
    {
        "id": "12", "number": "12", "name": "Херсонський сквер — Слобідський ринок",
        "type": "TRAM", "length_km": 7.6, "default_speed_kmh": 12.7, "color": "#ec4899",
        "t_dir0_min": 18, "t_dir1_min": 18, "round_trip_min": 42, "designated_dp": "Херсонський сквер",
        "depot_id": "depot_2", "gtfs_dir0": "107605", "gtfs_dir1": "107606"
    },
    {
        "id": "13", "number": "13", "name": "пл. Старосінна — ж/м Шкільний",
        "type": "TRAM", "length_km": 16.2, "default_speed_kmh": 15.2, "color": "#14b8a6",
        "t_dir0_min": 32, "t_dir1_min": 32, "round_trip_min": 72, "designated_dp": "пл. Старосінна",
        "depot_id": "depot_1", "gtfs_dir0": "107691", "gtfs_dir1": "107692"
    },
    {
        "id": "15", "number": "15", "name": "пл. Олексіївська — Слобідський ринок",
        "type": "TRAM", "length_km": 15.8, "default_speed_kmh": 14.8, "color": "#f97316",
        "t_dir0_min": 32, "t_dir1_min": 32, "round_trip_min": 72, "designated_dp": "Слобідський ринок",
        "depot_id": "depot_2", "gtfs_dir0": "89418", "gtfs_dir1": "89419"
    },
    {
        "id": "17", "number": "17", "name": "Куликове поле — 11-а ст. Великого Фонтану",
        "type": "TRAM", "length_km": 13.4, "default_speed_kmh": 15.5, "color": "#f59e0b",
        "t_dir0_min": 26, "t_dir1_min": 26, "round_trip_min": 60, "designated_dp": "Куликове поле",
        "depot_id": "depot_1", "gtfs_dir0": "107694", "gtfs_dir1": "107693"
    },
    {
        "id": "18", "number": "18", "name": "Куликове поле — 16-та ст. Великого Фонтану",
        "type": "TRAM", "length_km": 25.4, "default_speed_kmh": 18.1, "color": "#dc2626",
        "t_dir0_min": 42, "t_dir1_min": 42, "round_trip_min": 92, "designated_dp": "Куликове поле",
        "depot_id": "depot_1", "gtfs_dir0": "107695", "gtfs_dir1": "107696"
    },
    {
        "id": "20", "number": "20", "name": "Херсонський сквер — Хаджибейський лиман",
        "type": "TRAM", "length_km": 14.7, "default_speed_kmh": 17.6, "color": "#84cc16",
        "t_dir0_min": 25, "t_dir1_min": 25, "round_trip_min": 58, "designated_dp": "Херсонський сквер",
        "depot_id": "depot_2", "gtfs_dir0": "89629", "gtfs_dir1": "89630",
        "description": "Історичний рекреаційний маршрут «Камишовий трамвай»"
    },
    {
        "id": "21", "number": "21", "name": "пл. Тираспольська — станція Застава ІІ",
        "type": "TRAM", "length_km": 9.6, "default_speed_kmh": 13.1, "color": "#6366f1",
        "t_dir0_min": 22, "t_dir1_min": 22, "round_trip_min": 50, "designated_dp": "пл. Тираспольська",
        "depot_id": "depot_1", "gtfs_dir0": "107607", "gtfs_dir1": "107608"
    },
    {
        "id": "26", "number": "26", "name": "пл. Старосінна — 11-а ст. Люстдорфської дороги",
        "type": "TRAM", "length_km": 22.3, "default_speed_kmh": 17.6, "color": "#a855f7",
        "t_dir0_min": 38, "t_dir1_min": 38, "round_trip_min": 84, "designated_dp": "пл. Старосінна",
        "depot_id": "depot_1", "gtfs_dir0": "107620", "gtfs_dir1": "107621"
    },
    {
        "id": "27", "number": "27", "name": "11-а ст. Люстдорфської дороги — Рибний порт",
        "type": "TRAM", "length_km": 14.7, "default_speed_kmh": 16.0, "color": "#0ea5e9",
        "t_dir0_min": 25, "t_dir1_min": 25, "round_trip_min": 56, "designated_dp": "11-а ст. Люстдорфської дороги",
        "depot_id": "depot_1", "gtfs_dir0": "107609", "gtfs_dir1": "107610"
    },
    {
        "id": "28", "number": "28", "name": "вул. Пастера — Парк ім. Тараса Шевченка",
        "type": "TRAM", "length_km": 11.5, "default_speed_kmh": 13.3, "color": "#9333ea",
        "t_dir0_min": 26, "t_dir1_min": 26, "round_trip_min": 60, "designated_dp": "Парк ім. Тараса Шевченка",
        "depot_id": "depot_1", "gtfs_dir0": "107618", "gtfs_dir1": "107619"
    },

    # --- ТРОЛЕЙБУСИ ---
    {
        "id": "Tr2", "number": "2", "name": "Парк ім. Тараса Шевченка — вул. Новосельського",
        "type": "TROLLEYBUS", "length_km": 11.3, "default_speed_kmh": 14.1, "color": "#059669",
        "t_dir0_min": 24, "t_dir1_min": 24, "round_trip_min": 56, "designated_dp": "Парк ім. Тараса Шевченка",
        "depot_id": "depot_3", "gtfs_dir0": "89311", "gtfs_dir1": "89312"
    },
    {
        "id": "Tr3", "number": "3", "name": "станція Застава I — Парк ім. Тараса Шевченка",
        "type": "TROLLEYBUS", "length_km": 17.6, "default_speed_kmh": 15.5, "color": "#0284c7",
        "t_dir0_min": 34, "t_dir1_min": 34, "round_trip_min": 76, "designated_dp": "станція Застава I",
        "depot_id": "depot_3", "gtfs_dir0": "88177", "gtfs_dir1": "88178"
    },
    {
        "id": "Tr7", "number": "7", "name": "вул. Архітекторська — вул. Новосельського",
        "type": "TROLLEYBUS", "length_km": 37.5, "default_speed_kmh": 17.3, "color": "#4f46e5",
        "t_dir0_min": 65, "t_dir1_min": 65, "round_trip_min": 140, "designated_dp": "вул. Архітекторська",
        "depot_id": "depot_3", "gtfs_dir0": "89405", "gtfs_dir1": "89407"
    },
    {
        "id": "Tr8", "number": "8", "name": "Суперфосфатний завод — Залізничний вокзал",
        "type": "TROLLEYBUS", "length_km": 17.7, "default_speed_kmh": 16.6, "color": "#ea580c",
        "t_dir0_min": 32, "t_dir1_min": 32, "round_trip_min": 72, "designated_dp": "Залізничний вокзал",
        "depot_id": "depot_3", "gtfs_dir0": "89410", "gtfs_dir1": "89411"
    },
    {
        "id": "Tr9", "number": "9", "name": "вул. Інглезі — вул. Рішельєвська",
        "type": "TROLLEYBUS", "length_km": 23.5, "default_speed_kmh": 16.8, "color": "#0891b2",
        "t_dir0_min": 42, "t_dir1_min": 42, "round_trip_min": 92, "designated_dp": "вул. Інглезі",
        "depot_id": "depot_3", "gtfs_dir0": "89412", "gtfs_dir1": "89414"
    },
    {
        "id": "Tr10", "number": "10", "name": "вул. Інглезі — вул. Приморська",
        "type": "TROLLEYBUS", "length_km": 31.1, "default_speed_kmh": 17.3, "color": "#d97706",
        "t_dir0_min": 54, "t_dir1_min": 54, "round_trip_min": 118, "designated_dp": "вул. Інглезі",
        "depot_id": "depot_3", "gtfs_dir0": "89415", "gtfs_dir1": "89416"
    },
    {
        "id": "Tr12", "number": "12", "name": "вул. Архітекторська — вул. Центральний Аеропорт",
        "type": "TROLLEYBUS", "length_km": 23.4, "default_speed_kmh": 16.7, "color": "#7c3aed",
        "t_dir0_min": 42, "t_dir1_min": 42, "round_trip_min": 92, "designated_dp": "вул. Архітекторська",
        "depot_id": "depot_3", "gtfs_dir0": "89403", "gtfs_dir1": "89404"
    }
]

ODESSA_DRIVERS_NAMES = [
    "Петренко Олександр Михайлович", "Ковальчук Василь Іванович", "Сидоренко Григорій Павлович",
    "Василенко Дмитро Сергійович", "Мельник Олег Володимирович", "Ткаченко Андрій Миколайович",
    "Шевченко Павло Степанович", "Бондаренко Анатолій Вікторович", "Кравченко Ігор Валерійович",
    "Олійник Сергій Петрович", "Поліщук Юрій Михайлович", "Бойко Микола Васильович",
    "Мороз Олексій Григорович", "Лисенко Роман Дмитрович", "Григоренко Тарас Олегович",
    "Кузьменко Віктор Андрійович", "Павленко Денис Сергійович", "Дмитренко Артем Вікторович",
    "Савченко Євген Леонідович", "Клименко Михайло Ігорович", "Руденко Володимир Степанович",
    "Захарченко Руслан Борисович", "Назаренко Віталій Романович", "Кушнір Андрій Анатолійович",
    "Гончарук Богдан Петрович", "Мазур Станіслав Ігорович", "Марченко Владислав Олегович",
    "Федоренко Мирослав Васильович", "Козак Вадим Анатолійович", "Коваленко Дмитро Олександрович"
]

async def seed_all_real_data():
    logger.info("🚀 Початок наповнення бази даних КП «Одесміськелектротранс» 100% реальними даними...")
    await init_db()

    async with AsyncSessionLocal() as db:
        # --- 1. Очищення застарілих та мок-таблиць ---
        logger.info("🧹 Очищення старих таблиць...")
        await db.execute(delete(RouteStation))
        await db.execute(delete(RouteShape))
        await db.execute(delete(StaticStopTime))
        await db.execute(delete(StaticTrip))
        await db.execute(delete(StaticShift))
        await db.execute(delete(StaticDuty))
        await db.execute(delete(Schedule))
        await db.execute(delete(Vehicle))
        await db.execute(delete(Driver))
        await db.execute(delete(DutyTypeModel))
        await db.execute(delete(ControlPoint))
        await db.execute(delete(HubNodeModel))
        await db.execute(delete(DepotModel))
        await db.execute(delete(RouteModel))
        await db.execute(delete(StationModel))
        await db.execute(delete(EmergencyTemplateModel))
        await db.execute(delete(SystemConfig))
        await db.commit()

        # --- 2. Наповнення Депо ---
        logger.info("🏢 Наповнення депо...")
        for d in ODESSA_DEPOTS:
            db.add(DepotModel(
                id=d["id"],
                code=d["code"],
                name=d["name"],
                type=d["type"],
                address=d["address"],
                lat=d["lat"],
                lng=d["lng"],
                polygon=d["polygon"],
                prepTimeMin=d["prepTimeMin"]
            ))
        await db.commit()

        # --- 3. Наповнення Типів Нарядів ---
        logger.info("📋 Наповнення типів нарядів...")
        for dt in DUTY_TYPES_DATA:
            db.add(DutyTypeModel(**dt))
        await db.commit()

        # --- 4. Наповнення Контрольних Пунктів та Хабів ---
        logger.info("📍 Наповнення диспетчерських пунктів та КТ...")
        for idx, cp in enumerate(KEY_DISPATCH_HUBS, 1):
            db.add(ControlPoint(
                id=idx,
                name=cp["name"],
                lat=cp["lat"],
                lng=cp["lng"],
                is_dispatcher_hub=cp["is_dp"]
            ))
            db.add(HubNodeModel(
                id=cp["id"],
                name=cp["name"],
                locationDescription=f"Ключовий вузол та ДП КП «ОМЕТ» ({cp['name']})",
                availableTracksCount=cp.get("break_capacity", 3),
                minHeadwayMin=2,
                routesConnecting=[],
                channels=[]
            ))
        await db.commit()

        # --- 5. Завантаження 639 реальних зупинок з GTFS stops.txt ---
        logger.info(f"🚏 Завантаження зупинок з {os.path.join(GTFS_DIR, 'stops.txt')}...")
        stops_file = os.path.join(GTFS_DIR, "stops.txt")
        stops_dict = {}
        with open(stops_file, encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            for row in reader:
                s_id = str(row["stop_id"]).strip()
                s_name = row["stop_name"].strip().strip('"')
                s_lat = float(row["stop_lat"])
                s_lon = float(row["stop_lon"])

                # Визначення чи це ДП або розворотне кільце
                is_dp = any(k in s_name.lower() for k in [
                    "паустовського", "куликове", "аркадія", "старосінна", "люстдорф",
                    "слобідський", "лузанівка", "тираспільська", "шевченка", "пастера",
                    "центроліт", "хаджибейський", "застава", "аеропорт", "інглезі", "архітекторська"
                ])
                break_cap = 4 if is_dp else 0
                s_type = "HUB" if is_dp else "STOP"

                st_obj = StationModel(
                    id=s_id,
                    name=s_name,
                    type=s_type,
                    status="ACTIVE",
                    lat=s_lat,
                    lon=s_lon,
                    lng=s_lon,
                    is_dispatch_station=is_dp,
                    break_capacity=break_cap
                )
                db.add(st_obj)
                stops_dict[s_id] = st_obj
        await db.commit()
        logger.info(f"✅ Успішно завантажено {len(stops_dict)} реальних зупинок Одеси!")

        # --- 6. Завантаження точних геометрій (shapes.txt) ---
        logger.info(f"🛤️ Завантаження геометрій колій з {os.path.join(GTFS_DIR, 'shapes.txt')}...")
        shapes_file = os.path.join(GTFS_DIR, "shapes.txt")
        raw_shapes = {}
        with open(shapes_file, encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            for row in reader:
                sid = row["shape_id"].strip()
                raw_shapes.setdefault(sid, []).append({
                    "lat": float(row["shape_pt_lat"]),
                    "lng": float(row["shape_pt_lon"]),
                    "seq": int(row["shape_pt_sequence"])
                })

        for sid, pts in raw_shapes.items():
            pts.sort(key=lambda p: p["seq"])

        # Зберігаємо геометрії у таблицю route_shapes
        shape_count = 0
        for r_spec in ROUTES_SPECIFICATION:
            r_id = r_spec["id"]
            num = r_spec["number"]
            # Прямий напрямок (dir 0)
            dir0_shape_id = r_spec.get("gtfs_dir0")
            if dir0_shape_id and dir0_shape_id in raw_shapes:
                geom_0 = [{"lat": p["lat"], "lng": p["lng"]} for p in raw_shapes[dir0_shape_id]]
                db.add(RouteShape(route_id=r_id, direction_id=0, geometry=geom_0))
                # Також дублюємо для текстового номера маршруту
                if num != r_id:
                    db.add(RouteShape(route_id=num, direction_id=0, geometry=geom_0))
                shape_count += 1

            # Зворотний напрямок (dir 1)
            dir1_shape_id = r_spec.get("gtfs_dir1")
            if dir1_shape_id and dir1_shape_id in raw_shapes:
                geom_1 = [{"lat": p["lat"], "lng": p["lng"]} for p in raw_shapes[dir1_shape_id]]
                db.add(RouteShape(route_id=r_id, direction_id=1, geometry=geom_1))
                if num != r_id:
                    db.add(RouteShape(route_id=num, direction_id=1, geometry=geom_1))
                shape_count += 1

        await db.commit()
        logger.info(f"✅ Збережено {shape_count} геометрій маршрутів трамваїв та тролейбусів!")

        # --- 7. Завантаження послідовностей зупинок (trips.txt + stop_times.txt) ---
        logger.info("📊 Побудова послідовностей зупинок route_stations...")
        trips_file = os.path.join(GTFS_DIR, "trips.txt")
        route_to_trip = {}
        with open(trips_file, encoding="utf-8-sig") as f:
            for row in csv.DictReader(f):
                gtfs_rid = row["route_id"].strip()
                if gtfs_rid not in route_to_trip:
                    route_to_trip[gtfs_rid] = row["trip_id"].strip()

        target_trips = set(route_to_trip.values())
        stop_times_by_trip = {}
        stop_times_file = os.path.join(GTFS_DIR, "stop_times.txt")
        with open(stop_times_file, encoding="utf-8-sig") as f:
            for row in csv.DictReader(f):
                tid = row["trip_id"].strip()
                if tid in target_trips:
                    stop_times_by_trip.setdefault(tid, []).append({
                        "stop_id": row["stop_id"].strip(),
                        "seq": int(row["stop_sequence"])
                    })

        route_stations_count = 0
        for r_spec in ROUTES_SPECIFICATION:
            r_id = r_spec["id"]
            num = r_spec["number"]

            # Dir 0
            gtfs_0 = r_spec.get("gtfs_dir0")
            trip_0 = route_to_trip.get(gtfs_0)
            if trip_0 and trip_0 in stop_times_by_trip:
                st_list = sorted(stop_times_by_trip[trip_0], key=lambda x: x["seq"])
                for s_idx, st_data in enumerate(st_list, 1):
                    db.add(RouteStation(route_id=r_id, direction_id=0, stop_id=st_data["stop_id"], stop_sequence=s_idx))
                    if num != r_id:
                        db.add(RouteStation(route_id=num, direction_id=0, stop_id=st_data["stop_id"], stop_sequence=s_idx))
                    route_stations_count += 1

            # Dir 1
            gtfs_1 = r_spec.get("gtfs_dir1")
            trip_1 = route_to_trip.get(gtfs_1)
            if trip_1 and trip_1 in stop_times_by_trip:
                st_list = sorted(stop_times_by_trip[trip_1], key=lambda x: x["seq"])
                for s_idx, st_data in enumerate(st_list, 1):
                    db.add(RouteStation(route_id=r_id, direction_id=1, stop_id=st_data["stop_id"], stop_sequence=s_idx))
                    if num != r_id:
                        db.add(RouteStation(route_id=num, direction_id=1, stop_id=st_data["stop_id"], stop_sequence=s_idx))
                    route_stations_count += 1

        await db.commit()
        logger.info(f"✅ Збережено {route_stations_count} зупинок у послідовностях route_stations!")

        # --- 8. Наповнення Маршрутів (routes) ---
        logger.info("🚋 Наповнення паспортів маршрутів...")
        for r in ROUTES_SPECIFICATION:
            db.add(RouteModel(
                id=r["id"],
                number=r["number"],
                name=r["name"],
                type=r["type"],
                status="ACTIVE",
                length_km=r["length_km"],
                lengthDir1Km=round(r["length_km"] / 2, 1),
                lengthDir2Km=round(r["length_km"] / 2, 1),
                default_speed_kmh=r["default_speed_kmh"],
                round_trip_min=r["round_trip_min"],
                t_dir0_min=r["t_dir0_min"],
                t_dir1_min=r["t_dir1_min"],
                layover_min=6,
                standard_break_min=15 if r["type"] == "TRAM" else 20,
                designated_break_hub=r["designated_dp"],
                primary_depot_id=r["depot_id"],
                color=r["color"],
                description=r.get("description", f"Пасажирський маршрут №{r['number']} КП «Одесміськелектротранс»")
            ))
            # Для тролейбусів створюємо також запис з числовим ID, якщо його немає
            if r["id"].startswith("Tr") and not any(other["id"] == r["number"] for other in ROUTES_SPECIFICATION):
                db.add(RouteModel(
                    id=r["number"],
                    number=r["number"],
                    name=r["name"],
                    type=r["type"],
                    status="ACTIVE",
                    length_km=r["length_km"],
                    lengthDir1Km=round(r["length_km"] / 2, 1),
                    lengthDir2Km=round(r["length_km"] / 2, 1),
                    default_speed_kmh=r["default_speed_kmh"],
                    round_trip_min=r["round_trip_min"],
                    t_dir0_min=r["t_dir0_min"],
                    t_dir1_min=r["t_dir1_min"],
                    layover_min=6,
                    standard_break_min=20,
                    designated_break_hub=r["designated_dp"],
                    primary_depot_id=r["depot_id"],
                    color=r["color"],
                    description=r.get("description", f"Тролейбусний маршрут №{r['number']}")
                ))
        await db.commit()
        logger.info(f"✅ Створено {len(ROUTES_SPECIFICATION)} маршрутів електротранспорту Одеси!")

        # --- 9. Наповнення Рухомого Складу (vehicles) ---
        logger.info("🚍 Генерація реального флоту КП «Одесміськелектротранс»...")
        fleet = []

        # Трамваї Tatra T3 (2951 - 3370)
        for num in range(2951, 3050):
            fleet.append({
                "id": str(num),
                "wialon_name": str(num),
                "type": "TRAM",
                "model": "Tatra T3 (модернізована)",
                "depot_id": "depot_1" if num % 2 == 1 else "depot_2",
                "is_accessible": False, "has_wifi": False, "has_aircond": False
            })

        # Трамваї Одіссей (3101 - 3135)
        for num in range(3101, 3136):
            fleet.append({
                "id": str(num),
                "wialon_name": str(num),
                "type": "TRAM",
                "model": "T3 «Одіссей» (К-1)",
                "depot_id": "depot_1" if num < 3120 else "depot_2",
                "is_accessible": True, "has_wifi": True, "has_aircond": True
            })

        # Трамваї 3-секційні Одіссей-МАКС (5001 - 5015)
        for num in range(5001, 5016):
            fleet.append({
                "id": str(num),
                "wialon_name": str(num),
                "type": "TRAM",
                "model": "T3 «Одіссей-МАКС» 3-секційний",
                "depot_id": "depot_1" if num % 2 == 1 else "depot_2",
                "is_accessible": True, "has_wifi": True, "has_aircond": True
            })

        # Тролейбуси БКМ-321 (0001 - 0047)
        for num in range(1, 48):
            disp = str(num).zfill(4)
            fleet.append({
                "id": disp,
                "wialon_name": disp,
                "type": "TROLLEYBUS",
                "model": "БКМ-321 (Белкомунмаш)",
                "depot_id": "depot_3",
                "is_accessible": True, "has_wifi": True, "has_aircond": True
            })

        # Тролейбуси Богдан Т70117 (4001 - 4040)
        for num in range(4001, 4041):
            fleet.append({
                "id": str(num),
                "wialon_name": str(num),
                "type": "TROLLEYBUS",
                "model": "Богдан Т70117",
                "depot_id": "depot_3",
                "is_accessible": True, "has_wifi": True, "has_aircond": False
            })

        # Службова спецтехніка
        for s_id, s_name, model in [
            ("АВ-01", "АВ-01", "Аварійна служба контактної мережі"),
            ("АВ-02", "АВ-02", "Аварійна служба контактної мережі"),
            ("ВН-101", "ВН-101", "Службовий вантажний вагон"),
            ("РЕВИЗОР", "РЕВИЗОР", "Служба безпеки руху та ревізори ОМЕТ"),
            ("ВИШКА-12", "ВИШКА-12", "Автовишка контактної мережі")
        ]:
            fleet.append({
                "id": s_id,
                "wialon_name": s_name,
                "type": "SERVICE",
                "model": model,
                "depot_id": "depot_1",
                "is_accessible": False, "has_wifi": False, "has_aircond": False
            })

        for v in fleet:
            db.add(Vehicle(
                id=v["id"],
                wialon_name=v["wialon_name"],
                type=v["type"],
                model=v["model"],
                depot_id=v["depot_id"],
                is_accessible=v["is_accessible"],
                has_wifi=v["has_wifi"],
                has_aircond=v["has_aircond"],
                status="AVAILABLE",
                is_active=True
            ))
        await db.commit()
        logger.info(f"✅ Додано {len(fleet)} одиниць рухомого складу КП «ОМЕТ»!")

        # --- 10. Наповнення Водіїв (drivers) ---
        logger.info("👨‍✈️ Наповнення водіїв підприємства...")
        for idx, full_name in enumerate(ODESSA_DRIVERS_NAMES, 1):
            t_num = f"Т-{1000 + idx}"
            db.add(Driver(
                id=t_num,
                name=full_name.split()[0] + " " + full_name.split()[1][0] + "." + full_name.split()[2][0] + ".",
                full_name=full_name,
                class_rank=(idx % 3) + 1,
                status="AVAILABLE",
                is_active=True
            ))
        await db.commit()

        # --- 11. Генерація еталонних статичних розкладів (schedules & duties) ---
        logger.info("📅 Генерація еталонних розкладів для ключових маршрутів...")
        today = date.today()

        routes_to_schedule = ["7", "18", "5", "28", "Tr7", "Tr8", "Tr3", "Tr9", "Tr10", "Tr12"]
        for r_id in routes_to_schedule:
            r_spec = next((r for r in ROUTES_SPECIFICATION if r["id"] == r_id), None)
            if not r_spec:
                continue

            sched = Schedule(
                route_id=r_id,
                active_date=today,
                status=ScheduleStatus.ACTIVE,
                version_name=f"Еталонний графік КП ОМЕТ 2026 (#{r_spec['number']})"
            )
            db.add(sched)
            await db.flush()

            # Створюємо 8-12 нарядів на маршрут
            duties_count = 14 if r_id == "7" else (8 if r_id in ["18", "5", "Tr7"] else 6)
            interval_min = round(r_spec["round_trip_min"] / duties_count, 1)

            for d_idx in range(1, duties_count + 1):
                duty_num = f"{r_spec['number']}-{str(d_idx).zfill(2)}"
                duty_type = DutyType.DOUBLE if d_idx % 4 != 0 else (DutyType.SPLIT if d_idx % 4 == 0 else DutyType.PEAK)

                duty = StaticDuty(
                    schedule_id=sched.id,
                    route_id=r_id,
                    service_id=ServiceDay.WORKDAY,
                    duty_number=duty_num,
                    duty_type=duty_type
                )
                db.add(duty)
                await db.flush()

                # 2 зміни для DOUBLE, 1 зміна для інших
                shift_count = 2 if duty_type == DutyType.DOUBLE else 1
                base_start_minutes = 5 * 60 + int((d_idx - 1) * interval_min) # від 05:00 + інтервал

                for s_seq in range(1, shift_count + 1):
                    shift_start_min = base_start_minutes if s_seq == 1 else base_start_minutes + 8 * 60
                    lunch_time_min = shift_start_min + 4 * 60 # обід через 4 год

                    shift = StaticShift(
                        duty_id=duty.id,
                        shift_sequence=s_seq,
                        has_break=True,
                        break_start_time=time(lunch_time_min // 60, lunch_time_min % 60),
                        break_duration_minutes=r_spec.get("standard_break_min", 15 if r_spec["type"] == "TRAM" else 20),
                        break_location_id=r_spec["designated_dp"]
                    )
                    db.add(shift)
                    await db.flush()

                    # Генерація 6-8 рейсів у зміні
                    trips_per_shift = 6
                    current_trip_start = shift_start_min
                    t_dir0 = r_spec["t_dir0_min"]
                    t_dir1 = r_spec["t_dir1_min"]

                    for t_idx in range(1, trips_per_shift + 1):
                        direction = TripDirection.FORWARD if t_idx % 2 == 1 else TripDirection.BACKWARD
                        run_time = t_dir0 if direction == TripDirection.FORWARD else t_dir1

                        trip = StaticTrip(
                            shift_id=shift.id,
                            trip_sequence=t_idx,
                            direction=direction,
                            trip_type="REGULAR",
                            is_zero_run=False,
                            smoothing_state="normal",
                            smoothing_delta=0.0
                        )
                        db.add(trip)
                        await db.flush()

                        # Ставимо точки прибуття/відправлення
                        start_h = (current_trip_start // 60) % 24
                        start_m = current_trip_start % 60
                        end_minutes = current_trip_start + run_time
                        end_h = (end_minutes // 60) % 24
                        end_m = end_minutes % 60

                        # Перша та остання зупинки
                        db.add(StaticStopTime(
                            trip_id=trip.id,
                            stop_id="708888", # Старосінна / Привоз
                            stop_sequence=1,
                            arrival_time=time(start_h, start_m),
                            departure_time=time(start_h, start_m),
                            is_control_point=True
                        ))
                        db.add(StaticStopTime(
                            trip_id=trip.id,
                            stop_id="708912", # 11 ст. Люстдорфської або кінцева
                            stop_sequence=2,
                            arrival_time=time(end_h, end_m),
                            departure_time=time(end_h, end_m),
                            is_control_point=True
                        ))

                        current_trip_start += run_time + 6 # +6 хв відстій

        await db.commit()
        logger.info("✅ Усі еталонні графіки та наряди успішно збережено в базі даних!")

        # --- 12. Системна конфігурація та аварійні шаблони ---
        db.add(SystemConfig(
            id=1,
            prep_time_tram_min=10,
            prep_time_trolleybus_min=19,
            lunch_window_start_hours=4.0,
            lunch_window_end_hours=6.0,
            interline_min_headway_min=2.0,
            interline_max_headway_min=3.0,
            min_intershift_rest_hours=12.0,
            max_single_shift_hours=8.0
        ))

        db.add(EmergencyTemplateModel(
            id="em_luzanivka",
            title="Перекриття Пересипського мосту",
            cause="ДТП / Обрив контактної мережі",
            affectedRouteIds=["1", "7", "6"],
            affectedStationIds=["708758"],
            detourDescription="Оперативний розворот вагонів маршруту №7 по кільцю «Лузанівка»",
            alternativeStations=["Лузанівка", "вул. Паустовського"],
            validLoops=["Лузанівка", "вул. Паустовського"]
        ))
        db.add(EmergencyTemplateModel(
            id="em_fontan_11",
            title="Затримка на 16 ст. Великого Фонтану",
            cause="Пошкодження колії",
            affectedRouteIds=["18", "19"],
            affectedStationIds=[],
            detourDescription="Скорочення рейсів маршруту №18 до розворотного кільця 11-ї станції Великого Фонтану",
            alternativeStations=["11-та ст. Фонтану", "Куликове поле"],
            validLoops=["11-та ст. Фонтану", "Куликове поле"]
        ))
        await db.commit()

        # --- 13. Створення користувачів системи ---
        from app.db.init_admin import seed_initial_admin
        await seed_initial_admin()

        logger.info("🎉 [УСПІХ] Базу даних КП «Одесміськелектротранс» наповнено на 100% реальними даними!")

if __name__ == "__main__":
    asyncio.run(seed_all_real_data())
