import logging
import sys
import os
from datetime import datetime

# ANSI кольори для терміналу
RESET = "\033[0m"
BOLD = "\033[1m"
DIM = "\033[2m"

# Кольори тексту
BLACK = "\033[30m"
RED = "\033[31m"
GREEN = "\033[32m"
YELLOW = "\033[33m"
BLUE = "\033[34m"
MAGENTA = "\033[35m"
CYAN = "\033[36m"
WHITE = "\033[37m"

# Яскраві кольори
BRIGHT_RED = "\033[91m"
BRIGHT_GREEN = "\033[92m"
BRIGHT_YELLOW = "\033[93m"
BRIGHT_BLUE = "\033[94m"
BRIGHT_MAGENTA = "\033[95m"
BRIGHT_CYAN = "\033[96m"
BRIGHT_WHITE = "\033[97m"

# Фоновий колір
BG_RED = "\033[41m"
BG_YELLOW = "\033[43m"
BG_BLUE = "\033[44m"

LEVEL_COLORS = {
    logging.DEBUG: f"{DIM}{CYAN}DEBUG{RESET}",
    logging.INFO: f"{BRIGHT_GREEN}INFO {RESET}",
    logging.WARNING: f"{BRIGHT_YELLOW}{BOLD}WARN {RESET}",
    logging.ERROR: f"{BRIGHT_RED}{BOLD}ERROR{RESET}",
    logging.CRITICAL: f"{BG_RED}{WHITE}{BOLD}CRIT {RESET}",
}

MODULE_COLORS = {
    "app.main": f"{BRIGHT_BLUE}[APP.MAIN]{RESET}",
    "app.http": f"{BRIGHT_CYAN}[HTTP.REQ]{RESET}",
    "app.transit_solver": f"{BRIGHT_MAGENTA}[SOLVER.MATH]{RESET}",
    "app.schedules": f"{BLUE}[SCHEDULES]{RESET}",
    "app.waybills": f"{GREEN}[WAYBILLS]{RESET}",
    "app.realtime_fetcher": f"{YELLOW}[GTFS.RT]{RESET}",
    "app.telemetry_worker": f"{BRIGHT_YELLOW}[TELEMETRY]{RESET}",
    "app.websocket": f"{CYAN}[WEBSOCKET]{RESET}",
    "app.database": f"{MAGENTA}[DATABASE]{RESET}",
    "app.redis": f"{RED}[REDIS.CACHE]{RESET}",
    "app.auth": f"{BRIGHT_WHITE}[AUTH.JWT]{RESET}",
    "app.client": f"{BRIGHT_CYAN}{BOLD}[CLIENT.UI]{RESET}",
}

class ColoredFormatter(logging.Formatter):
    """
    Кастомний форматер логів для командної строки з кольоровою розміткою,
    мікросекундами, модулями та виділенням контексту.
    """
    def __init__(self, use_colors: bool = True):
        super().__init__()
        self.use_colors = use_colors and sys.stdout.isatty()

    def format(self, record: logging.LogRecord) -> str:
        # 1. Час
        dt = datetime.fromtimestamp(record.created)
        time_str = dt.strftime("%H:%M:%S") + f".{int(dt.microsecond / 1000):03d}"
        if self.use_colors:
            time_formatted = f"{DIM}{time_str}{RESET}"
        else:
            time_formatted = time_str

        # 2. Рівень
        level_formatted = LEVEL_COLORS.get(record.levelno, record.levelname) if self.use_colors else f"[{record.levelname:<5}]"

        # 3. Модуль
        mod_name = record.name
        if self.use_colors:
            mod_formatted = MODULE_COLORS.get(mod_name, f"{BOLD}{BLUE}[{mod_name.upper()}]{RESET}")
        else:
            mod_formatted = f"[{mod_name}]"

        # 4. Повідомлення
        msg = record.getMessage()

        # 5. Винятки (Traceback)
        exc_text = ""
        if record.exc_info:
            if not record.exc_text:
                record.exc_text = self.formatException(record.exc_info)
            if record.exc_text:
                if self.use_colors:
                    exc_text = f"\n{RED}{record.exc_text}{RESET}"
                else:
                    exc_text = f"\n{record.exc_text}"

        return f"{time_formatted} {level_formatted} {mod_formatted} {msg}{exc_text}"


def setup_logging(log_level: str = "INFO"):
    """
    Ініціалізує глобальну систему деталізованого логування для бекенду.
    """
    numeric_level = getattr(logging, log_level.upper(), logging.INFO)

    root_logger = logging.getLogger()
    root_logger.setLevel(numeric_level)

    # Видаляємо старі хендлери
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)

    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(numeric_level)
    console_handler.setFormatter(ColoredFormatter(use_colors=True))
    root_logger.addHandler(console_handler)

    # Налаштовуємо логери бібліотек щоб не засмічувати вивід зайвим
    logging.getLogger("uvicorn.access").handlers = []
    logging.getLogger("uvicorn.access").propagate = False
    logging.getLogger("watchfiles").setLevel(logging.WARNING)
    logging.getLogger("asyncio").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)

    # Головний логер додатку
    logger = logging.getLogger("app.main")
    logger.info("🚀 Деталізовану систему діагностичних логів активовано")
    return root_logger

def get_logger(name: str) -> logging.Logger:
    """Отримати іменований логер для підсистеми."""
    return logging.getLogger(f"app.{name}" if not name.startswith("app.") else name)
