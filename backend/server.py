from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
security = HTTPBearer()

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Models
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    bio: Optional[str] = ""

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    id: str
    username: str
    email: str
    bio: str = ""
    avatar: str = ""
    followers_count: int = 0
    following_count: int = 0
    created_at: str

class BlogPostCreate(BaseModel):
    title: str
    content: str
    excerpt: Optional[str] = ""
    cover_image: Optional[str] = ""
    tags: List[str] = []

class BlogPostUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    excerpt: Optional[str] = None
    cover_image: Optional[str] = None
    tags: Optional[List[str]] = None

class BlogPost(BaseModel):
    id: str
    author_id: str
    author_username: str
    author_avatar: str
    title: str
    content: str
    excerpt: str
    cover_image: str
    tags: List[str]
    likes_count: int = 0
    comments_count: int = 0
    shares_count: int = 0
    created_at: str
    updated_at: str
    liked_by_user: bool = False

class ShortPostCreate(BaseModel):
    content: str

class ShortPost(BaseModel):
    id: str
    author_id: str
    author_username: str
    author_avatar: str
    content: str
    likes_count: int = 0
    comments_count: int = 0
    shares_count: int = 0
    created_at: str
    liked_by_user: bool = False

class CommentCreate(BaseModel):
    content: str

class Comment(BaseModel):
    id: str
    user_id: str
    username: str
    user_avatar: str
    post_id: str
    post_type: str
    content: str
    created_at: str

class Notification(BaseModel):
    id: str
    user_id: str
    type: str  # follow, like, comment, reply
    actor_id: str
    actor_username: str
    actor_avatar: str
    post_id: Optional[str] = None
    post_type: Optional[str] = None
    comment_id: Optional[str] = None
    message: str
    read: bool = False
    created_at: str

class UserUpdate(BaseModel):
    username: Optional[str] = None
    bio: Optional[str] = None
    avatar: Optional[str] = None

# Helper functions
def hash_password(password: str) -> str:
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    password_bytes = plain_password.encode('utf-8')
    hashed_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(password_bytes, hashed_bytes)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=7)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_optional_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))):
    if credentials is None:
        return None
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        return user_id
    except:
        return None

async def create_notification(user_id: str, notif_type: str, actor_id: str, actor_username: str, actor_avatar: str, message: str, post_id: str = None, post_type: str = None, comment_id: str = None):
    """Helper to create notifications"""
    if user_id == actor_id:
        return  # Don't notify yourself
    
    notification = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "type": notif_type,
        "actor_id": actor_id,
        "actor_username": actor_username,
        "actor_avatar": actor_avatar,
        "post_id": post_id,
        "post_type": post_type,
        "comment_id": comment_id,
        "message": message,
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.notifications.insert_one(notification)

