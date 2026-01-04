"""Comment models."""
from typing import Optional
from pydantic import BaseModel


class CommentCreate(BaseModel):
    """Schema for creating a comment."""
    content: str
    reply_to: Optional[str] = None


class Comment(BaseModel):
    """Comment response model."""
    id: str
    user_id: str
    username: str
    user_avatar: str
    post_id: str
    post_type: str
    content: str
    created_at: str
    reply_to: Optional[str] = None
