from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy import text
from app.core.config import settings
from app.models.models import Base

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
)

AsyncSessionLocal = async_sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

async_session_maker = AsyncSessionLocal

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
        # Автоматична міграція нових колонок
        migration_statements = [
            "ALTER TABLE dispatchers ADD COLUMN IF NOT EXISTS role VARCHAR DEFAULT 'DISPATCHER'",
            "ALTER TABLE schedules ADD COLUMN IF NOT EXISTS version_name VARCHAR DEFAULT 'Еталонний розклад'",
            "ALTER TABLE static_shifts ADD COLUMN IF NOT EXISTS vehicle_id VARCHAR",
            "ALTER TABLE static_shifts ADD COLUMN IF NOT EXISTS break_location_id VARCHAR",
            "ALTER TABLE static_trips ADD COLUMN IF NOT EXISTS trip_type VARCHAR DEFAULT 'REGULAR'",
            "ALTER TABLE static_trips ADD COLUMN IF NOT EXISTS is_zero_run BOOLEAN DEFAULT FALSE",
            "ALTER TABLE static_stop_times ADD COLUMN IF NOT EXISTS is_control_point BOOLEAN DEFAULT FALSE",
            "ALTER TABLE waybills ADD COLUMN IF NOT EXISTS shift_sequence INTEGER DEFAULT 1",
            "ALTER TABLE waybills ADD COLUMN IF NOT EXISTS dispatcher_id INTEGER",
            "ALTER TABLE waybills ADD COLUMN IF NOT EXISTS actual_start_time TIME",
            "ALTER TABLE waybills ADD COLUMN IF NOT EXISTS actual_end_time TIME",
            "ALTER TABLE waybills ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP",
            "ALTER TABLE emergency_templates ADD COLUMN IF NOT EXISTS validLoops JSON",
            "ALTER TABLE active_detours ADD COLUMN IF NOT EXISTS target_loop VARCHAR",
            "ALTER TABLE active_detours ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ",
            "ALTER TABLE stations ADD COLUMN IF NOT EXISTS is_dispatch_station BOOLEAN DEFAULT FALSE",
            "ALTER TABLE stations ADD COLUMN IF NOT EXISTS break_capacity INTEGER DEFAULT 0",
            "ALTER TABLE eta_logs ADD COLUMN IF NOT EXISTS vehicle_id VARCHAR",
            "ALTER TABLE eta_logs ADD COLUMN IF NOT EXISTS route_id VARCHAR",
            "ALTER TABLE eta_logs ADD COLUMN IF NOT EXISTS stop_id VARCHAR",
            "ALTER TABLE eta_logs ADD COLUMN IF NOT EXISTS deviation_min FLOAT DEFAULT 0.0",
            "ALTER TABLE eta_logs ADD COLUMN IF NOT EXISTS recorded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP",
            "ALTER TABLE incident_logs ADD COLUMN IF NOT EXISTS vehicle_id VARCHAR",
            "ALTER TABLE incident_logs ADD COLUMN IF NOT EXISTS route_id VARCHAR",
            "ALTER TABLE incident_logs ADD COLUMN IF NOT EXISTS description VARCHAR",
            "ALTER TABLE incident_logs ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'NEW'",
            "ALTER TABLE incident_logs ADD COLUMN IF NOT EXISTS source VARCHAR DEFAULT 'SYSTEM'",
            "ALTER TABLE incident_logs ADD COLUMN IF NOT EXISTS resolution_notes VARCHAR",
            "ALTER TABLE incident_logs ADD COLUMN IF NOT EXISTS recorded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP",
            "ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS type VARCHAR DEFAULT 'tram'",
            "ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS model VARCHAR DEFAULT 'Tatra T3'",
            "ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'AVAILABLE'",
            "ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE",
            "ALTER TABLE drivers ADD COLUMN IF NOT EXISTS full_name VARCHAR",
            "ALTER TABLE drivers ADD COLUMN IF NOT EXISTS class_rank INTEGER DEFAULT 1",
            "ALTER TABLE drivers ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'AVAILABLE'",
            "ALTER TABLE routes ADD COLUMN IF NOT EXISTS color VARCHAR",
            "ALTER TABLE routes ADD COLUMN IF NOT EXISTS length_km FLOAT DEFAULT 10.5",
            "ALTER TABLE routes ADD COLUMN IF NOT EXISTS default_speed_kmh FLOAT DEFAULT 14.5",
        ]
        for stmt in migration_statements:
            try:
                await conn.execute(text(stmt))
            except Exception:
                pass

        # Наповнення базовими депо Одеси
        try:
            await conn.execute(text("""
                INSERT INTO depots (id, name, type, address, lat, lng, prepTimeMin)
                SELECT id, name, type, address, lat, lng, prepTimeMin FROM (
                    VALUES 
                        ('depot_tram_1', 'Трамвайне депо №1 (ОМЕТ)', 'TRAM', 'вул. Водопровідна, 1', 46.467810, 30.733415, 10),
                        ('depot_tram_2', 'Трамвайне депо №2 (ОМЕТ)', 'TRAM', 'вул. 1-ша Заливна, 26', 46.512400, 30.738900, 10),
                        ('depot_trolley_1', 'Тролейбусне депо (ОМЕТ)', 'TROLLEYBUS', 'вул. Івана та Юрія Лип, 1', 46.442100, 30.701200, 19)
                ) AS new_depots (id, name, type, address, lat, lng, prepTimeMin)
                WHERE NOT EXISTS (SELECT 1 FROM depots LIMIT 1);
            """))
        except Exception:
            pass

        # Додавання демо-водіїв та рухомого складу якщо таблиці порожні
        try:
            await conn.execute(text("""
                INSERT INTO drivers (id, full_name, name, class_rank, status, is_active)
                SELECT id, full_name, name, class_rank, status, is_active FROM (
                    VALUES 
                        ('1', 'Коваленко Олександр Сергійович', 'Коваленко О.С.', 1, 'AVAILABLE', true),
                        ('2', 'Петренко Іван Васильович', 'Петренко І.В.', 2, 'AVAILABLE', true),
                        ('3', 'Мельник Олена Миколаївна', 'Мельник О.М.', 1, 'AVAILABLE', true),
                        ('4', 'Шевченко Дмитро Андрійович', 'Шевченко Д.А.', 3, 'AVAILABLE', true),
                        ('5', 'Бондаренко Сергій Павлович', 'Бондаренко С.П.', 1, 'AVAILABLE', true),
                        ('6', 'Ткаченко Василь Ігорович', 'Ткаченко В.І.', 2, 'AVAILABLE', true),
                        ('7', 'Григоренко Віктор Олексійович', 'Григоренко В.О.', 1, 'AVAILABLE', true),
                        ('8', 'Савченко Марина Іванівна', 'Савченко М.І.', 2, 'AVAILABLE', true)
                ) AS new_drivers (id, full_name, name, class_rank, status, is_active)
                WHERE NOT EXISTS (SELECT 1 FROM drivers LIMIT 1);
            """))
            await conn.execute(text("""
                INSERT INTO vehicles (id, type, model, status, is_active, depot_id)
                SELECT id, type, model, status, is_active, depot_id FROM (
                    VALUES 
                        ('3012', 'tram', 'Tatra-Юг К1Т306', 'AVAILABLE', true, 'depot_tram_1'),
                        ('3014', 'tram', 'Tatra T3 Одіссей', 'AVAILABLE', true, 'depot_tram_1'),
                        ('3018', 'tram', 'Tatra T3 Одіссей-МАКС', 'AVAILABLE', true, 'depot_tram_1'),
                        ('4015', 'tram', 'Tatra T3', 'AVAILABLE', true, 'depot_tram_1'),
                        ('4020', 'tram', 'Tatra T3', 'AVAILABLE', true, 'depot_tram_1'),
                        ('5001', 'tram', 'Tatra T3', 'AVAILABLE', true, 'depot_tram_2'),
                        ('5005', 'trolleybus', 'БКМ 321', 'AVAILABLE', true, 'depot_trolley_1'),
                        ('5008', 'trolleybus', 'БКМ 321', 'AVAILABLE', true, 'depot_trolley_1'),
                        ('5012', 'trolleybus', 'Богдан Т70117', 'AVAILABLE', true, 'depot_trolley_1'),
                        ('9901', 'electrobus', 'Електрон Е191', 'AVAILABLE', true, 'depot_trolley_1')
                ) AS new_vehicles (id, type, model, status, is_active, depot_id)
                WHERE NOT EXISTS (SELECT 1 FROM vehicles LIMIT 1);
            """))
        except Exception:
            pass
