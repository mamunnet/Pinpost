"""Notification models."""
from typing import Optional
from pydantic import BaseModel


class Notification(BaseModel):
    """Notification response model."""
    id: str
    user_id: str
    type: str
    actor_id: str
    actor_username: str
    actor_avatar: str
    post_id: Optional[str] = None
    post_type: Optional[str] = None
    comment_id: Optional[str] = None
    message: str
    read: bool = False
    created_at: str
