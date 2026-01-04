"""Short post routes - CRUD for short posts."""
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Depends
import uuid
from datetime import datetime, timezone

from ..database import db
from ..models import ShortPost, ShortPostCreate, ShortPostUpdate
from ..dependencies import get_current_user, get_optional_user

router = APIRouter()


@router.post("/posts", response_model=ShortPost)
async def create_post(post_data: ShortPostCreate, user_id: str = Depends(get_current_user)):
    """Create a new short post."""
    user = await db.users.find_one({"id": user_id})
    
    post_id = str(uuid.uuid4())
    post = {
        "id": post_id,
        "author_id": user_id,
        "author_username": user["username"],
        "author_avatar": user.get("avatar", ""),
        "content": post_data.content,
        "likes_count": 0,
        "comments_count": 0,
        "shares_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.short_posts.insert_one(post)
    return ShortPost(**post)


@router.get("/posts", response_model=List[ShortPost])
async def get_posts(skip: int = 0, limit: int = 50, current_user_id: Optional[str] = Depends(get_optional_user)):
    """Get all posts with pagination."""
    posts = await db.short_posts.find().sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    result = []
    for post in posts:
        author = await db.users.find_one({"id": post["author_id"]})
        post_data = ShortPost(**post).dict()
        if author:
            post_data["author_name"] = author.get("name", "")
            post_data["author_avatar"] = author.get("avatar", "")
        
        if current_user_id:
            liked = await db.likes.find_one({"user_id": current_user_id, "post_id": post["id"], "post_type": "post"})
            post_data["liked_by_user"] = bool(liked)
        result.append(post_data)
    
    return result


@router.get("/posts/{post_id}", response_model=ShortPost)
async def get_post_by_id(post_id: str, current_user_id: Optional[str] = Depends(get_optional_user)):
    """Get a single post by ID."""
    post = await db.short_posts.find_one({"id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    author = await db.users.find_one({"id": post["author_id"]})
    post_data = ShortPost(**post).dict()
    if author:
        post_data["author_name"] = author.get("name", "")
        post_data["author_avatar"] = author.get("avatar", "")
    
    if current_user_id:
        liked = await db.likes.find_one({"user_id": current_user_id, "post_id": post["id"], "post_type": "post"})
        post_data["liked_by_user"] = bool(liked)
    else:
        post_data["liked_by_user"] = False
    
    return post_data


@router.put("/posts/{post_id}", response_model=ShortPost)
async def update_post(post_id: str, post_data: ShortPostUpdate, user_id: str = Depends(get_current_user)):
    """Update a post."""
    post = await db.short_posts.find_one({"id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if post["author_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    update_data = {k: v for k, v in post_data.dict().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.short_posts.update_one({"id": post_id}, {"$set": update_data})
    updated_post = await db.short_posts.find_one({"id": post_id})
    
    author = await db.users.find_one({"id": updated_post["author_id"]})
    result = ShortPost(**updated_post).dict()
    if author:
        result["author_name"] = author.get("name", "")
        result["author_avatar"] = author.get("avatar", "")
    
    return result


@router.delete("/posts/{post_id}")
async def delete_post(post_id: str, user_id: str = Depends(get_current_user)):
    """Delete a post."""
    post = await db.short_posts.find_one({"id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if post["author_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.short_posts.delete_one({"id": post_id})
    await db.likes.delete_many({"post_id": post_id, "post_type": "post"})
    await db.comments.delete_many({"post_id": post_id, "post_type": "post"})
    return {"message": "Post deleted successfully"}


@router.get("/users/{username}/posts", response_model=List[ShortPost])
async def get_user_posts(username: str, skip: int = 0, limit: int = 20, current_user_id: Optional[str] = Depends(get_optional_user)):
    """Get posts by a specific user."""
    user = await db.users.find_one({"username": username})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    posts = await db.short_posts.find({"author_id": user["id"]}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    result = []
    for post in posts:
        author = await db.users.find_one({"id": post["author_id"]})
        post_data = ShortPost(**post).dict()
        if author:
            post_data["author_name"] = author.get("name", "")
            post_data["author_avatar"] = author.get("avatar", "")
        
        if current_user_id:
            liked = await db.likes.find_one({"user_id": current_user_id, "post_id": post["id"], "post_type": "post"})
            post_data["liked_by_user"] = bool(liked)
        result.append(post_data)
    
    return result
