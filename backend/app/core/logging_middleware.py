import time
import json
import logging
from typing import Callable
from fastapi import Request, Response, APIRouter
from starlette.middleware.base import BaseHTTPMiddleware
from pydantic import BaseModel

http_logger = logging.getLogger("app.http")
client_logger = logging.getLogger("app.client")

# ANSI кольори
GREEN = "\033[92m"
BLUE = "\033[94m"
YELLOW = "\033[93m"
RED = "\033[91m"
BOLD = "\033[1m"
RESET = "\033[0m"

def get_status_color(status_code: int) -> str:
    if 200 <= status_code < 300:
        return GREEN
    elif 300 <= status_code < 400:
        return BLUE
    elif 400 <= status_code < 500:
        return YELLOW
    return RED

class DetailedRequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware для детального логування кожного HTTP запиту, часу виконання,
    параметрів та помилок у консоль терміналу.
    """
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start_time = time.perf_counter()
        
        # Ігноруємо часті запити перевірки здоров'я або статичні файли при потребі
        path = request.url.path
        if path == "/health" or path.startswith("/assets"):
            return await call_next(request)

        method = request.method
        query_params = str(request.query_params)
        client_ip = request.client.host if request.client else "unknown"
        
        # Логуємо вхідний запит
        query_info = f"?{query_params}" if query_params else ""
        http_logger.debug(f"--> {BOLD}{method}{RESET} {path}{query_info} [Client: {client_ip}]")

        try:
            response = await call_next(request)
            elapsed_ms = (time.perf_counter() - start_time) * 1000
            
            status_code = response.status_code
            color = get_status_color(status_code)
            
            # Рівень логування залежно від статусу
            log_msg = f"<-- {color}{BOLD}{status_code}{RESET} {method} {path}{query_info} ({elapsed_ms:.1f}ms)"
            
            if status_code >= 500:
                http_logger.error(log_msg)
            elif status_code >= 400:
                http_logger.warning(log_msg)
            else:
                http_logger.info(log_msg)

            return response
        except Exception as exc:
            elapsed_ms = (time.perf_counter() - start_time) * 1000
            http_logger.error(
                f"<-- {RED}{BOLD}500 EXCEPTION{RESET} {method} {path}{query_info} ({elapsed_ms:.1f}ms): {exc}",
                exc_info=True
            )
            raise exc

# Роутер для отримання клієнтських логів з браузера в термінал
logs_router = APIRouter(prefix="/logs", tags=["System & Client Diagnostics"])

class ClientLogEntry(BaseModel):
    level: str # DEBUG, INFO, WARN, ERROR
    message: str
    context: dict | None = None
    stack: str | None = None
    url: str | None = None

@logs_router.post("/client")
async def receive_client_log(entry: ClientLogEntry):
    """
    Приймає діагностичні логи з фронтенду та друкує їх безпосередньо в командний рядок.
    """
    ctx_str = f" | {json.dumps(entry.context, ensure_ascii=False)}" if entry.context else ""
    url_str = f" [{entry.url}]" if entry.url else ""
    full_msg = f"{entry.message}{ctx_str}{url_str}"
    
    lvl = entry.level.upper()
    if lvl == "ERROR":
        client_logger.error(f"{RED}{full_msg}{RESET}" + (f"\n{entry.stack}" if entry.stack else ""))
    elif lvl in ("WARN", "WARNING"):
        client_logger.warning(f"{YELLOW}{full_msg}{RESET}")
    elif lvl == "DEBUG":
        client_logger.debug(full_msg)
    else:
        client_logger.info(f"{full_msg}")
    
    return {"status": "logged"}
