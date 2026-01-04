"""Authentication routes - register, login, profile setup."""
import uuid
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends
from pymongo.errors import DuplicateKeyError, PyMongoError

from ..database import db
from ..models import User, UserCreate, UserLogin, ProfileSetup
from ..services import hash_password, verify_password, create_access_token
from ..dependencies import get_current_user

router = APIRouter()


@router.post("/auth/register")
async def register(user_data: UserCreate):
    """Register a new user."""
    try:
        logging.info(f"Registration attempt for user: {user_data.username}")
        
        # Check if user exists
        existing_user = await db.users.find_one({
            "$or": [{"email": user_data.email}, {"username": user_data.username}]
        })
        if existing_user:
            raise HTTPException(status_code=400, detail="User already exists")
        
        # Create user
        user_id = str(uuid.uuid4())
        user = {
            "id": user_id,
            "username": user_data.username,
            "email": user_data.email,
            "password_hash": hash_password(user_data.password),
            "name": "",
            "bio": user_data.bio,
            "avatar": "",
            "cover_photo": "",
            "date_of_birth": "",
            "location": "",
            "profile_completed": False,
            "is_admin": False,
            "followers_count": 0,
            "following_count": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.users.insert_one(user)
        token = create_access_token({"sub": user_id})
        
        user.pop("password_hash", None)
        logging.info(f"Registration successful for user: {user_data.username}")
        return {"token": token, "user": User(**user)}
        
    except DuplicateKeyError:
        raise HTTPException(status_code=400, detail="User already exists")
    except PyMongoError as e:
        logging.error(f"MongoDB error during registration: {e}")
        raise HTTPException(status_code=503, detail="Service temporarily unavailable")
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Registration error: {e}")
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")


@router.post("/auth/login")
async def login(credentials: UserLogin):
    """Login user and return token."""
    user = await db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token({"sub": user["id"]})
    user.pop("password_hash", None)
    return {"token": token, "user": User(**user)}


@router.get("/auth/me", response_model=User)
async def get_me(user_id: str = Depends(get_current_user)):
    """Get current user profile."""
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.pop("password_hash", None)
    return User(**user)


@router.post("/auth/setup-profile")
async def setup_profile(profile_data: ProfileSetup, user_id: str = Depends(get_current_user)):
    """Complete profile setup."""
    update_data = {
        "name": profile_data.name,
        "bio": profile_data.bio or "",
        "avatar": profile_data.avatar or "",
        "cover_photo": profile_data.cover_photo or "",
        "date_of_birth": profile_data.date_of_birth or "",
        "location": profile_data.location or "",
        "profile_completed": True
    }
    
    await db.users.update_one({"id": user_id}, {"$set": update_data})
    user = await db.users.find_one({"id": user_id})
    user.pop("password_hash", None)
    return User(**user)
