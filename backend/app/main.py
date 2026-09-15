from fastapi import FastAPI, Request, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.exceptions import RequestValidationError, HTTPException as FastAPIHTTPException
from starlette.exceptions import HTTPException as StarletteHTTPException
from contextlib import asynccontextmanager
import asyncio
import logging

from app.api.routes import router as solver_router
from app.api.websocket import router as ws_router, ws_manager
from app.api.incidents import router as incidents_router
from app.api.schedule_init import router as schedule_router
from app.api.drivers import router as drivers_router
from app.api.stations import router as stations_router
from app.api.control_points import router as control_points_router
from app.api.settings import router as settings_router
from app.api.emergencies import router as emergencies_router
from app.api.schedules import router as new_schedules_router
from app.api.auth import router as auth_router
from app.api.duty_types import router as duty_types_router
from app.api.shifts import router as shifts_router
from app.api.analytics import router as analytics_router
from app.api.depots import router as depots_router
from app.api.deadhead import router as deadhead_router
from app.api.waybills import router as waybills_router
from app.api.driver_communication import router as driver_comm_router
from app.api.dispatch_orders import router as dispatch_orders_router
from app.api.telemetry import router as telemetry_router
from app.api.easyway import router as easyway_router
from app.services.realtime_fetcher import fetch_and_process_realtime_data
from app.core.database import init_db
from app.core.redis import init_redis, close_redis
from app.core.config import settings
from app.db.init_admin import seed_initial_admin
from app.db.seed_fleet_and_depots import seed_depots_and_fleet
from app.core.logging_config import setup_logging, get_logger
from app.core.logging_middleware import DetailedRequestLoggingMiddleware, logs_router

from app.services.air_raid_worker import run_air_raid_monitor

# Ініціалізація розширеного кольорового логування
setup_logging(log_level="INFO")
logger = get_logger("main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("⚡ Запуск підсистем АРМ Диспетчера ОМЕТ...")
    # 1. Ініціалізуємо Redis
    await init_redis()
    
    # 2. Створюємо таблиці БД, початкового адміна та реєстр депо і флоту
    await init_db()
    await seed_initial_admin()
    await seed_depots_and_fleet()

    # 3. Запускаємо бойовий збір телеметрії (EasyWay / Wialon / GTFS-RT)
    telemetry_task = asyncio.create_task(fetch_and_process_realtime_data())
    logger.info("📡 Фоновий сервіс телеметрії GTFS-RT успішно запущено")
    
    # 4. Запускаємо автоматичний моніторинг повітряної тривоги
    air_raid_task = asyncio.create_task(run_air_raid_monitor())
    logger.info("🚨 Фоновий сервіс авто-моніторингу тривог успішно запущено")

    yield
    
    # 5. При вимкненні сервера коректно скасовуємо фонові задачі
    telemetry_task.cancel()
    air_raid_task.cancel()
    try:
        await asyncio.gather(telemetry_task, air_raid_task, return_exceptions=True)
    except Exception:
        pass
    
    # 6. Закриваємо з'єднання з Redis
    await close_redis()
    logger.info("🛑 Сервер успішно зупинено")

app = FastAPI(title="OMET Dispatch & Schedules API", version="2.5.0", lifespan=lifespan)

# Діагностичний middleware для логування кожного запиту
app.add_middleware(DetailedRequestLoggingMiddleware)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# CORS конфігурація
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_origin_regex=r"^https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers={
            **(getattr(exc, "headers", None) or {}),
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": "true",
        }
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": exc.errors()},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": "true",
        }
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    if isinstance(exc, (FastAPIHTTPException, StarletteHTTPException)):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail},
            headers={
                **(getattr(exc, "headers", None) or {}),
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Credentials": "true",
            }
        )
    if isinstance(exc, RequestValidationError):
        return JSONResponse(
            status_code=422,
            content={"detail": exc.errors()},
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Credentials": "true",
            }
        )
    logger.error(f"Global unhandled exception on {request.method} {request.url}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": f"Внутрішня помилка сервера: {str(exc)}"},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": "true",
        }
    )

# Логи клієнта та системна діагностика
app.include_router(logs_router, prefix="/api")
app.include_router(logs_router, prefix="/api/v1")
app.include_router(logs_router, prefix="")

