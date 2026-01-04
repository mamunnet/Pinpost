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


@router.get("/users/suggestions")
async def get_user_suggestions(limit: int = 10, current_user_id: Optional[str] = Depends(get_optional_user)):
    """
    Smart algorithm for "People You May Know":
    1. Friends of friends (mutual connections)
    2. Users with similar interests (based on engagement)
    3. Popular users you don't follow
    4. Recently active users
    """
    if not current_user_id:
        # For non-logged-in users, show trending users
        users = await db.users.find().sort("followers_count", -1).limit(limit).to_list(limit)
        result = []
        for user in users:
            user.pop("password_hash", None)
            result.append(User(**user))
        return result
    
    # Get users current user is already following
    following = await db.follows.find({"follower_id": current_user_id}).to_list(1000)
    following_ids = [f["following_id"] for f in following]
    
    suggestion_scores = {}
    
    # 1. Friends of friends (mutual connections) - Highest priority
    for followed_id in following_ids:
        # Get who your friends follow
        friends_following = await db.follows.find({"follower_id": followed_id}).to_list(100)
        for ff in friends_following:
            suggested_id = ff["following_id"]
            # Skip only if is self
            if suggested_id == current_user_id:
                continue
            # Increase score for each mutual connection
            suggestion_scores[suggested_id] = suggestion_scores.get(suggested_id, 0) + 10
    
    # 2. Users who engage with similar content
    # Get posts current user liked
    user_likes = await db.likes.find({"user_id": current_user_id}).to_list(100)
    liked_post_ids = [like["post_id"] for like in user_likes]
    
    # Find other users who liked the same posts
    if liked_post_ids:
        similar_likes = await db.likes.find({
            "post_id": {"$in": liked_post_ids},
            "user_id": {"$ne": current_user_id}
        }).to_list(200)
        
        for like in similar_likes:
            suggested_id = like["user_id"]
            if suggested_id != current_user_id:
                suggestion_scores[suggested_id] = suggestion_scores.get(suggested_id, 0) + 5
    
    # 3. Popular users (high followers count) - Lower priority
    popular_users = await db.users.find({
        "id": {"$ne": current_user_id}
    }).sort("followers_count", -1).limit(20).to_list(20)
    
    for user in popular_users:
        suggested_id = user["id"]
        # Add score based on popularity
        followers_score = min(user.get("followers_count", 0) / 10, 5)
        suggestion_scores[suggested_id] = suggestion_scores.get(suggested_id, 0) + followers_score
    
    # 4. Recently active users
    recent_posts = await db.short_posts.find({
        "author_id": {"$ne": current_user_id}
    }).sort("created_at", -1).limit(20).to_list(20)
    
    for post in recent_posts:
        suggested_id = post["author_id"]
        suggestion_scores[suggested_id] = suggestion_scores.get(suggested_id, 0) + 2
    
    # Sort by score and get top suggestions
    sorted_suggestions = sorted(suggestion_scores.items(), key=lambda x: x[1], reverse=True)
    top_suggestion_ids = [user_id for user_id, score in sorted_suggestions[:limit]]
    
    # Fetch full user data
    result = []
    
    # If we have algorithmic suggestions, fetch them
    if top_suggestion_ids:
        users = await db.users.find({"id": {"$in": top_suggestion_ids}}).to_list(len(top_suggestion_ids))
        # Create a map for sorting
        user_map = {u["id"]: u for u in users}
        
        for user_id in top_suggestion_ids:
            if user_id in user_map:
                user = user_map[user_id]
                user_data = User(**user).dict()
                # Check if current user is following this suggested user
                user_data["is_following"] = user_id in following_ids
                user_data["suggestion_score"] = suggestion_scores[user_id]
                # Remove password hash if present
                if "password_hash" in user_data:
                    del user_data["password_hash"]
                result.append(user_data)
    
    # If not enough suggestions, fill with trending users
    if len(result) < limit:
        # Exclude self, already following, and already suggested
        excluded_ids = [current_user_id] + following_ids + [r["id"] for r in result]
        
        additional_users = await db.users.find({
            "id": {"$nin": excluded_ids}
        }).sort("followers_count", -1).limit(limit - len(result)).to_list(limit - len(result))
        
        for user in additional_users:
            user_data = User(**user).dict()
            user_data["is_following"] = False
            user_data["suggestion_score"] = 0
            if "password_hash" in user_data:
                del user_data["password_hash"]
            result.append(user_data)
    
    return result


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
