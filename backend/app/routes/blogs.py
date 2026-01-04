"""Blog routes - CRUD for blog posts."""
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Depends
import uuid
from datetime import datetime, timezone

from ..database import db
from ..models import BlogPost, BlogPostCreate, BlogPostUpdate
from ..dependencies import get_current_user, get_optional_user

router = APIRouter()


@router.post("/blogs", response_model=BlogPost)
async def create_blog(blog_data: BlogPostCreate, user_id: str = Depends(get_current_user)):
    """Create a new blog post."""
    user = await db.users.find_one({"id": user_id})
    
    blog_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    blog = {
        "id": blog_id,
        "author_id": user_id,
        "author_username": user["username"],
        "author_avatar": user.get("avatar", ""),
        "title": blog_data.title,
        "content": blog_data.content,
        "excerpt": blog_data.excerpt or blog_data.content[:150] + "...",
        "cover_image": blog_data.cover_image or "",
        "tags": blog_data.tags,
        "likes_count": 0,
        "comments_count": 0,
        "shares_count": 0,
        "created_at": now,
        "updated_at": now
    }
    await db.blog_posts.insert_one(blog)
    return BlogPost(**blog)


@router.get("/blogs", response_model=List[BlogPost])
async def get_blogs(skip: int = 0, limit: int = 20, current_user_id: Optional[str] = Depends(get_optional_user)):
    """Get all blogs with pagination."""
    blogs = await db.blog_posts.find().sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    result = []
    for blog in blogs:
        author = await db.users.find_one({"id": blog["author_id"]})
        blog_data = BlogPost(**blog).dict()
        if author:
            blog_data["author_name"] = author.get("name", "")
            blog_data["author_avatar"] = author.get("avatar", "")
        
        if current_user_id:
            liked = await db.likes.find_one({"user_id": current_user_id, "post_id": blog["id"], "post_type": "blog"})
            blog_data["liked_by_user"] = bool(liked)
        result.append(blog_data)
    
    return result


@router.get("/blogs/{blog_id}", response_model=BlogPost)
async def get_blog(blog_id: str, current_user_id: Optional[str] = Depends(get_optional_user)):
    """Get a single blog by ID."""
    blog = await db.blog_posts.find_one({"id": blog_id})
    if not blog:
        raise HTTPException(status_code=404, detail="Blog not found")
    
    blog_data = BlogPost(**blog).dict()
    if current_user_id:
        liked = await db.likes.find_one({"user_id": current_user_id, "post_id": blog["id"], "post_type": "blog"})
        blog_data["liked_by_user"] = bool(liked)
    
    return blog_data


@router.put("/blogs/{blog_id}", response_model=BlogPost)
async def update_blog(blog_id: str, blog_data: BlogPostUpdate, user_id: str = Depends(get_current_user)):
    """Update a blog."""
    blog = await db.blog_posts.find_one({"id": blog_id})
    if not blog:
        raise HTTPException(status_code=404, detail="Blog not found")
    if blog["author_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    update_data = {k: v for k, v in blog_data.dict().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.blog_posts.update_one({"id": blog_id}, {"$set": update_data})
    updated_blog = await db.blog_posts.find_one({"id": blog_id})
    return BlogPost(**updated_blog)


@router.delete("/blogs/{blog_id}")
async def delete_blog(blog_id: str, user_id: str = Depends(get_current_user)):
    """Delete a blog."""
    blog = await db.blog_posts.find_one({"id": blog_id})
    if not blog:
        raise HTTPException(status_code=404, detail="Blog not found")
    if blog["author_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.blog_posts.delete_one({"id": blog_id})
    await db.likes.delete_many({"post_id": blog_id, "post_type": "blog"})
    await db.comments.delete_many({"post_id": blog_id, "post_type": "blog"})
    return {"message": "Blog deleted successfully"}


@router.get("/users/{username}/blogs", response_model=List[BlogPost])
async def get_user_blogs(username: str, current_user_id: Optional[str] = Depends(get_optional_user)):
    """Get blogs by a specific user."""
    user = await db.users.find_one({"username": username})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    blogs = await db.blog_posts.find({"author_id": user["id"]}).sort("created_at", -1).to_list(100)
    
    result = []
    for blog in blogs:
        author = await db.users.find_one({"id": blog["author_id"]})
        blog_data = BlogPost(**blog).dict()
        if author:
            blog_data["author_name"] = author.get("name", "")
            blog_data["author_avatar"] = author.get("avatar", "")
        
        if current_user_id:
            liked = await db.likes.find_one({"user_id": current_user_id, "post_id": blog["id"], "post_type": "blog"})
            blog_data["liked_by_user"] = bool(liked)
        result.append(blog_data)
    
    return result
