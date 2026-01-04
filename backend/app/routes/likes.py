"""Like routes - like and unlike posts/blogs."""
from fastapi import APIRouter, HTTPException, Depends
import uuid
from datetime import datetime, timezone

from ..database import db
from ..dependencies import get_current_user
from ..services import create_notification

router = APIRouter()


@router.post("/{post_type}/{post_id}/like")
async def like_post(post_type: str, post_id: str, user_id: str = Depends(get_current_user)):
    """Like a post or blog."""
    # Verify post exists
    if post_type == "post":
        post = await db.short_posts.find_one({"id": post_id})
    elif post_type == "blog":
        post = await db.blog_posts.find_one({"id": post_id})
    else:
        raise HTTPException(status_code=400, detail="Invalid post type")
    
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Check if already liked
    existing = await db.likes.find_one({
        "user_id": user_id,
        "post_id": post_id,
        "post_type": post_type
    })
    if existing:
        raise HTTPException(status_code=400, detail="Already liked")
    
    # Create like
    like = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "post_id": post_id,
        "post_type": post_type,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.likes.insert_one(like)
    
    # Update like count
    collection = db.short_posts if post_type == "post" else db.blog_posts
    await collection.update_one({"id": post_id}, {"$inc": {"likes_count": 1}})
    
    # Create notification (if not self-like)
    if post["author_id"] != user_id:
        user = await db.users.find_one({"id": user_id})
        await create_notification(
            user_id=post["author_id"],
            notif_type="like",
            actor_id=user_id,
            actor_username=user["username"],
            actor_avatar=user.get("avatar", ""),
            message=f"{user['username']} liked your {post_type}",
            post_id=post_id,
            post_type=post_type
        )
    
    return {"message": "Liked successfully"}


@router.delete("/{post_type}/{post_id}/like")
async def unlike_post(post_type: str, post_id: str, user_id: str = Depends(get_current_user)):
    """Unlike a post or blog."""
    result = await db.likes.delete_one({
        "user_id": user_id,
        "post_id": post_id,
        "post_type": post_type
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=400, detail="Not liked")
    
    collection = db.short_posts if post_type == "post" else db.blog_posts
    await collection.update_one({"id": post_id}, {"$inc": {"likes_count": -1}})
    
    return {"message": "Unliked successfully"}
