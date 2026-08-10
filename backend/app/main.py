from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import asyncio

from app.api.routes import router as solver_router
from app.api.websocket import router as ws_router 
from app.api.incidents import router as incidents_router
from app.api.blocks import router as blocks_router 
from app.api.schedule_init import router as schedule_router
from app.api.drivers import router as drivers_router
from app.api.stations import router as stations_router
from app.api.control_points import router as control_points_router
from app.api.settings import router as settings_router
from app.api.emergencies import router as emergencies_router
from app.services.telemetry_worker import telemetry_service
from app.api.websocket import manager as ws_manager
from app.core.database import init_db
from app.core.redis import init_redis, close_redis

# Lifespan контекст для запуску фонових процесів
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ініціалізуємо Redis
    await init_redis()
    
    # Створюємо таблиці БД
    await init_db()
    # Запускаємо воркер Wialon у фоновому режимі при старті сервера
    polling_task = asyncio.create_task(telemetry_service.polling_loop(ws_manager))
    # Запускаємо слухача Redis для WebSocket
    redis_task = asyncio.create_task(ws_manager.listen_to_redis())
    yield
    # При вимкненні сервера скасовуємо завдання
    polling_task.cancel()
    redis_task.cancel()
    
    # Закриваємо з'єднання з Redis
    await close_redis()

app = FastAPI(title="OMET Transit Solver API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(solver_router, prefix="/api/v1/solver", tags=["Transit Solver"])
app.include_router(incidents_router, prefix="/api/v1")
app.include_router(blocks_router, prefix="/api/v1")
app.include_router(schedule_router, prefix="/api/schedule", tags=["Schedule Init"])
app.include_router(drivers_router, prefix="/api/v1")
app.include_router(stations_router, prefix="/api/v1")
app.include_router(control_points_router, prefix="/api/v1")
app.include_router(settings_router, prefix="/api/v1")
app.include_router(emergencies_router, prefix="/api/v1")
app.include_router(ws_router)

# Ендпоінт для перевірки поточного стану телеметрії (для тестування)
@app.get("/api/v1/telemetry", tags=["Telemetry"])
async def get_current_telemetry():
    return telemetry_service.active_vehicles
