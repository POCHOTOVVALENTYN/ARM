import os
import logging
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy import text
from app.core.config import settings
from app.models.models import Base

logger = logging.getLogger("app.database")

# Шлях до локальної БД SQLite (omet.db)
root_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sqlite_db_path = os.path.join(root_dir, "omet.db")
SQLITE_URL = f"sqlite+aiosqlite:///{sqlite_db_path}"

# Якщо DATABASE_URL містить postgresql, але ми запускаємося локально без запущеного контейнера PostgreSQL
selected_url = settings.DATABASE_URL

def get_engine():
    global selected_url
    try:
        return create_async_engine(selected_url, echo=False)
    except Exception:
        selected_url = SQLITE_URL
        return create_async_engine(selected_url, echo=False)

engine = get_engine()
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
async_session_maker = AsyncSessionLocal

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

async def init_db():
    global engine, AsyncSessionLocal, async_session_maker, selected_url
    
    # Спроба ініціалізації через поточний URL
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
            logger.info(f"✅ Базу даних успішно ініціалізовано ({selected_url})")
    except Exception as e:
        logger.warning(f"⚠️ Не вдалося підключитися до {selected_url} ({e}). Перемикаємось на SQLite: {SQLITE_URL}")
        selected_url = SQLITE_URL
        engine = create_async_engine(SQLITE_URL, echo=False)
        AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
        async_session_maker = AsyncSessionLocal
        
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
            logger.info("✅ Локальну базу SQLite (omet.db) успішно ініціалізовано")

    # Автоматичні міграції нових колонок (SQLite / PostgreSQL)
    migration_statements = [
        "ALTER TABLE dispatchers ADD COLUMN role VARCHAR DEFAULT 'DISPATCHER'",
        "ALTER TABLE schedules ADD COLUMN version_name VARCHAR DEFAULT 'Еталонний розклад'",
        "ALTER TABLE static_shifts ADD COLUMN vehicle_id VARCHAR",
        "ALTER TABLE static_shifts ADD COLUMN break_location_id VARCHAR",
        "ALTER TABLE static_trips ADD COLUMN trip_type VARCHAR DEFAULT 'REGULAR'",
        "ALTER TABLE static_trips ADD COLUMN is_zero_run BOOLEAN DEFAULT FALSE",
        "ALTER TABLE static_stop_times ADD COLUMN is_control_point BOOLEAN DEFAULT FALSE",
        "ALTER TABLE waybills ADD COLUMN shift_sequence INTEGER DEFAULT 1",
        "ALTER TABLE waybills ADD COLUMN dispatcher_id INTEGER",
        "ALTER TABLE waybills ADD COLUMN actual_start_time TIME",
        "ALTER TABLE waybills ADD COLUMN actual_end_time TIME",
        "ALTER TABLE waybills ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
        'ALTER TABLE emergency_templates ADD COLUMN IF NOT EXISTS "validLoops" JSON',
        "ALTER TABLE emergency_templates ADD COLUMN validLoops JSON",
        "ALTER TABLE active_detours ADD COLUMN target_loop VARCHAR",
        "ALTER TABLE active_detours ADD COLUMN ended_at TIMESTAMP",
        "ALTER TABLE stations ADD COLUMN lat FLOAT",
        "ALTER TABLE stations ADD COLUMN lon FLOAT",
        "ALTER TABLE stations ADD COLUMN lng FLOAT",
        "ALTER TABLE stations ADD COLUMN is_dispatch_station BOOLEAN DEFAULT FALSE",
        "ALTER TABLE stations ADD COLUMN break_capacity INTEGER DEFAULT 0",
        "ALTER TABLE eta_logs ADD COLUMN vehicle_id VARCHAR",
        "ALTER TABLE eta_logs ADD COLUMN route_id VARCHAR",
        "ALTER TABLE eta_logs ADD COLUMN stop_id VARCHAR",
        "ALTER TABLE eta_logs ADD COLUMN deviation_min FLOAT DEFAULT 0.0",
        "ALTER TABLE incident_logs ADD COLUMN vehicle_id VARCHAR",
        "ALTER TABLE incident_logs ADD COLUMN route_id VARCHAR",
        "ALTER TABLE incident_logs ADD COLUMN description VARCHAR",
        "ALTER TABLE incident_logs ADD COLUMN status VARCHAR DEFAULT 'NEW'",
        "ALTER TABLE incident_logs ADD COLUMN source VARCHAR DEFAULT 'SYSTEM'",
        "ALTER TABLE incident_logs ADD COLUMN resolution_notes VARCHAR",
        "ALTER TABLE vehicles ADD COLUMN type VARCHAR DEFAULT 'tram'",
        "ALTER TABLE vehicles ADD COLUMN model VARCHAR DEFAULT 'Tatra T3'",
        "ALTER TABLE vehicles ADD COLUMN status VARCHAR DEFAULT 'AVAILABLE'",
        "ALTER TABLE vehicles ADD COLUMN is_active BOOLEAN DEFAULT TRUE",
        "ALTER TABLE drivers ADD COLUMN full_name VARCHAR",
        "ALTER TABLE drivers ADD COLUMN class_rank INTEGER DEFAULT 1",
        "ALTER TABLE drivers ADD COLUMN status VARCHAR DEFAULT 'AVAILABLE'",
        "ALTER TABLE routes ADD COLUMN color VARCHAR",
        "ALTER TABLE routes ADD COLUMN length_km FLOAT DEFAULT 10.5",
        "ALTER TABLE routes ADD COLUMN default_speed_kmh FLOAT DEFAULT 14.5",
    ]
    for stmt in migration_statements:
        try:
            async with engine.begin() as conn:
                await conn.execute(text(stmt))
        except Exception:
            pass