# --- ПІДКЛЮЧЕННЯ РОУТЕРІВ (/api/v1 та аліаси для сумісності) ---

# Автентифікація та користувачі
app.include_router(auth_router, prefix="/api/v1")
app.include_router(auth_router, prefix="/api")
app.include_router(auth_router, prefix="")

# Довідник типів нарядів
app.include_router(duty_types_router, prefix="/api/v1")
app.include_router(duty_types_router, prefix="/api")
app.include_router(duty_types_router, prefix="")

# Двосторонній зв'язок Диспетчер <-> Водій
app.include_router(driver_comm_router, prefix="/api/v1")
app.include_router(driver_comm_router, prefix="/api")
app.include_router(driver_comm_router, prefix="")

# Жива телеметрія, Wialon та EasyWay API
app.include_router(telemetry_router, prefix="/api/v1")
app.include_router(telemetry_router, prefix="/api")
app.include_router(telemetry_router, prefix="")
app.include_router(easyway_router, prefix="/api/v1")
app.include_router(easyway_router, prefix="/api")
app.include_router(easyway_router, prefix="")

# Розклади та математичне ядро
app.include_router(new_schedules_router, prefix="/api/v1")
app.include_router(new_schedules_router, prefix="/api")
app.include_router(new_schedules_router, prefix="")
app.include_router(solver_router, prefix="/api/v1/routes", tags=["Routes"])
app.include_router(solver_router, prefix="/api/routes", tags=["Routes"])
app.include_router(solver_router, prefix="/routes", tags=["Routes"])
app.include_router(solver_router, prefix="/api/v1/solver", tags=["Transit Solver"])
app.include_router(solver_router, prefix="/api/solver", tags=["Transit Solver"])
app.include_router(solver_router, prefix="/solver", tags=["Transit Solver"])

# Електронні путівки (Smart Waybill), Кадри та Зміни Водіїв (Run Cutting)
app.include_router(shifts_router, prefix="/api/v1")
app.include_router(shifts_router, prefix="/api")
app.include_router(shifts_router, prefix="")
app.include_router(waybills_router, prefix="/api/v1")
app.include_router(waybills_router, prefix="/api")
app.include_router(waybills_router, prefix="")
app.include_router(drivers_router, prefix="/api/v1")
app.include_router(drivers_router, prefix="/api")
app.include_router(drivers_router, prefix="")

# Інциденти, НС та оперативні перемикання
app.include_router(incidents_router, prefix="/api/v1")
app.include_router(incidents_router, prefix="/api")
app.include_router(incidents_router, prefix="")
app.include_router(emergencies_router, prefix="/api/v1")
app.include_router(emergencies_router, prefix="/api")
app.include_router(emergencies_router, prefix="")
app.include_router(dispatch_orders_router, prefix="/api/v1")
app.include_router(dispatch_orders_router, prefix="/api")
app.include_router(dispatch_orders_router, prefix="")

# Інфраструктура, Депо, Станції, Хаби, Аналітика
app.include_router(depots_router, prefix="/api/v1")
app.include_router(depots_router, prefix="/api")
app.include_router(depots_router, prefix="")
app.include_router(deadhead_router, prefix="/api/v1")
app.include_router(deadhead_router, prefix="/api")
app.include_router(deadhead_router, prefix="")
app.include_router(stations_router, prefix="/api/v1")
app.include_router(stations_router, prefix="/api")
app.include_router(stations_router, prefix="")
app.include_router(control_points_router, prefix="/api/v1/control-points")
app.include_router(control_points_router, prefix="/api/control-points")
app.include_router(control_points_router, prefix="/api/v1/control_points")
app.include_router(control_points_router, prefix="/api/control_points")
app.include_router(control_points_router, prefix="/control-points")
app.include_router(control_points_router, prefix="/control_points")
app.include_router(settings_router, prefix="/api/v1")
app.include_router(settings_router, prefix="/api")
app.include_router(settings_router, prefix="")
app.include_router(analytics_router, prefix="/api/v1")
app.include_router(analytics_router, prefix="/api")
app.include_router(analytics_router, prefix="")

# Ініціалізація статичних даних (Legacy compatibility)
app.include_router(schedule_router, prefix="/api/v1")
app.include_router(schedule_router, prefix="/api")
app.include_router(schedule_router, prefix="")

# WebSocket маршрути
app.include_router(ws_router)
