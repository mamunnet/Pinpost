"""User models."""
from typing import Optional
from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    """Schema for user registration."""
    username: str
    email: EmailStr
    password: str
    bio: Optional[str] = ""


class UserLogin(BaseModel):
    """Schema for user login."""
    email: EmailStr
    password: str


class User(BaseModel):
    """User response model."""
    id: str
    username: str
    email: str
    name: Optional[str] = ""
    bio: str = ""
    avatar: str = ""
    cover_photo: Optional[str] = ""
    date_of_birth: Optional[str] = ""
    location: Optional[str] = ""
    website: Optional[str] = ""
    profile_completed: bool = False
    is_admin: bool = False
    followers_count: int = 0
    following_count: int = 0
    created_at: str


class ProfileSetup(BaseModel):
    """Schema for profile setup."""
    name: str
    bio: Optional[str] = ""
    avatar: Optional[str] = ""
    cover_photo: Optional[str] = ""
    date_of_birth: Optional[str] = ""
    location: Optional[str] = ""


class UserUpdate(BaseModel):
    """Schema for updating user profile."""
    username: Optional[str] = None
    name: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    date_of_birth: Optional[str] = None
    avatar: Optional[str] = None
    cover_photo: Optional[str] = None
