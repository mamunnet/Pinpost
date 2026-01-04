"""Short post models."""
from typing import Optional
from pydantic import BaseModel


class ShortPostCreate(BaseModel):
    """Schema for creating a short post."""
    content: str


class ShortPostUpdate(BaseModel):
    """Schema for updating a short post."""
    content: Optional[str] = None


class ShortPost(BaseModel):
    """Short post response model."""
    id: str
    author_id: str
    author_username: str
    author_avatar: str
    content: str
    likes_count: int = 0
    comments_count: int = 0
    shares_count: int = 0
    created_at: str
    liked_by_user: bool = False
