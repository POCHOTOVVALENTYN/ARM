# backend/app/api/websocket.py
import asyncio
import json
import logging
from typing import List, Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from app.core.redis import get_redis
from app.core.security import verify_ws_token

logger = logging.getLogger(__name__)

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"⚡ [WS] Нове підключення. Активних клієнтів: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"🔌 [WS] Клієнт відключився. Залишилося клієнтів: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        """Пряма та масштабована розсилка JSON усім активним диспетчерам."""
        payload = json.dumps(message)
        dead_connections = []
        for connection in self.active_connections:
            try:
                await connection.send_text(payload)
            except Exception:
                dead_connections.append(connection)

        for dead in dead_connections:
            self.disconnect(dead)

        # Також публікуємо в Redis канал ws_events для мульти-воркерів
        try:
            redis = await get_redis()
            await redis.publish("ws_events", payload)
        except Exception as e:
            logger.debug(f"Redis publish notice: {e}")

ws_manager = ConnectionManager()
manager = ws_manager  # Аліас для сумісності з іншими модулями

async def handle_websocket_session(websocket: WebSocket, token: Optional[str] = None):
    # 1. Перевірка токена авторизації
    if not token:
        logger.warning("❌ [WS] Відсутній токен авторизації. Закриття з'єднання.")
        await websocket.close(code=1008)
        return

    user = await verify_ws_token(token)
    if not user:
        logger.warning("❌ [WS] Невалідний або прострочений токен диспетчера. Закриття з'єднання.")
        await websocket.close(code=1008)
        return
    logger.info(f"👤 [WS] Авторизовано диспетчера: {user.username} ({user.full_name})")

    await ws_manager.connect(websocket)

    try:
        # 2. При підключенні одразу віддаємо останній відомий стан з Redis (щоб не чекати 10 сек)
        redis = await get_redis()
        raw_data = await redis.hgetall("telemetry:vehicles")
        if raw_data:
            initial_state = [json.loads(v) for v in raw_data.values()]
            await websocket.send_text(json.dumps({
                "type": "telemetry_update",
                "data": initial_state
            }))

        # 3. Тримаємо з'єднання відкритим (підтримка ping-pong від фронтенду)
        while True:
            await websocket.receive_text()

    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception as e:
        logger.warning(f"WS session exception: {e}")
        ws_manager.disconnect(websocket)

@router.websocket("/ws")
async def websocket_endpoint_default(websocket: WebSocket, token: Optional[str] = Query(None)):
    await handle_websocket_session(websocket, token)

@router.websocket("/ws_events")
async def websocket_endpoint_events(websocket: WebSocket, token: Optional[str] = Query(None)):
    await handle_websocket_session(websocket, token)