"""Comment routes - CRUD for comments."""
from typing import List
from fastapi import APIRouter, HTTPException, Depends
import uuid
from datetime import datetime, timezone

from ..database import db
from ..models import Comment, CommentCreate
from ..dependencies import get_current_user
from ..services import create_notification

router = APIRouter()


@router.post("/{post_type}/{post_id}/comments", response_model=Comment)
async def create_comment(
    post_type: str,
    post_id: str,
    comment_data: CommentCreate,
    user_id: str = Depends(get_current_user)
):
    """Create a comment on a post or blog."""
    user = await db.users.find_one({"id": user_id})
    
    # Verify post exists
    if post_type == "post":
        post = await db.short_posts.find_one({"id": post_id})
    elif post_type == "blog":
        post = await db.blog_posts.find_one({"id": post_id})
    else:
        raise HTTPException(status_code=400, detail="Invalid post type")
    
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    comment_id = str(uuid.uuid4())
    comment = {
        "id": comment_id,
        "user_id": user_id,
        "username": user["username"],
        "user_avatar": user.get("avatar", ""),
        "post_id": post_id,
        "post_type": post_type,
        "content": comment_data.content,
        "reply_to": comment_data.reply_to,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.comments.insert_one(comment)
    
    # Update comment count
    collection = db.short_posts if post_type == "post" else db.blog_posts
    await collection.update_one({"id": post_id}, {"$inc": {"comments_count": 1}})
    
    # Create notification for post author (if not self-comment)
    if post["author_id"] != user_id:
        await create_notification(
            user_id=post["author_id"],
            notif_type="comment",
            actor_id=user_id,
            actor_username=user["username"],
            actor_avatar=user.get("avatar", ""),
            message=f"{user['username']} commented on your {post_type}",
            post_id=post_id,
            post_type=post_type,
            comment_id=comment_id
        )
    
    return Comment(**comment)


@router.get("/{post_type}/{post_id}/comments", response_model=List[Comment])
async def get_comments(post_type: str, post_id: str):
    """Get all comments for a post or blog."""
    comments = await db.comments.find({"post_id": post_id, "post_type": post_type}).to_list(100)
    return [Comment(**c) for c in comments]


@router.delete("/comments/{comment_id}")
async def delete_comment(comment_id: str, user_id: str = Depends(get_current_user)):
    """Delete a comment."""
    comment = await db.comments.find_one({"id": comment_id})
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    if comment["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.comments.delete_one({"id": comment_id})
    
    # Update comment count
    collection = db.short_posts if comment["post_type"] == "post" else db.blog_posts
    await collection.update_one({"id": comment["post_id"]}, {"$inc": {"comments_count": -1}})
    
    return {"message": "Comment deleted successfully"}


@router.put("/comments/{comment_id}", response_model=Comment)
async def update_comment(
    comment_id: str,
    comment_data: CommentCreate,
    user_id: str = Depends(get_current_user)
):
    """Update a comment."""
    comment = await db.comments.find_one({"id": comment_id})
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    if comment["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.comments.update_one(
        {"id": comment_id},
        {"$set": {"content": comment_data.content}}
    )
    updated_comment = await db.comments.find_one({"id": comment_id})
    return Comment(**updated_comment)
