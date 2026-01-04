"""Admin routes - admin-only endpoints for platform management."""
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends

from ..database import db
from ..dependencies import get_admin_user

router = APIRouter()


@router.get("/admin/stats")
async def get_admin_stats(admin_id: str = Depends(get_admin_user)):
    """Get platform statistics."""
    users_count = await db.users.count_documents({})
    posts_count = await db.short_posts.count_documents({})
    blogs_count = await db.blog_posts.count_documents({})
    comments_count = await db.comments.count_documents({})
    
    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    new_users_today = await db.users.count_documents({"created_at": {"$gte": today.isoformat()}})
    
    return {
        "total_users": users_count,
        "total_posts": posts_count,
        "total_blogs": blogs_count,
        "total_comments": comments_count,
        "new_users_today": new_users_today,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.get("/admin/users")
async def get_all_users(skip: int = 0, limit: int = 50, admin_id: str = Depends(get_admin_user)):
    """Get all users."""
    users = await db.users.find().sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    result = []
    for user in users:
        user.pop("password_hash", None)
        user.pop("_id", None)
        result.append(user)
    
    total = await db.users.count_documents({})
    return {"users": result, "total": total, "skip": skip, "limit": limit}


@router.delete("/admin/users/{user_id}")
async def delete_user_admin(user_id: str, admin_id: str = Depends(get_admin_user)):
    """Delete a user and all their content."""
    if user_id == admin_id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Delete all user content
    await db.short_posts.delete_many({"author_id": user_id})
    await db.blog_posts.delete_many({"author_id": user_id})
    await db.comments.delete_many({"user_id": user_id})
    await db.likes.delete_many({"user_id": user_id})
    await db.follows.delete_many({"$or": [{"follower_id": user_id}, {"following_id": user_id}]})
    await db.notifications.delete_many({"$or": [{"user_id": user_id}, {"actor_id": user_id}]})
    await db.stories.delete_many({"user_id": user_id})
    await db.users.delete_one({"id": user_id})
    
    return {"message": f"User {user['username']} deleted"}


@router.put("/admin/users/{user_id}/toggle-admin")
async def toggle_user_admin(user_id: str, admin_id: str = Depends(get_admin_user)):
    """Toggle admin status for a user."""
    if user_id == admin_id:
        raise HTTPException(status_code=400, detail="Cannot modify your own admin status")
    
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    new_status = not user.get("is_admin", False)
    await db.users.update_one({"id": user_id}, {"$set": {"is_admin": new_status}})
    
    return {"message": f"Admin status set to {new_status}", "is_admin": new_status}


@router.delete("/admin/posts/{post_id}")
async def delete_post_admin(post_id: str, admin_id: str = Depends(get_admin_user)):
    """Delete any post."""
    post = await db.short_posts.find_one({"id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    await db.short_posts.delete_one({"id": post_id})
    await db.likes.delete_many({"post_id": post_id, "post_type": "post"})
    await db.comments.delete_many({"post_id": post_id, "post_type": "post"})
    
    return {"message": "Post deleted by admin"}


@router.delete("/admin/blogs/{blog_id}")
async def delete_blog_admin(blog_id: str, admin_id: str = Depends(get_admin_user)):
    """Delete any blog."""
    blog = await db.blog_posts.find_one({"id": blog_id})
    if not blog:
        raise HTTPException(status_code=404, detail="Blog not found")
    
    await db.blog_posts.delete_one({"id": blog_id})
    await db.likes.delete_many({"post_id": blog_id, "post_type": "blog"})
    await db.comments.delete_many({"post_id": blog_id, "post_type": "blog"})
    
    return {"message": "Blog deleted by admin"}


@router.get("/admin/check")
async def check_admin_status(admin_id: str = Depends(get_admin_user)):
    """Check if current user is admin."""
    user = await db.users.find_one({"id": admin_id})
    return {"is_admin": True, "username": user["username"], "email": user["email"]}
