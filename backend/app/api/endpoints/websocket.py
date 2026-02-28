# ============================================================
# PetroVision — WebSocket Endpoint (Real-Time Data)
# ============================================================

import asyncio
import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.core.config import get_settings
from loguru import logger

router = APIRouter(tags=["WebSocket"])

settings = get_settings()


class ConnectionManager:
    """
    Manages active WebSocket connections.
    Supports channels: 'live-data', 'alarms', 'predictions'.
    """

    def __init__(self):
        self.active_connections: dict[str, list[WebSocket]] = {
            "live-data": [],
            "alarms": [],
            "predictions": [],
        }

    async def connect(self, websocket: WebSocket, channel: str):
        await websocket.accept()
        if channel not in self.active_connections:
            self.active_connections[channel] = []
        self.active_connections[channel].append(websocket)
        logger.info(f"WS connected to '{channel}' — total: {len(self.active_connections[channel])}")

    def disconnect(self, websocket: WebSocket, channel: str):
        if channel in self.active_connections:
            self.active_connections[channel].remove(websocket)
            logger.info(f"WS disconnected from '{channel}' — total: {len(self.active_connections[channel])}")

    async def broadcast(self, channel: str, data: dict):
        """Broadcast data to all connections on a channel."""
        if channel not in self.active_connections:
            return
        dead = []
        for connection in self.active_connections[channel]:
            try:
                await connection.send_json(data)
            except Exception:
                dead.append(connection)
        for d in dead:
            self.active_connections[channel].remove(d)

    @property
    def connection_count(self) -> dict[str, int]:
        return {ch: len(conns) for ch, conns in self.active_connections.items()}


# Global manager instance
manager = ConnectionManager()


@router.websocket("/ws/{channel}")
async def websocket_endpoint(websocket: WebSocket, channel: str):
    """
    WebSocket endpoint for real-time data streaming.
    Channels: 'live-data', 'alarms', 'predictions'
    """
    if channel not in manager.active_connections:
        await websocket.close(code=4000, reason=f"Canal '{channel}' no válido")
        return

    await manager.connect(websocket, channel)
    try:
        while True:
            # Keep alive — also handles client messages
            data = await websocket.receive_text()
            # Client messages could be: ping, subscribe to specific tags, etc.
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(websocket, channel)
    except Exception as e:
        logger.error(f"WS error on '{channel}': {e}")
        manager.disconnect(websocket, channel)


@router.get("/ws/status")
def ws_status():
    """Get WebSocket connection statistics."""
    return {
        "connections": manager.connection_count,
        "channels": list(manager.active_connections.keys()),
    }
