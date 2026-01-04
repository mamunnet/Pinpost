"""Notification service - creating and sending notifications."""
import uuid
from datetime import datetime, timezone
from ..database import db
from .websocket_service import manager


async def create_notification(
    user_id: str,
    notif_type: str,
    actor_id: str,
    actor_username: str,
    actor_avatar: str,
    message: str,
    post_id: str = None,
    post_type: str = None,
    comment_id: str = None
):
    """Create a notification and send it via WebSocket if user is online."""
    notification = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "type": notif_type,
        "actor_id": actor_id,
        "actor_username": actor_username,
        "actor_avatar": actor_avatar,
        "post_id": post_id,
        "post_type": post_type,
        "comment_id": comment_id,
        "message": message,
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.notifications.insert_one(notification)
    
    # Send real-time notification if user is online
    await manager.send_notification(user_id, {
        "type": "notification",
        "notification": notification
    })
