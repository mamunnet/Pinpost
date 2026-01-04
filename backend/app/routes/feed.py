"""Feed route - combined posts and blogs feed."""
from typing import Optional
from fastapi import APIRouter, Depends

from ..database import db
from ..dependencies import get_optional_user

router = APIRouter()


@router.get("/feed")
async def get_feed(
    skip: int = 0,
    limit: int = 20,
    following_only: bool = False,
    current_user_id: Optional[str] = Depends(get_optional_user)
):
    """Get combined feed of posts and blogs."""
    # Get following list if needed
    following_ids = []
    if following_only and current_user_id:
        follows = await db.follows.find({"follower_id": current_user_id}).to_list(1000)
        following_ids = [f["following_id"] for f in follows]
        following_ids.append(current_user_id)  # Include own posts
    
    # Get posts
    post_query = {"author_id": {"$in": following_ids}} if following_only else {}
    posts = await db.short_posts.find(post_query).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    # Get blogs
    blog_query = {"author_id": {"$in": following_ids}} if following_only else {}
    blogs = await db.blog_posts.find(blog_query).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    # Combine and sort
    feed_items = []
    
    for post in posts:
        author = await db.users.find_one({"id": post["author_id"]})
        item = {
            "type": "post",
            "id": post["id"],
            "author_id": post["author_id"],
            "author_username": post.get("author_username", author["username"] if author else ""),
            "author_avatar": author.get("avatar", "") if author else "",
            "author_name": author.get("name", "") if author else "",
            "content": post["content"],
            "likes_count": post.get("likes_count", 0),
            "comments_count": post.get("comments_count", 0),
            "created_at": post["created_at"],
            "liked_by_user": False
        }
        if current_user_id:
            liked = await db.likes.find_one({"user_id": current_user_id, "post_id": post["id"], "post_type": "post"})
            item["liked_by_user"] = bool(liked)
        feed_items.append(item)
    
    for blog in blogs:
        author = await db.users.find_one({"id": blog["author_id"]})
        item = {
            "type": "blog",
            "id": blog["id"],
            "author_id": blog["author_id"],
            "author_username": blog.get("author_username", author["username"] if author else ""),
            "author_avatar": author.get("avatar", "") if author else "",
            "author_name": author.get("name", "") if author else "",
            "title": blog["title"],
            "excerpt": blog.get("excerpt", ""),
            "cover_image": blog.get("cover_image", ""),
            "content": blog["content"],
            "tags": blog.get("tags", []),
            "likes_count": blog.get("likes_count", 0),
            "comments_count": blog.get("comments_count", 0),
            "created_at": blog["created_at"],
            "liked_by_user": False
        }
        if current_user_id:
            liked = await db.likes.find_one({"user_id": current_user_id, "post_id": blog["id"], "post_type": "blog"})
            item["liked_by_user"] = bool(liked)
        feed_items.append(item)
    
    # Sort by created_at
    feed_items.sort(key=lambda x: x["created_at"], reverse=True)
    return feed_items[:limit]
