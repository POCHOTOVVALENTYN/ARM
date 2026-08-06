from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import asyncio

from app.api.routes import router as solver_router
from app.api.websocket import router as ws_router # <--- ДОДАНО 07.08.2026
from app.services.telemetry_worker import telemetry_service
from app.api.websocket import manager as ws_manager # <--- ДОДАНО 07.08.2026

# Lifespan контекст для запуску фонових процесів
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Запускаємо воркер Wialon у фоновому режимі при старті сервера
    polling_task = asyncio.create_task(telemetry_service.polling_loop())
    yield
    # При вимкненні сервера скасовуємо завдання
    polling_task.cancel()

app = FastAPI(title="OMET Transit Solver API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(solver_router, prefix="/api/v1/solver", tags=["Transit Solver"])
app.include_router(ws_router) # <--- ДОДАНО 07.08.2026

# Ендпоінт для перевірки поточного стану телеметрії (для тестування)
@app.get("/api/v1/telemetry", tags=["Telemetry"])
async def get_current_telemetry():
    return telemetry_service.active_vehicles
