"""Story models."""
from typing import Optional
from pydantic import BaseModel


class StoryCreate(BaseModel):
    """Schema for creating a story."""
    content: str
    media_url: Optional[str] = None


class Story(BaseModel):
    """Story response model."""
    id: str
    user_id: str
    username: str
    user_avatar: str
    content: str
    media_url: str
    views_count: int = 0
    created_at: str
    expires_at: str
