# backend/app/api/websocket.py
import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List
import json
import redis.asyncio as redis
import os

router = APIRouter()

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

class ConnectionManager:
    def __init__(self):
        # Зберігаємо всі активні WebSocket підключення (локальні для цього воркера)
        self.active_connections: List[WebSocket] = []
        self.redis = redis.from_url(REDIS_URL, decode_responses=True)
        self.pubsub = self.redis.pubsub()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"Нове підключення. Всього локальних клієнтів: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
        print(f"Клієнт відключився. Всього локальних клієнтів: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        """Відправляє повідомлення в Redis канал (щоб усі воркери його отримали)."""
        json_message = json.dumps(message)
        # Публікуємо в Redis замість прямої відправки клієнтам
        await self.redis.publish("ws_events", json_message)

    async def _send_to_local_clients(self, message_str: str):
        """Внутрішній метод для відправки повідомлення локальним підключенням цього воркера."""
        dead_connections = []
        for connection in self.active_connections:
            try:
                await connection.send_text(message_str)
            except Exception as e:
                print(f"Помилка відправки (м'яке відключення): {e}")
                dead_connections.append(connection)
        
        # Очищення мертвих з'єднань
        for dead in dead_connections:
            if dead in self.active_connections:
                self.active_connections.remove(dead)
                print(f"Очищено мертве з'єднання. Залишилося: {len(self.active_connections)}")

    async def listen_to_redis(self):
        """Фонове завдання, яке слухає канал Redis і ретранслює події локальним клієнтам."""
        await self.pubsub.subscribe("ws_events")
        print("Підписано на Redis канал: ws_events")
        try:
            async for message in self.pubsub.listen():
                if message["type"] == "message":
                    data = message["data"]
                    # Отримали подію від Redis, розсилаємо її локальним клієнтам
                    await self._send_to_local_clients(data)
        except asyncio.CancelledError:
            print("Слухач Redis зупинений.")
        finally:
            await self.pubsub.unsubscribe("ws_events")

# Глобальний менеджер підключень
manager = ConnectionManager()

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Очікуємо повідомлення від клієнта (наприклад, ping/pong для підтримки з'єднання)
            data = await websocket.receive_text()
            # Поки що ігноруємо вхідні повідомлення від клієнта через WS
            pass
    except WebSocketDisconnect:
        manager.disconnect(websocket)