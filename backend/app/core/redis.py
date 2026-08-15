import redis.asyncio as redis
from app.core.config import settings
import json
from typing import Any, Optional

redis_client: Optional[redis.Redis] = None

async def init_redis() -> redis.Redis:
    global redis_client
    if redis_client is None:
        redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
    return redis_client

async def get_redis() -> redis.Redis:
    global redis_client
    if redis_client is None:
        redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
    return redis_client

async def close_redis():
    global redis_client
    if redis_client:
        await redis_client.close()
        redis_client = None

async def get_cache(key: str) -> Optional[Any]:
    client = await get_redis()
    try:
        val = await client.get(key)
        if val:
            return json.loads(val)
    except Exception as e:
        print(f"Redis get error: {e}")
    return None

async def set_cache(key: str, value: Any, expire_seconds: int = 3600):
    client = await get_redis()
    try:
        await client.set(key, json.dumps(value), ex=expire_seconds)
    except Exception as e:
        print(f"Redis set error: {e}")

async def invalidate_cache(key: str):
    client = await get_redis()
    try:
        await client.delete(key)
    except Exception as e:
        print(f"Redis delete error: {e}")
