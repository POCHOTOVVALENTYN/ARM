from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    T_PREP_TRAM: int = 10  # хв підготовчого часу для трамваїв
    T_PREP_TROLLEYBUS: int = 19  # хв для тролейбусів
    MAX_SHIFT_MINUTES: int = 10 * 60  # 10 годин ліміт зміни
    MIN_BREAK_WINDOW_MINUTES: int = 4 * 60  # обід не раніше 4 год
    MAX_BREAK_WINDOW_MINUTES: int = 6 * 60  # обід не пізніше 6 год
    DEFAULT_SAFETY_HEADWAY: int = 2  # 2 хв буфер між вагонами
    
    #Wialon Settings
    WIALON_HOST: str = "https://hst-api.wialon.com/wialon/ajax.html"
    WIALON_TOKEN: str = "YOUR_WIALON_TOKEN_HERE" # Замініть на реальний токен
    POLLING_INTERVAL_SEC: int = 10
    
    # Anti-EW (Анти-РЕБ) Settings
    MAX_VALID_SPEED_KMH: float = 100.0  # Максимальна фізично можлива швидкість трамвая/тролейбуса
    OFFLINE_TIMEOUT_SEC: int = 180  # 3 хвилини без валідних даних = статус OFFLINE

    # Geofence Settings (Депо 1)
    DEPOT_EXIT_LAT: float = 46.467810
    DEPOT_EXIT_LON: float = 30.733415
    DEPOT_ENTRY_LAT: float = 46.467022
    DEPOT_ENTRY_LON: float = 30.736664
    DEPOT_RADIUS_KM: float = 0.05  # 50 метрів радіус для воріт

    DATABASE_URL: str = "postgresql+asyncpg://omet_user:omet_password@localhost:5432/omet_db"
    REDIS_URL: str = "redis://localhost:6379/0"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

settings = Settings()
