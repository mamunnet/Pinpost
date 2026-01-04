"""WebSocket connection manager for real-time notifications and messaging."""
import json
import logging
from typing import Dict
from datetime import datetime, timezone
from fastapi import WebSocket


class ConnectionManager:
    """Manages WebSocket connections for real-time features."""
    
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.user_status: Dict[str, dict] = {}
        self.typing_status: Dict[str, dict] = {}
    
    async def connect(self, user_id: str, websocket: WebSocket):
        """Connect a user's WebSocket."""
        await websocket.accept()
        self.active_connections[user_id] = websocket
        self.user_status[user_id] = {
            "online": True,
            "last_seen": datetime.now(timezone.utc).isoformat()
        }
        
        # Broadcast user online status
        await self.broadcast({
            "type": "user_status",
            "user_id": user_id,
            "online": True,
            "last_seen": self.user_status[user_id]["last_seen"]
        })
        
        logging.info(f"WebSocket connected for user: {user_id}")
    
    def disconnect(self, user_id: str):
        """Disconnect a user's WebSocket."""
        if user_id in self.active_connections:
            del self.active_connections[user_id]
        if user_id in self.user_status:
            self.user_status[user_id]["online"] = False
            self.user_status[user_id]["last_seen"] = datetime.now(timezone.utc).isoformat()
    
    async def send_notification(self, user_id: str, message: dict):
        """Send a notification to a specific user."""
        if user_id in self.active_connections:
            try:
                await self.active_connections[user_id].send_json(message)
            except Exception as e:
                logging.error(f"Error sending notification to {user_id}: {e}")
                self.disconnect(user_id)
    
    async def broadcast(self, message: dict, exclude_user: str = None):
        """Broadcast a message to all connected users."""
        for user_id, connection in list(self.active_connections.items()):
            if exclude_user and user_id == exclude_user:
                continue
            try:
                await connection.send_json(message)
            except Exception:
                self.disconnect(user_id)
    
    def is_online(self, user_id: str) -> bool:
        """Check if user is currently online."""
        return user_id in self.active_connections
    
    def get_user_status(self, user_id: str) -> dict:
        """Get user's online status and last seen."""
        return self.user_status.get(user_id, {"online": False, "last_seen": None})
    
    async def set_typing(self, user_id: str, conversation_id: str, typing: bool):
        """Set typing status for a user in a conversation."""
        if conversation_id not in self.typing_status:
            self.typing_status[conversation_id] = {}
        
        self.typing_status[conversation_id][user_id] = typing
        
        # Broadcast typing status to conversation participants
        await self.broadcast({
            "type": "typing",
            "conversation_id": conversation_id,
            "user_id": user_id,
            "typing": typing
        })


# Global manager instance
manager = ConnectionManager()
