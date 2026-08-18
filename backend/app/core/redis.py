import redis.asyncio as redis
from app.core.config import settings
import json
import logging
from typing import Any, Optional, Dict

logger = logging.getLogger("app.redis")

class InMemoryRedisFallback:
    """Резервне in-memory сховище, якщо Redis сервер не запущено локально."""
    def __init__(self):
        self._store: Dict[str, Any] = {}
        self._hashes: Dict[str, Dict[str, Any]] = {}

    async def get(self, key: str) -> Optional[str]:
        return self._store.get(key)

    async def set(self, key: str, value: str, ex: Optional[int] = None) -> bool:
        self._store[key] = str(value)
        return True

    async def delete(self, *keys: str) -> int:
        count = 0
        for k in keys:
            if k in self._store:
                del self._store[k]
                count += 1
            if k in self._hashes:
                del self._hashes[k]
                count += 1
        return count

    async def exists(self, key: str) -> int:
        return 1 if (key in self._store or key in self._hashes) else 0

    async def hset(self, name: str, key: str, value: str) -> int:
        if name not in self._hashes:
            self._hashes[name] = {}
        self._hashes[name][key] = str(value)
        return 1

    async def hget(self, name: str, key: str) -> Optional[str]:
        return self._hashes.get(name, {}).get(key)

    async def hgetall(self, name: str) -> Dict[str, str]:
        return self._hashes.get(name, {})

    def pipeline(self):
        return self

    async def execute(self):
        return True

    async def close(self):
        pass


redis_client: Optional[Any] = None

async def init_redis() -> Any:
    global redis_client
    if redis_client is None:
        try:
            client = redis.from_url(settings.REDIS_URL, decode_responses=True)
            # Перевіряємо з'єднання
            await client.ping()
            redis_client = client
            logger.info("⚡ [Redis] Успішно підключено до Redis сервера")
        except Exception as e:
            logger.warning(f"⚠️ [Redis] Не вдалося підключитися до Redis ({e}). Використовуємо In-Memory fallback.")
            redis_client = InMemoryRedisFallback()
    return redis_client

async def get_redis() -> Any:
    global redis_client
    if redis_client is None:
        return await init_redis()
    return redis_client

async def close_redis():
    global redis_client
    if redis_client:
        try:
            await redis_client.close()
        except Exception:
            pass
        redis_client = None

async def get_cache(key: str) -> Optional[Any]:
    try:
        client = await get_redis()
        val = await client.get(key)
        if val:
            return json.loads(val)
    except Exception as e:
        logger.debug(f"Redis get error: {e}")
    return None

async def set_cache(key: str, value: Any, expire_seconds: int = 3600):
    try:
        client = await get_redis()
        await client.set(key, json.dumps(value), ex=expire_seconds)
    except Exception as e:
        logger.debug(f"Redis set error: {e}")

async def invalidate_cache(key: str):
    try:
        client = await get_redis()
        await client.delete(key)
    except Exception as e:
        logger.debug(f"Redis delete error: {e}")
