# backend/app/api/websocket.py
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List
import json

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        # Зберігаємо всі активні WebSocket підключення
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"Нове підключення. Всього клієнтів: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
        print(f"Клієнт відключився. Всього клієнтів: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        """Відправляє повідомлення всім підключеним клієнтам."""
        json_message = json.dumps(message)
        for connection in self.active_connections:
            try:
                await connection.send_text(json_message)
            except Exception as e:
                print(f"Помилка відправки: {e}")

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