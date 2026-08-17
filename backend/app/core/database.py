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
        
        # Автоматична міграція нових колонок для eta_logs, incident_logs, drivers, vehicles, driver_duties
        migration_statements = [
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
            "ALTER TABLE driver_duties ADD COLUMN IF NOT EXISTS duty_id INTEGER",
            "ALTER TABLE driver_duties ADD COLUMN IF NOT EXISTS driver_id INTEGER",
            "ALTER TABLE driver_duties ADD COLUMN IF NOT EXISTS vehicle_id VARCHAR",
            "ALTER TABLE driver_duties ADD COLUMN IF NOT EXISTS target_date DATE",
            "ALTER TABLE driver_duties ADD COLUMN IF NOT EXISTS dispatcher_id INTEGER",
            "ALTER TABLE stations ADD COLUMN IF NOT EXISTS lng FLOAT",
            "ALTER TABLE stations ADD COLUMN IF NOT EXISTS lon FLOAT",
            "ALTER TABLE routes ADD COLUMN IF NOT EXISTS color VARCHAR",
            "ALTER TABLE driver_duties ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'ASSIGNED'",
        ]
        for stmt in migration_statements:
            try:
                await conn.execute(text(stmt))
            except Exception:
                pass

        # Додавання демо-водіїв та рухомого складу якщо таблиці порожні
        try:
            await conn.execute(text("""
                INSERT INTO drivers (full_name, name, class_rank, status, is_active)
                SELECT full_name, name, class_rank, status, is_active FROM (
                    VALUES 
                        ('Коваленко Олександр Сергійович', 'Коваленко О.С.', 1, 'AVAILABLE', true),
                        ('Петренко Іван Васильович', 'Петренко І.В.', 2, 'AVAILABLE', true),
                        ('Мельник Олена Миколаївна', 'Мельник О.М.', 1, 'AVAILABLE', true),
                        ('Шевченко Дмитро Андрійович', 'Шевченко Д.А.', 3, 'AVAILABLE', true),
                        ('Бондаренко Сергій Павлович', 'Бондаренко С.П.', 1, 'AVAILABLE', true),
                        ('Ткаченко Василь Ігорович', 'Ткаченко В.І.', 2, 'AVAILABLE', true)
                ) AS new_drivers (full_name, name, class_rank, status, is_active)
                WHERE NOT EXISTS (SELECT 1 FROM drivers LIMIT 1);
            """))
            await conn.execute(text("""
                INSERT INTO vehicles (id, type, model, status, is_active)
                SELECT id, type, model, status, is_active FROM (
                    VALUES 
                        ('3012', 'tram', 'Tatra-Юг К1Т306', 'AVAILABLE', true),
                        ('3014', 'tram', 'Tatra T3 Одіссей', 'AVAILABLE', true),
                        ('3018', 'tram', 'Tatra T3 Одіссей-МАКС', 'AVAILABLE', true),
                        ('4015', 'tram', 'Tatra T3', 'AVAILABLE', true),
                        ('4020', 'tram', 'Tatra T3', 'AVAILABLE', true),
                        ('5001', 'tram', 'Tatra T3', 'AVAILABLE', true),
                        ('5005', 'trolleybus', 'БКМ 321', 'AVAILABLE', true),
                        ('9901', 'electrobus', 'Електрон Е191', 'AVAILABLE', true)
                ) AS new_vehicles (id, type, model, status, is_active)
                WHERE NOT EXISTS (SELECT 1 FROM vehicles LIMIT 1);
            """))
        except Exception:
            pass

