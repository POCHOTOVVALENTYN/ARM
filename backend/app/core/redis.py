import redis.asyncio as redis
from app.core.config import settings
import json
from typing import Any, Optional

redis_client: Optional[redis.Redis] = None

async def init_redis():
    global redis_client
    redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)

async def close_redis():
    global redis_client
    if redis_client:
        await redis_client.close()

async def get_cache(key: str) -> Optional[Any]:
    if not redis_client:
        return None
    try:
        val = await redis_client.get(key)
        if val:
            return json.loads(val)
    except Exception as e:
        print(f"Redis get error: {e}")
    return None

async def set_cache(key: str, value: Any, expire_seconds: int = 3600):
    if not redis_client:
        return
    try:
        await redis_client.set(key, json.dumps(value), ex=expire_seconds)
    except Exception as e:
        print(f"Redis set error: {e}")

async def invalidate_cache(key: str):
    if not redis_client:
        return
    try:
        await redis_client.delete(key)
    except Exception as e:
        print(f"Redis delete error: {e}")
