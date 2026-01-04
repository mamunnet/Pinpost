"""Blog post models."""
from typing import Optional, List
from pydantic import BaseModel


class BlogPostCreate(BaseModel):
    """Schema for creating a blog post."""
    title: str
    content: str
    excerpt: Optional[str] = ""
    cover_image: Optional[str] = ""
    tags: List[str] = []


class BlogPostUpdate(BaseModel):
    """Schema for updating a blog post."""
    title: Optional[str] = None
    content: Optional[str] = None
    excerpt: Optional[str] = None
    cover_image: Optional[str] = None
    tags: Optional[List[str]] = None


class BlogPost(BaseModel):
    """Blog post response model."""
    id: str
    author_id: str
    author_username: str
    author_avatar: str
    title: str
    content: str
    excerpt: str
    cover_image: str
    tags: List[str]
    likes_count: int = 0
    comments_count: int = 0
    shares_count: int = 0
    created_at: str
    updated_at: str
    liked_by_user: bool = False
