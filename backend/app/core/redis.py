# ============================================================
# PetroVision — Redis Client (Cache + Pub/Sub)
# ============================================================

import json
import redis.asyncio as aioredis
from app.core.config import get_settings

settings = get_settings()

_redis: aioredis.Redis | None = None


async def get_redis() -> aioredis.Redis:
    global _redis
    if _redis is None:
        _redis = aioredis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True,
        )
    return _redis


async def cache_set(key: str, value: dict, expire: int = 60):
    """Cache a dictionary value with optional TTL."""
    r = await get_redis()
    await r.set(key, json.dumps(value), ex=expire)


async def cache_get(key: str) -> dict | None:
    """Get a cached dictionary value."""
    r = await get_redis()
    data = await r.get(key)
    return json.loads(data) if data else None


async def publish_live_data(channel: str, data: dict):
    """Publish real-time data via Redis Pub/Sub."""
    r = await get_redis()
    await r.publish(channel, json.dumps(data))


async def close_redis():
    global _redis
    if _redis:
        await _redis.close()
        _redis = None
