"""Notification routes - get and mark notifications."""
from typing import List
from fastapi import APIRouter, Depends

from ..database import db
from ..models import Notification
from ..dependencies import get_current_user

router = APIRouter()


@router.get("/notifications", response_model=List[Notification])
async def get_notifications(current_user_id: str = Depends(get_current_user)):
    """Get all notifications for current user."""
    notifications = await db.notifications.find({"user_id": current_user_id}).sort("created_at", -1).to_list(100)
    return [Notification(**n) for n in notifications]


@router.put("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, current_user_id: str = Depends(get_current_user)):
    """Mark a notification as read."""
    await db.notifications.update_one(
        {"id": notification_id, "user_id": current_user_id},
        {"$set": {"read": True}}
    )
    return {"message": "Notification marked as read"}


@router.put("/notifications/read-all")
async def mark_all_notifications_read(current_user_id: str = Depends(get_current_user)):
    """Mark all notifications as read."""
    await db.notifications.update_many(
        {"user_id": current_user_id},
        {"$set": {"read": True}}
    )
    return {"message": "All notifications marked as read"}


@router.get("/notifications/unread-count")
async def get_unread_count(current_user_id: str = Depends(get_current_user)):
    """Get count of unread notifications."""
    count = await db.notifications.count_documents({"user_id": current_user_id, "read": False})
    return {"unread_count": count}
