"""User routes - profile, follow, search, trending."""
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Depends
import uuid
from datetime import datetime, timezone

from ..database import db
from ..models import User, UserUpdate
from ..dependencies import get_current_user, get_optional_user
from ..services import create_notification

router = APIRouter()


@router.get("/users/trending")
async def get_trending_users(limit: int = 5, current_user_id: Optional[str] = Depends(get_optional_user)):
    """Get trending/popular users."""
    users = await db.users.find().sort("followers_count", -1).limit(limit).to_list(limit)
    result = []
    for user in users:
        user.pop("password_hash", None)
        result.append(User(**user))
    return result


@router.get("/users/search")
async def search_users(q: str, limit: int = 10):
    """Search users by username or name."""
    users = await db.users.find({
        "$or": [
            {"username": {"$regex": q, "$options": "i"}},
            {"name": {"$regex": q, "$options": "i"}}
        ]
    }).limit(limit).to_list(limit)
    
    result = []
    for user in users:
        user.pop("password_hash", None)
        result.append(User(**user))
    return result


@router.get("/users/{username}")
async def get_user_profile(username: str, current_user_id: Optional[str] = Depends(get_optional_user)):
    """Get user profile by username."""
    user = await db.users.find_one({"username": username})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.pop("password_hash", None)
    user_data = User(**user).dict()
    
    # Check if current user follows this user
    if current_user_id:
        following = await db.follows.find_one({
            "follower_id": current_user_id,
            "following_id": user["id"]
        })
        user_data["is_following"] = bool(following)
    
    return user_data


@router.post("/users/{user_id}/follow")
async def follow_user(user_id: str, current_user_id: str = Depends(get_current_user)):
    """Follow a user."""
    if user_id == current_user_id:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")
    
    target_user = await db.users.find_one({"id": user_id})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    existing = await db.follows.find_one({
        "follower_id": current_user_id,
        "following_id": user_id
    })
    if existing:
        raise HTTPException(status_code=400, detail="Already following")
    
    current_user = await db.users.find_one({"id": current_user_id})
    
    await db.follows.insert_one({
        "id": str(uuid.uuid4()),
        "follower_id": current_user_id,
        "following_id": user_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    await db.users.update_one({"id": user_id}, {"$inc": {"followers_count": 1}})
    await db.users.update_one({"id": current_user_id}, {"$inc": {"following_count": 1}})
    
    # Create notification
    await create_notification(
        user_id=user_id,
        notif_type="follow",
        actor_id=current_user_id,
        actor_username=current_user["username"],
        actor_avatar=current_user.get("avatar", ""),
        message=f"{current_user['username']} started following you"
    )
    
    return {"message": "Followed successfully"}


@router.delete("/users/{user_id}/follow")
async def unfollow_user(user_id: str, current_user_id: str = Depends(get_current_user)):
    """Unfollow a user."""
    result = await db.follows.delete_one({
        "follower_id": current_user_id,
        "following_id": user_id
    })
    if result.deleted_count == 0:
        raise HTTPException(status_code=400, detail="Not following")
    
    await db.users.update_one({"id": user_id}, {"$inc": {"followers_count": -1}})
    await db.users.update_one({"id": current_user_id}, {"$inc": {"following_count": -1}})
    
    return {"message": "Unfollowed successfully"}


@router.put("/users/profile")
async def update_profile(profile_data: UserUpdate, current_user_id: str = Depends(get_current_user)):
    """Update user profile."""
    update_data = {k: v for k, v in profile_data.dict().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    if "username" in update_data:
        existing = await db.users.find_one({
            "username": update_data["username"],
            "id": {"$ne": current_user_id}
        })
        if existing:
            raise HTTPException(status_code=400, detail="Username already taken")
    
    await db.users.update_one({"id": current_user_id}, {"$set": update_data})
    user = await db.users.find_one({"id": current_user_id})
    return User(**user)


@router.put("/users/avatar")
async def update_avatar(avatar_data: dict, current_user_id: str = Depends(get_current_user)):
    """Update user avatar."""
    avatar_url = avatar_data.get("avatar", "")
    await db.users.update_one({"id": current_user_id}, {"$set": {"avatar": avatar_url}})
    user = await db.users.find_one({"id": current_user_id})
    return User(**user)


@router.delete("/users/avatar")
async def remove_avatar(current_user_id: str = Depends(get_current_user)):
    """Remove user avatar."""
    await db.users.update_one({"id": current_user_id}, {"$set": {"avatar": ""}})
    user = await db.users.find_one({"id": current_user_id})
    return User(**user)


@router.put("/users/cover-photo")
async def update_cover_photo(cover_data: dict, current_user_id: str = Depends(get_current_user)):
    """Update user cover photo."""
    cover_url = cover_data.get("cover_photo", "")
    await db.users.update_one({"id": current_user_id}, {"$set": {"cover_photo": cover_url}})
    user = await db.users.find_one({"id": current_user_id})
    return User(**user)


@router.delete("/users/cover-photo")
async def remove_cover_photo(current_user_id: str = Depends(get_current_user)):
    """Remove user cover photo."""
    await db.users.update_one({"id": current_user_id}, {"$set": {"cover_photo": ""}})
    user = await db.users.find_one({"id": current_user_id})
    return User(**user)


@router.get("/users/{user_id}/status")
async def get_user_online_status(user_id: str):
    """Get user's online status."""
    from ..services import manager
    
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    status = manager.get_user_status(user_id)
    if not status["online"]:
        status = {
            "online": user.get("online", False),
            "last_seen": user.get("last_seen")
        }
    
    return status