# Auth routes
@api_router.post("/auth/register")
async def register(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"$or": [{"email": user_data.email}, {"username": user_data.username}]})
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")
    
    user_id = str(uuid.uuid4())
    user = {
        "id": user_id,
        "username": user_data.username,
        "email": user_data.email,
        "password_hash": hash_password(user_data.password),
        "bio": user_data.bio,
        "avatar": "",
        "followers_count": 0,
        "following_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user)
    
    token = create_access_token({"sub": user_id})
    return {"token": token, "user": User(**user)}

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token({"sub": user["id"]})
    return {"token": token, "user": User(**user)}

@api_router.get("/auth/me", response_model=User)
async def get_me(user_id: str = Depends(get_current_user)):
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return User(**user)

# User routes
@api_router.get("/users/{username}")
async def get_user_profile(username: str, current_user_id: Optional[str] = Depends(get_optional_user)):
    user = await db.users.find_one({"username": username})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_data = User(**user).dict()
    user_data["is_following"] = False
    if current_user_id:
        is_following = await db.follows.find_one({"follower_id": current_user_id, "following_id": user["id"]})
        user_data["is_following"] = bool(is_following)
    
    return user_data

@api_router.post("/users/{user_id}/follow")
async def follow_user(user_id: str, current_user_id: str = Depends(get_current_user)):
    if user_id == current_user_id:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")
    
    existing_follow = await db.follows.find_one({"follower_id": current_user_id, "following_id": user_id})
    if existing_follow:
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

@api_router.delete("/users/{user_id}/follow")
async def unfollow_user(user_id: str, current_user_id: str = Depends(get_current_user)):
    result = await db.follows.delete_one({"follower_id": current_user_id, "following_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=400, detail="Not following")
    
    await db.users.update_one({"id": user_id}, {"$inc": {"followers_count": -1}})
    await db.users.update_one({"id": current_user_id}, {"$inc": {"following_count": -1}})
    
    return {"message": "Unfollowed successfully"}

# Blog post routes
@api_router.post("/blogs", response_model=BlogPost)
async def create_blog(blog_data: BlogPostCreate, user_id: str = Depends(get_current_user)):
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
        "excerpt": blog_data.excerpt or blog_data.content[:200],
        "cover_image": blog_data.cover_image,
        "tags": blog_data.tags,
        "likes_count": 0,
        "comments_count": 0,
        "shares_count": 0,
        "created_at": now,
        "updated_at": now
    }
    await db.blog_posts.insert_one(blog)
    return BlogPost(**blog)

@api_router.get("/blogs", response_model=List[BlogPost])
async def get_blogs(skip: int = 0, limit: int = 20, current_user_id: Optional[str] = Depends(get_optional_user)):
    blogs = await db.blog_posts.find().sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    result = []
    for blog in blogs:
        blog_data = BlogPost(**blog).dict()
        if current_user_id:
            liked = await db.likes.find_one({"user_id": current_user_id, "post_id": blog["id"], "post_type": "blog"})
            blog_data["liked_by_user"] = bool(liked)
        result.append(blog_data)
    
    return result

@api_router.get("/blogs/{blog_id}", response_model=BlogPost)
async def get_blog(blog_id: str, current_user_id: Optional[str] = Depends(get_optional_user)):
    blog = await db.blog_posts.find_one({"id": blog_id})
    if not blog:
        raise HTTPException(status_code=404, detail="Blog not found")
    
    blog_data = BlogPost(**blog).dict()
    if current_user_id:
        liked = await db.likes.find_one({"user_id": current_user_id, "post_id": blog_id, "post_type": "blog"})
        blog_data["liked_by_user"] = bool(liked)
    
    return blog_data

@api_router.put("/blogs/{blog_id}", response_model=BlogPost)
async def update_blog(blog_id: str, blog_data: BlogPostUpdate, user_id: str = Depends(get_current_user)):
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

@api_router.delete("/blogs/{blog_id}")
async def delete_blog(blog_id: str, user_id: str = Depends(get_current_user)):
    blog = await db.blog_posts.find_one({"id": blog_id})
    if not blog:
        raise HTTPException(status_code=404, detail="Blog not found")
    if blog["author_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.blog_posts.delete_one({"id": blog_id})
    await db.likes.delete_many({"post_id": blog_id, "post_type": "blog"})
    await db.comments.delete_many({"post_id": blog_id, "post_type": "blog"})
    return {"message": "Blog deleted successfully"}

@api_router.get("/users/{username}/blogs", response_model=List[BlogPost])
async def get_user_blogs(username: str, current_user_id: Optional[str] = Depends(get_optional_user)):
    user = await db.users.find_one({"username": username})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    blogs = await db.blog_posts.find({"author_id": user["id"]}).sort("created_at", -1).to_list(100)
    result = []
    for blog in blogs:
        blog_data = BlogPost(**blog).dict()
        if current_user_id:
            liked = await db.likes.find_one({"user_id": current_user_id, "post_id": blog["id"], "post_type": "blog"})
            blog_data["liked_by_user"] = bool(liked)
        result.append(blog_data)
    
    return result

# Short post routes
@api_router.post("/posts", response_model=ShortPost)
async def create_post(post_data: ShortPostCreate, user_id: str = Depends(get_current_user)):
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

@api_router.get("/posts", response_model=List[ShortPost])
async def get_posts(skip: int = 0, limit: int = 50, current_user_id: Optional[str] = Depends(get_optional_user)):
    posts = await db.short_posts.find().sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    result = []
    for post in posts:
        post_data = ShortPost(**post).dict()
        if current_user_id:
            liked = await db.likes.find_one({"user_id": current_user_id, "post_id": post["id"], "post_type": "post"})
            post_data["liked_by_user"] = bool(liked)
        result.append(post_data)
    
    return result

@api_router.delete("/posts/{post_id}")
async def delete_post(post_id: str, user_id: str = Depends(get_current_user)):
    post = await db.short_posts.find_one({"id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if post["author_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.short_posts.delete_one({"id": post_id})
    await db.likes.delete_many({"post_id": post_id, "post_type": "post"})
    await db.comments.delete_many({"post_id": post_id, "post_type": "post"})
    return {"message": "Post deleted successfully"}

@api_router.get("/users/{username}/posts", response_model=List[ShortPost])
async def get_user_posts(username: str, current_user_id: Optional[str] = Depends(get_optional_user)):
    user = await db.users.find_one({"username": username})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    posts = await db.short_posts.find({"author_id": user["id"]}).sort("created_at", -1).to_list(100)
    result = []
    for post in posts:
        post_data = ShortPost(**post).dict()
        if current_user_id:
            liked = await db.likes.find_one({"user_id": current_user_id, "post_id": post["id"], "post_type": "post"})
            post_data["liked_by_user"] = bool(liked)
        result.append(post_data)
    
    return result

# Like routes
@api_router.post("/likes/{post_type}/{post_id}")
async def like_post(post_type: str, post_id: str, user_id: str = Depends(get_current_user)):
    if post_type not in ["blog", "post"]:
        raise HTTPException(status_code=400, detail="Invalid post type")
    
    existing_like = await db.likes.find_one({"user_id": user_id, "post_id": post_id, "post_type": post_type})
    if existing_like:
        raise HTTPException(status_code=400, detail="Already liked")
    
    await db.likes.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "post_id": post_id,
        "post_type": post_type,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    collection = db.blog_posts if post_type == "blog" else db.short_posts
    await collection.update_one({"id": post_id}, {"$inc": {"likes_count": 1}})
    
    return {"message": "Liked successfully"}

@api_router.delete("/likes/{post_type}/{post_id}")
async def unlike_post(post_type: str, post_id: str, user_id: str = Depends(get_current_user)):
    result = await db.likes.delete_one({"user_id": user_id, "post_id": post_id, "post_type": post_type})
    if result.deleted_count == 0:
        raise HTTPException(status_code=400, detail="Not liked")
    
    collection = db.blog_posts if post_type == "blog" else db.short_posts
    await collection.update_one({"id": post_id}, {"$inc": {"likes_count": -1}})
    
    return {"message": "Unliked successfully"}

# Comment routes
@api_router.post("/comments/{post_type}/{post_id}", response_model=Comment)
async def create_comment(post_type: str, post_id: str, comment_data: CommentCreate, user_id: str = Depends(get_current_user)):
    if post_type not in ["blog", "post"]:
        raise HTTPException(status_code=400, detail="Invalid post type")
    
    user = await db.users.find_one({"id": user_id})
    
    comment_id = str(uuid.uuid4())
    comment = {
        "id": comment_id,
        "user_id": user_id,
        "username": user["username"],
        "user_avatar": user.get("avatar", ""),
        "post_id": post_id,
        "post_type": post_type,
        "content": comment_data.content,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.comments.insert_one(comment)
    
    collection = db.blog_posts if post_type == "blog" else db.short_posts
    await collection.update_one({"id": post_id}, {"$inc": {"comments_count": 1}})
    
    return Comment(**comment)

@api_router.get("/comments/{post_type}/{post_id}", response_model=List[Comment])
async def get_comments(post_type: str, post_id: str):
    comments = await db.comments.find({"post_id": post_id, "post_type": post_type}).sort("created_at", -1).to_list(100)
    return [Comment(**comment) for comment in comments]

@api_router.delete("/comments/{comment_id}")
async def delete_comment(comment_id: str, user_id: str = Depends(get_current_user)):
    comment = await db.comments.find_one({"id": comment_id})
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    if comment["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.comments.delete_one({"id": comment_id})
    
    collection = db.blog_posts if comment["post_type"] == "blog" else db.short_posts
    await collection.update_one({"id": comment["post_id"]}, {"$inc": {"comments_count": -1}})
    
    return {"message": "Comment deleted successfully"}

# Feed route - Combined blogs and posts
@api_router.get("/feed")
async def get_feed(skip: int = 0, limit: int = 20, current_user_id: Optional[str] = Depends(get_optional_user)):
    # Get blogs and posts
    blogs = await db.blog_posts.find().sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    posts = await db.short_posts.find().sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    # Process blogs
    blog_items = []
    for blog in blogs:
        blog_data = BlogPost(**blog).dict()
        blog_data["type"] = "blog"
        if current_user_id:
            liked = await db.likes.find_one({"user_id": current_user_id, "post_id": blog["id"], "post_type": "blog"})
            blog_data["liked_by_user"] = bool(liked)
        blog_items.append(blog_data)
    
    # Process posts
    post_items = []
    for post in posts:
        post_data = ShortPost(**post).dict()
        post_data["type"] = "post"
        if current_user_id:
            liked = await db.likes.find_one({"user_id": current_user_id, "post_id": post["id"], "post_type": "post"})
            post_data["liked_by_user"] = bool(liked)
        post_items.append(post_data)
    
    # Combine and sort by created_at
    combined = blog_items + post_items
    combined.sort(key=lambda x: x["created_at"], reverse=True)
    
    return combined[:limit]

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
