from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, File, UploadFile, WebSocket, WebSocketDisconnect, Body
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import shutil
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
import json
import asyncio
from pymongo.errors import DuplicateKeyError, PyMongoError
from cloudinary_utils import upload_to_cloudinary, delete_from_cloudinary

# Load environment variables (only for local development)
# In production (Docker), environment variables are set via docker-compose.yml
ROOT_DIR = Path(__file__).parent
if os.getenv('ENVIRONMENT') != 'production':
    load_dotenv(ROOT_DIR / '.env')

# MongoDB connection with custom SSL context to bypass handshake issues in production
import ssl
mongo_url = os.environ['MONGO_URL']

# Create a custom SSL context only for production (Docker) environment
if os.getenv('ENVIRONMENT') == 'production':
    try:
        ssl_context = ssl.create_default_context()
        ssl_context.check_hostname = False
        ssl_context.verify_mode = ssl.CERT_NONE
        
        client = AsyncIOMotorClient(
            mongo_url,
            ssl_context=ssl_context,
            serverSelectionTimeoutMS=30000,
            connectTimeoutMS=30000,
        )
        logging.info("MongoDB client created with custom SSL context for production")
    except Exception as e:
        logging.error(f"Failed to create MongoDB client with SSL context: {e}")
        # Fallback to basic connection
        client = AsyncIOMotorClient(
            mongo_url,
            serverSelectionTimeoutMS=30000,
            connectTimeoutMS=30000,
        )
else:
    # Local development - use basic connection without SSL context
    client = AsyncIOMotorClient(
        mongo_url,
        serverSelectionTimeoutMS=30000,
        connectTimeoutMS=30000,
    )
    logging.info("MongoDB client created for local development")
    
db = client[os.environ['DB_NAME']]

# Security
SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
security = HTTPBearer()

# Lifespan context manager for startup/shutdown events
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    try:
        # Verify DB connection and ensure unique indexes
        await db.command('ping')
        await db.users.create_index("email", unique=True)
        await db.users.create_index("username", unique=True)
        logging.info("Database connected; ensured users indexes.")
    except Exception as e:
        logging.error(f"Startup DB initialization failed: {e}")
    
    yield
    
    # Shutdown
    client.close()
    logging.info("MongoDB client closed")

# Create the main app with lifespan handler
app = FastAPI(lifespan=lifespan)
api_router = APIRouter(prefix="/api")

# WebSocket connection manager for real-time notifications
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.user_status: Dict[str, dict] = {}  # Track online status and last seen
        self.typing_status: Dict[str, dict] = {}  # Track typing indicators {conversation_id: {user_id: typing}}
    
    async def connect(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[user_id] = websocket
        self.user_status[user_id] = {
            "online": True,
            "last_seen": datetime.now(timezone.utc).isoformat(),
            "connected_at": datetime.now(timezone.utc).isoformat()
        }
        logging.info(f"WebSocket connected for user: {user_id}")
        
        # Broadcast online status to all connections
        await self.broadcast({
            "type": "user_status",
            "user_id": user_id,
            "online": True,
            "last_seen": self.user_status[user_id]["last_seen"]
        })
        
        # Update user's online status in database
        await db.users.update_one(
            {"id": user_id},
            {"$set": {
                "online": True,
                "last_seen": datetime.now(timezone.utc).isoformat()
            }}
        )
    
    def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
            
        if user_id in self.user_status:
            self.user_status[user_id]["online"] = False
            self.user_status[user_id]["last_seen"] = datetime.now(timezone.utc).isoformat()
            logging.info(f"WebSocket disconnected for user: {user_id}")
    
    async def send_notification(self, user_id: str, message: dict):
        if user_id in self.active_connections:
            try:
                await self.active_connections[user_id].send_json(message)
                logging.info(f"Sent notification to user {user_id}: {message.get('type')}")
            except Exception as e:
                logging.error(f"Error sending notification to {user_id}: {e}")
                self.disconnect(user_id)
    
    async def broadcast(self, message: dict, exclude_user: str = None):
        for user_id, connection in list(self.active_connections.items()):
            if user_id != exclude_user:
                try:
                    await connection.send_json(message)
                except:
                    self.disconnect(user_id)
    
    def is_online(self, user_id: str) -> bool:
        """Check if user is currently online"""
        return user_id in self.user_status and self.user_status[user_id].get("online", False)
    
    def get_user_status(self, user_id: str) -> dict:
        """Get user's online status and last seen"""
        if user_id in self.user_status:
            return self.user_status[user_id]
        return {"online": False, "last_seen": None}
    
    async def set_typing(self, user_id: str, conversation_id: str, typing: bool):
        """Set typing status for a user in a conversation"""
        if conversation_id not in self.typing_status:
            self.typing_status[conversation_id] = {}
        self.typing_status[conversation_id][user_id] = typing
        
        # Get conversation to find other participant
        conversation = await db.conversations.find_one({"id": conversation_id})
        if conversation:
            recipient_id = [p for p in conversation["participants"] if p != user_id][0]
            await self.send_notification(recipient_id, {
                "type": "typing_status",
                "conversation_id": conversation_id,
                "user_id": user_id,
                "typing": typing
            })

manager = ConnectionManager()

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
    name: Optional[str] = ""
    bio: str = ""
    avatar: str = ""
    cover_photo: Optional[str] = ""
    date_of_birth: Optional[str] = ""
    location: Optional[str] = ""
    website: Optional[str] = ""
    profile_completed: bool = False
    followers_count: int = 0
    following_count: int = 0
    created_at: str

class ProfileSetup(BaseModel):
    name: str
    bio: Optional[str] = ""
    avatar: Optional[str] = ""
    cover_photo: Optional[str] = ""
    date_of_birth: Optional[str] = ""
    location: Optional[str] = ""

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

class ShortPostUpdate(BaseModel):
    content: Optional[str] = None

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
    reply_to: Optional[str] = None

class Comment(BaseModel):
    id: str
    user_id: str
    username: str
    user_avatar: str
    post_id: str
    post_type: str
    content: str
    created_at: str
    reply_to: Optional[str] = None

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

# Messaging Models
class MessageCreate(BaseModel):
    content: str = ""
    conversation_id: Optional[str] = None
    recipient_id: Optional[str] = None  # For starting new conversation
    type: Optional[str] = "text"  # text, image, voice
    image_url: Optional[str] = None
    voice_url: Optional[str] = None

class Message(BaseModel):
    id: str
    conversation_id: str
    sender_id: str
    sender_username: str
    sender_avatar: str
    content: str
    type: Optional[str] = "text"
    image_url: Optional[str] = None
    voice_url: Optional[str] = None
    read_by: List[str] = []
    delivered_to: List[str] = []
    created_at: str

class ParticipantDetail(BaseModel):
    user_id: str
    username: str
    avatar: str

class Conversation(BaseModel):
    id: str
    participants: List[str]  # List of user IDs
    participant_details: List[ParticipantDetail]
    last_message: Optional[str] = None
    last_message_at: Optional[str] = None
    unread_count: Dict[str, int] = {}
    created_at: str
    updated_at: str

class UserUpdate(BaseModel):
    username: Optional[str] = None
    name: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    date_of_birth: Optional[str] = None
    avatar: Optional[str] = None
    cover_photo: Optional[str] = None

class StoryCreate(BaseModel):
    content: str
    media_url: Optional[str] = None

class Story(BaseModel):
    id: str
    user_id: str
    username: str
    user_avatar: str
    content: str
    media_url: str
    views_count: int = 0
    created_at: str
    expires_at: str

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
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_optional_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))):
    if credentials is None:
        return None
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        return user_id
    except Exception:
        return None

async def create_notification(user_id: str, notif_type: str, actor_id: str, actor_username: str, actor_avatar: str, message: str, post_id: str = None, post_type: str = None, comment_id: str = None):
    """Helper to create notifications"""
    # Allow self-notifications so users can see their own activity
    
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
    
    # Send real-time notification via WebSocket
    await manager.send_notification(user_id, {
        "type": "new_notification",
        "notification": notification
    })
    
    logging.info(f"Created notification for user {user_id}: {notif_type} from {actor_username}")

# Auth routes
@api_router.post("/auth/register")
async def register(user_data: UserCreate):
    try:
        logging.info(f"Registration attempt for user: {user_data.username}, email: {user_data.email}")
        
        # Check if user exists (pre-check to return friendly error)
        logging.info("Checking if user already exists...")
        existing_user = await db.users.find_one({"$or": [{"email": user_data.email}, {"username": user_data.username}]})
        if existing_user:
            logging.info(f"User already exists: {existing_user.get('username', 'unknown')}")
            raise HTTPException(status_code=400, detail="User already exists")
        
        logging.info("Creating new user...")
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
            "followers_count": 0,
            "following_count": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        logging.info("Inserting user into database...")
        await db.users.insert_one(user)
        
        logging.info("Creating access token...")
        token = create_access_token({"sub": user_id})
        
        # Remove sensitive fields before returning
        user.pop("password_hash", None)
        logging.info(f"Registration successful for user: {user_data.username}")
        return {"token": token, "user": User(**user)}
    except DuplicateKeyError:
        # Handle race condition with unique index
        logging.warning(f"Duplicate key error for user: {user_data.username}")
        raise HTTPException(status_code=400, detail="User already exists")
    except PyMongoError as e:
        logging.error(f"MongoDB error during registration: {str(e)}", exc_info=True)
        raise HTTPException(status_code=503, detail="Service temporarily unavailable")
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Registration error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    try:
        logging.info(f"🔐 Login attempt for email: {credentials.email}")
        
        user = await db.users.find_one({"email": credentials.email})
        if not user:
            logging.warning(f"❌ User not found: {credentials.email}")
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        if not verify_password(credentials.password, user["password_hash"]):
            logging.warning(f"❌ Invalid password for user: {credentials.email}")
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        logging.info(f"✅ Login successful for user: {credentials.email}")
        token = create_access_token({"sub": user["id"]})
        # Remove sensitive fields before returning
        user.pop("password_hash", None)
        return {"token": token, "user": User(**user)}
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"❌ Login error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")

@api_router.get("/auth/me", response_model=User)
async def get_me(user_id: str = Depends(get_current_user)):
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    # Remove sensitive fields before returning
    user.pop("password_hash", None)
    return User(**user)

@api_router.post("/auth/setup-profile", response_model=User)
async def setup_profile(profile_data: ProfileSetup, user_id: str = Depends(get_current_user)):
    # Update user profile
    update_data = {
        "name": profile_data.name,
        "bio": profile_data.bio,
        "avatar": profile_data.avatar,
        "cover_photo": profile_data.cover_photo,
        "date_of_birth": profile_data.date_of_birth,
        "location": profile_data.location,
        "profile_completed": True
    }
    
    result = await db.users.update_one({"id": user_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Return updated user
    updated_user = await db.users.find_one({"id": user_id})
    return User(**updated_user)

@api_router.post("/upload/image")
async def upload_image(
    file: UploadFile = File(...), 
    user_id: str = Depends(get_current_user),
    upload_type: str = "profile"  # profile, cover, post, blog, story, message
):
    """Upload image to Cloudinary with appropriate preset"""
    # Validate file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Validate file size (10MB limit)
    content = await file.read()
    file_size = len(content)
    
    if file_size > 10 * 1024 * 1024:  # 10MB
        raise HTTPException(status_code=400, detail="File size must be less than 10MB")
    
    try:
        # Upload to Cloudinary
        result = upload_to_cloudinary(
            file_content=content,
            filename=file.filename or "image.jpg",
            upload_type=upload_type
        )
        
        return {
            "url": result['url'],
            "public_id": result['public_id'],
            "cloudinary": True
        }
    except Exception as e:
        print(f"Upload error: {e}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@api_router.post("/upload/audio")
async def upload_audio(
    file: UploadFile = File(...), 
    user_id: str = Depends(get_current_user)
):
    """Upload audio file to Cloudinary"""
    # Validate file type
    if not file.content_type.startswith("audio/"):
        raise HTTPException(status_code=400, detail="File must be an audio file")
    
    # Validate file size (10MB limit)
    content = await file.read()
    file_size = len(content)
    
    if file_size > 10 * 1024 * 1024:  # 10MB
        raise HTTPException(status_code=400, detail="File size must be less than 10MB")
    
    try:
        # Upload to Cloudinary as video type (supports audio)
        result = upload_to_cloudinary(
            file_content=content,
            filename=file.filename or "audio.webm",
            upload_type="message"
        )
        
        return {
            "url": result['url'],
            "public_id": result['public_id'],
            "cloudinary": True
        }
    except Exception as e:
        print(f"Upload error: {e}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

# User routes
# People You May Know - Smart recommendation algorithm
@api_router.get("/users/suggestions")
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
        return [User(**u).dict() for u in users]
    
    # Get users current user is already following
    following = await db.follows.find({"follower_id": current_user_id}).to_list(1000)
    following_ids = [f["following_id"] for f in following]
    
    suggestions = []
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
    for user_id in top_suggestion_ids:
        user = await db.users.find_one({"id": user_id})
        if user:
            user_data = User(**user).dict()
            # Check if current user is following this suggested user
            user_data["is_following"] = user_id in following_ids
            user_data["suggestion_score"] = suggestion_scores[user_id]
            result.append(user_data)
    
    # If not enough suggestions, fill with trending users
    if len(result) < limit:
        additional_users = await db.users.find({
            "id": {"$nin": [current_user_id] + top_suggestion_ids}
        }).sort("followers_count", -1).limit(limit - len(result)).to_list(limit - len(result))
        
        for user in additional_users:
            user_data = User(**user).dict()
            # Check if current user is following this user
            user_data["is_following"] = user["id"] in following_ids
            user_data["suggestion_score"] = 0
            result.append(user_data)
    
    return result

# Trending users (must be before dynamic {username} route)
@api_router.get("/users/trending")
async def get_trending_users(limit: int = 5, current_user_id: Optional[str] = Depends(get_optional_user)):
    users = await db.users.find().sort("followers_count", -1).limit(limit).to_list(limit)
    result = []
    for user in users:
        if user["id"] == current_user_id:
            continue
        user_data = User(**user).dict()
        if current_user_id:
            is_following = await db.follows.find_one({"follower_id": current_user_id, "following_id": user["id"]})
            user_data["is_following"] = bool(is_following)
        result.append(user_data)
    return result

@api_router.get("/users/search")
async def search_users(q: str, limit: int = 10, current_user_id: Optional[str] = Depends(get_optional_user)):
    if not q or len(q) < 1:
        return []
    
    # Enhanced search by username, name, and email
    users = await db.users.find({
        "$or": [
            {"username": {"$regex": q, "$options": "i"}},
            {"name": {"$regex": q, "$options": "i"}},
            {"email": {"$regex": q, "$options": "i"}}
        ]
    }).limit(limit).to_list(limit)
    
    result = []
    for u in users:
        user_data = {
            "id": u["id"],
            "username": u["username"],
            "name": u.get("name", ""),
            "avatar": u.get("avatar", ""),
            "bio": u.get("bio", ""),
            "followers_count": u.get("followers_count", 0),
            "following_count": u.get("following_count", 0),
            "is_following": False
        }
        
        # Check if current user is following this user
        if current_user_id:
            is_following = await db.follows.find_one({
                "follower_id": current_user_id,
                "following_id": u["id"]
            })
            user_data["is_following"] = bool(is_following)
        
        result.append(user_data)
    
    return result

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
    # Build filter query based on privacy settings
    filter_query = {}
    
    if current_user_id:
        # Get list of users the current user is following
        following = await db.follows.find({"follower_id": current_user_id}).to_list(1000)
        following_ids = [f["following_id"] for f in following]
        
        # Include own blogs + blogs from followed users
        filter_query = {"author_id": {"$in": following_ids + [current_user_id]}}
    else:
        # For non-logged-in users, show no blogs (privacy protection)
        filter_query = {"author_id": {"$in": []}}
    
    blogs = await db.blog_posts.find(filter_query).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    result = []
    for blog in blogs:
        # Get author info
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
        # Get author info (consistent with other endpoints)
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
async def get_posts(skip: int = 0, limit: int = 50, following_only: bool = False, current_user_id: Optional[str] = Depends(get_optional_user)):
    # Build filter query based on privacy settings
    filter_query = {}
    
    if current_user_id:
        # Get list of users the current user is following
        following = await db.follows.find({"follower_id": current_user_id}).to_list(1000)
        following_ids = [f["following_id"] for f in following]
        
        # Include own posts + posts from followed users
        filter_query = {"author_id": {"$in": following_ids + [current_user_id]}}
    else:
        # For non-logged-in users, show no posts (privacy protection)
        filter_query = {"author_id": {"$in": []}}
    
    posts = await db.short_posts.find(filter_query).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    result = []
    for post in posts:
        # Get author info
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

@api_router.get("/posts/{post_id}", response_model=ShortPost)
async def get_post_by_id(post_id: str, current_user_id: Optional[str] = Depends(get_optional_user)):
    post = await db.short_posts.find_one({"id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Get author info
    author = await db.users.find_one({"id": post["author_id"]})
    
    post_data = ShortPost(**post).dict()
    if author:
        post_data["author_name"] = author.get("name", "")
        post_data["author_avatar"] = author.get("avatar", "")
    
    # Check if current user liked this post
    if current_user_id:
        liked = await db.likes.find_one({"user_id": current_user_id, "post_id": post["id"], "post_type": "post"})
        post_data["liked_by_user"] = bool(liked)
    else:
        post_data["liked_by_user"] = False
    
    return post_data

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

@api_router.put("/posts/{post_id}", response_model=ShortPost)
async def update_post(post_id: str, post_data: ShortPostUpdate, user_id: str = Depends(get_current_user)):
    post = await db.short_posts.find_one({"id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if post["author_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    update_data = {k: v for k, v in post_data.dict().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.short_posts.update_one({"id": post_id}, {"$set": update_data})
    updated_post = await db.short_posts.find_one({"id": post_id})
    
    # Get author info for response
    author = await db.users.find_one({"id": updated_post["author_id"]})
    result = ShortPost(**updated_post).dict()
    if author:
        result["author_name"] = author.get("name", "")
        result["author_avatar"] = author.get("avatar", "")
    
    return result

@api_router.get("/users/{username}/posts", response_model=List[ShortPost])
async def get_user_posts(username: str, current_user_id: Optional[str] = Depends(get_optional_user)):
    user = await db.users.find_one({"username": username})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    posts = await db.short_posts.find({"author_id": user["id"]}).sort("created_at", -1).to_list(100)
    result = []
    for post in posts:
        # Get author info (consistent with other endpoints)
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

# Like routes
@api_router.post("/likes/{post_type}/{post_id}")
async def like_post(post_type: str, post_id: str, user_id: str = Depends(get_current_user)):
    if post_type not in ["blog", "post"]:
        raise HTTPException(status_code=400, detail="Invalid post type")
    
    existing_like = await db.likes.find_one({"user_id": user_id, "post_id": post_id, "post_type": post_type})
    if existing_like:
        raise HTTPException(status_code=400, detail="Already liked")
    
    current_user = await db.users.find_one({"id": user_id})
    collection = db.blog_posts if post_type == "blog" else db.short_posts
    post = await collection.find_one({"id": post_id})
    
    await db.likes.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "post_id": post_id,
        "post_type": post_type,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    await collection.update_one({"id": post_id}, {"$inc": {"likes_count": 1}})
    
    # Create notification
    if post:
        await create_notification(
            user_id=post["author_id"],
            notif_type="like",
            actor_id=user_id,
            actor_username=current_user["username"],
            actor_avatar=current_user.get("avatar", ""),
            message=f"{current_user['username']} liked your {post_type}",
            post_id=post_id,
            post_type=post_type
        )
    
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
    collection = db.blog_posts if post_type == "blog" else db.short_posts
    post = await collection.find_one({"id": post_id})
    
    comment_id = str(uuid.uuid4())
    comment = {
        "id": comment_id,
        "user_id": user_id,
        "username": user["username"],
        "user_avatar": user.get("avatar", ""),
        "post_id": post_id,
        "post_type": post_type,
        "content": comment_data.content,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "reply_to": comment_data.reply_to
    }
    await db.comments.insert_one(comment)
    
    await collection.update_one({"id": post_id}, {"$inc": {"comments_count": 1}})
    
    # Create notification for post owner
    if post:
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
    
    # Create notification for comment being replied to
    if comment_data.reply_to:
        parent_comment = await db.comments.find_one({"id": comment_data.reply_to})
        if parent_comment and parent_comment["user_id"] != user_id:
            await create_notification(
                user_id=parent_comment["user_id"],
                notif_type="reply",
                actor_id=user_id,
                actor_username=user["username"],
                actor_avatar=user.get("avatar", ""),
                message=f"{user['username']} replied to your comment",
                post_id=post_id,
                post_type=post_type,
                comment_id=comment_id
            )
    
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

@api_router.put("/comments/{comment_id}")
async def update_comment(comment_id: str, comment_data: CommentCreate, user_id: str = Depends(get_current_user)):
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

# Notification routes
@api_router.get("/notifications", response_model=List[Notification])
async def get_notifications(current_user_id: str = Depends(get_current_user)):
    notifications = await db.notifications.find({"user_id": current_user_id}).sort("created_at", -1).limit(50).to_list(50)
    return [Notification(**notif) for notif in notifications]

@api_router.put("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, current_user_id: str = Depends(get_current_user)):
    result = await db.notifications.update_one(
        {"id": notification_id, "user_id": current_user_id},
        {"$set": {"read": True}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"message": "Marked as read"}

@api_router.put("/notifications/read-all")
async def mark_all_notifications_read(current_user_id: str = Depends(get_current_user)):
    await db.notifications.update_many(
        {"user_id": current_user_id, "read": False},
        {"$set": {"read": True}}
    )
    return {"message": "All notifications marked as read"}

@api_router.get("/notifications/unread-count")
async def get_unread_count(current_user_id: str = Depends(get_current_user)):
    count = await db.notifications.count_documents({"user_id": current_user_id, "read": False})
    return {"count": count}

# Profile management
@api_router.put("/users/profile")
async def update_profile(profile_data: UserUpdate, current_user_id: str = Depends(get_current_user)):
    update_data = {k: v for k, v in profile_data.dict().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    # Check if username is taken
    if "username" in update_data:
        existing = await db.users.find_one({"username": update_data["username"], "id": {"$ne": current_user_id}})
        if existing:
            raise HTTPException(status_code=400, detail="Username already taken")
    
    await db.users.update_one({"id": current_user_id}, {"$set": update_data})
    updated_user = await db.users.find_one({"id": current_user_id})
    return User(**updated_user)

@api_router.put("/users/avatar")
async def update_avatar(avatar_data: dict, current_user_id: str = Depends(get_current_user)):
    avatar_url = avatar_data.get("avatar", "")
    await db.users.update_one({"id": current_user_id}, {"$set": {"avatar": avatar_url}})
    updated_user = await db.users.find_one({"id": current_user_id})
    return User(**updated_user)

@api_router.delete("/users/avatar")
async def remove_avatar(current_user_id: str = Depends(get_current_user)):
    await db.users.update_one({"id": current_user_id}, {"$set": {"avatar": ""}})
    updated_user = await db.users.find_one({"id": current_user_id})
    return User(**updated_user)

@api_router.put("/users/cover-photo")
async def update_cover_photo(cover_data: dict, current_user_id: str = Depends(get_current_user)):
    cover_url = cover_data.get("cover_photo", "")
    await db.users.update_one({"id": current_user_id}, {"$set": {"cover_photo": cover_url}})
    updated_user = await db.users.find_one({"id": current_user_id})
    return User(**updated_user)

@api_router.delete("/users/cover-photo")
async def remove_cover_photo(current_user_id: str = Depends(get_current_user)):
    await db.users.update_one({"id": current_user_id}, {"$set": {"cover_photo": ""}})
    updated_user = await db.users.find_one({"id": current_user_id})
    return User(**updated_user)

# Removed - moved above username route to fix route conflict

# Messaging routes
@api_router.get("/conversations", response_model=List[Conversation])
async def get_conversations(current_user_id: str = Depends(get_current_user)):
    """Get all conversations for the current user"""
    conversations = await db.conversations.find({
        "participants": current_user_id
    }).sort("updated_at", -1).to_list(100)
    
    return [Conversation(**conv) for conv in conversations]

@api_router.get("/conversations/{conversation_id}/messages", response_model=List[Message])
async def get_conversation_messages(
    conversation_id: str, 
    skip: int = 0,
    limit: int = 50,
    current_user_id: str = Depends(get_current_user)
):
    """Get messages for a specific conversation"""
    # Verify user is participant
    conversation = await db.conversations.find_one({"id": conversation_id})
    if not conversation or current_user_id not in conversation["participants"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    messages = await db.messages.find({
        "conversation_id": conversation_id
    }).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    return [Message(**msg) for msg in reversed(messages)]

@api_router.post("/conversations", response_model=Conversation)
async def create_or_get_conversation(
    recipient_id: str = Body(..., embed=True),
    current_user_id: str = Depends(get_current_user)
):
    """Create a new conversation or get existing one with a user"""
    if recipient_id == current_user_id:
        raise HTTPException(status_code=400, detail="Cannot message yourself")
    
    # Check if users mutually follow each other
    user_follows_recipient = await db.follows.find_one({
        "follower_id": current_user_id,
        "following_id": recipient_id
    })
    recipient_follows_user = await db.follows.find_one({
        "follower_id": recipient_id,
        "following_id": current_user_id
    })
    
    if not (user_follows_recipient and recipient_follows_user):
        raise HTTPException(
            status_code=403, 
            detail="You can only message users who mutually follow each other"
        )
    
    # Check if conversation already exists
    participants_sorted = sorted([current_user_id, recipient_id])
    existing = await db.conversations.find_one({"participants": participants_sorted})
    
    if existing:
        return Conversation(**existing)
    
    # Get user details
    current_user = await db.users.find_one({"id": current_user_id})
    recipient = await db.users.find_one({"id": recipient_id})
    
    # Create new conversation
    conversation_id = str(uuid.uuid4())
    conversation = {
        "id": conversation_id,
        "participants": participants_sorted,
        "participant_details": [
            {
                "user_id": current_user["id"],
                "username": current_user["username"],
                "avatar": current_user.get("avatar", "")
            },
            {
                "user_id": recipient["id"],
                "username": recipient["username"],
                "avatar": recipient.get("avatar", "")
            }
        ],
        "last_message": None,
        "last_message_at": None,
        "unread_count": {current_user_id: 0, recipient_id: 0},
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.conversations.insert_one(conversation)
    return Conversation(**conversation)

@api_router.post("/messages", response_model=Message)
async def send_message(
    message_data: MessageCreate,
    current_user_id: str = Depends(get_current_user)
):
    """Send a message in a conversation"""
    conversation_id = message_data.conversation_id
    
    # Verify conversation exists and user is participant
    conversation = await db.conversations.find_one({"id": conversation_id})
    if not conversation or current_user_id not in conversation["participants"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get sender details
    sender = await db.users.find_one({"id": current_user_id})
    
    # Create message
    message_id = str(uuid.uuid4())
    message = {
        "id": message_id,
        "conversation_id": conversation_id,
        "sender_id": current_user_id,
        "sender_username": sender["username"],
        "sender_avatar": sender.get("avatar", ""),
        "content": message_data.content,
        "type": message_data.type or "text",
        "image_url": message_data.image_url,
        "voice_url": message_data.voice_url,
        "read_by": [current_user_id],  # Sender has read it
        "delivered_to": [],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.messages.insert_one(message)
    
    # Determine last message preview based on type
    last_message_preview = message_data.content
    if message_data.type == "image":
        last_message_preview = "📷 Photo"
    elif message_data.type == "voice":
        last_message_preview = "🎤 Voice message"
    
    # Update conversation
    await db.conversations.update_one(
        {"id": conversation_id},
        {
            "$set": {
                "last_message": last_message_preview,
                "last_message_at": message["created_at"],
                "updated_at": message["created_at"]
            },
            "$inc": {
                f"unread_count.{conversation['participants'][0]}": 0 if conversation['participants'][0] == current_user_id else 1,
                f"unread_count.{conversation['participants'][1]}": 0 if conversation['participants'][1] == current_user_id else 1
            }
        }
    )
    
    # Send real-time message to other participant(s)
    recipient_id = [p for p in conversation["participants"] if p != current_user_id][0]
    
    # Check if recipient is online and mark as delivered
    if manager.is_online(recipient_id):
        await db.messages.update_one(
            {"id": message_id},
            {"$addToSet": {"delivered_to": recipient_id}}
        )
        message["delivered_to"] = [recipient_id]
    
    await manager.send_notification(recipient_id, {
        "type": "new_message",
        "message": Message(**message).dict(),
        "conversation_id": conversation_id
    })
    
    return Message(**message)

@api_router.put("/messages/{message_id}/read")
async def mark_message_read(
    message_id: str,
    current_user_id: str = Depends(get_current_user)
):
    """Mark a message as read"""
    message = await db.messages.find_one({"id": message_id})
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    if current_user_id not in message.get("read_by", []):
        await db.messages.update_one(
            {"id": message_id},
            {"$addToSet": {"read_by": current_user_id}}
        )
    
    return {"message": "Marked as read"}

@api_router.put("/conversations/{conversation_id}/read")
async def mark_conversation_read(
    conversation_id: str,
    current_user_id: str = Depends(get_current_user)
):
    """Mark all messages in a conversation as read"""
    conversation = await db.conversations.find_one({"id": conversation_id})
    if not conversation or current_user_id not in conversation["participants"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Mark all unread messages as read
    await db.messages.update_many(
        {
            "conversation_id": conversation_id,
            "sender_id": {"$ne": current_user_id},
            "read_by": {"$ne": current_user_id}
        },
        {"$addToSet": {"read_by": current_user_id}}
    )
    
    # Reset unread count
    await db.conversations.update_one(
        {"id": conversation_id},
        {"$set": {f"unread_count.{current_user_id}": 0}}
    )
    
    return {"message": "Conversation marked as read"}

@api_router.post("/conversations/{conversation_id}/typing")
async def set_typing_status(
    conversation_id: str,
    typing: bool = Body(..., embed=True),
    current_user_id: str = Depends(get_current_user)
):
    """Set typing status for current user in a conversation"""
    conversation = await db.conversations.find_one({"id": conversation_id})
    if not conversation or current_user_id not in conversation["participants"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await manager.set_typing(current_user_id, conversation_id, typing)
    return {"message": "Typing status updated"}

@api_router.get("/users/{user_id}/status")
async def get_user_online_status(user_id: str):
    """Get user's online status and last seen"""
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get real-time status from ConnectionManager
    status = manager.get_user_status(user_id)
    
    # If not in memory, get from database
    if not status["online"]:
        status = {
            "online": user.get("online", False),
            "last_seen": user.get("last_seen")
        }
    
    return status

@api_router.get("/conversations/unread-count")
async def get_unread_message_count(current_user_id: str = Depends(get_current_user)):
    """Get total unread message count across all conversations"""
    conversations = await db.conversations.find({
        "participants": current_user_id
    }).to_list(1000)
    
    total_unread = sum(conv.get("unread_count", {}).get(current_user_id, 0) for conv in conversations)
    return {"unread_count": total_unread}

@api_router.get("/conversations/check-eligibility/{user_id}")
async def check_messaging_eligibility(
    user_id: str,
    current_user_id: str = Depends(get_current_user)
):
    """Check if current user can message another user (mutual follow check)"""
    if user_id == current_user_id:
        return {"can_message": False, "reason": "Cannot message yourself"}
    
    user_follows = await db.follows.find_one({
        "follower_id": current_user_id,
        "following_id": user_id
    })
    other_follows = await db.follows.find_one({
        "follower_id": user_id,
        "following_id": current_user_id
    })
    
    can_message = bool(user_follows and other_follows)
    return {
        "can_message": can_message,
        "reason": None if can_message else "You must mutually follow each other"
    }

# Stories routes
@api_router.post("/stories", response_model=Story)
async def create_story(story_data: StoryCreate, user_id: str = Depends(get_current_user)):
    user = await db.users.find_one({"id": user_id})
    
    story_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(hours=24)
    
    story = {
        "id": story_id,
        "user_id": user_id,
        "username": user["username"],
        "user_avatar": user.get("avatar", ""),
        "content": story_data.content,
        "media_url": story_data.media_url or "",
        "views_count": 0,
        "created_at": now.isoformat(),
        "expires_at": expires_at.isoformat()
    }
    await db.stories.insert_one(story)
    return Story(**story)

@api_router.get("/stories")
async def get_stories(current_user_id: Optional[str] = Depends(get_optional_user)):
    # Get stories from last 24 hours
    now = datetime.now(timezone.utc)
    cutoff = (now - timedelta(hours=24)).isoformat()
    
    # Get all stories that haven't expired
    all_stories = await db.stories.find({
        "created_at": {"$gte": cutoff}
    }).sort("created_at", -1).to_list(100)
    
    # Group by user - only show latest story per user
    user_stories = {}
    for story in all_stories:
        user_id = story["user_id"]
        if user_id not in user_stories:
            user_stories[user_id] = []
        user_stories[user_id].append(Story(**story))
    
    # Get following list if user is logged in
    following_ids = []
    if current_user_id:
        following = await db.follows.find({"follower_id": current_user_id}).to_list(1000)
        following_ids = [f["following_id"] for f in following]
        following_ids.append(current_user_id)  # Include own stories
    
    # Filter to show only followed users' stories (or all if not logged in)
    result = []
    for user_id, stories in user_stories.items():
        if not current_user_id or user_id in following_ids:
            result.append({
                "user_id": stories[0].user_id,
                "username": stories[0].username,
                "user_avatar": stories[0].user_avatar,
                "story_count": len(stories),
                "latest_story": stories[0],
                "stories": stories
            })
    
    return result

@api_router.get("/stories/user/{user_id}")
async def get_user_stories(user_id: str):
    now = datetime.now(timezone.utc)
    cutoff = (now - timedelta(hours=24)).isoformat()
    
    stories = await db.stories.find({
        "user_id": user_id,
        "created_at": {"$gte": cutoff}
    }).sort("created_at", -1).to_list(100)
    
    return [Story(**story) for story in stories]

@api_router.post("/stories/{story_id}/view")
async def view_story(story_id: str, current_user_id: str = Depends(get_current_user)):
    story = await db.stories.find_one({"id": story_id})
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")
    
    # Check if already viewed
    existing_view = await db.story_views.find_one({
        "story_id": story_id,
        "user_id": current_user_id
    })
    
    if not existing_view:
        await db.story_views.insert_one({
            "id": str(uuid.uuid4()),
            "story_id": story_id,
            "user_id": current_user_id,
            "viewed_at": datetime.now(timezone.utc).isoformat()
        })
        await db.stories.update_one({"id": story_id}, {"$inc": {"views_count": 1}})
    
    return {"message": "Story viewed"}

@api_router.delete("/stories/{story_id}")
async def delete_story(story_id: str, user_id: str = Depends(get_current_user)):
    story = await db.stories.find_one({"id": story_id})
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")
    if story["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.stories.delete_one({"id": story_id})
    await db.story_views.delete_many({"story_id": story_id})
    return {"message": "Story deleted"}

# Feed route - Combined blogs and posts
@api_router.get("/feed")
async def get_feed(skip: int = 0, limit: int = 20, following_only: bool = False, current_user_id: Optional[str] = Depends(get_optional_user)):
    # Build filter query based on privacy settings
    filter_query = {}
    
    if current_user_id:
        # Get list of users the current user is following
        following = await db.follows.find({"follower_id": current_user_id}).to_list(1000)
        following_ids = [f["following_id"] for f in following]
        
        # Include own content + content from followed users
        filter_query = {"author_id": {"$in": following_ids + [current_user_id]}}
    else:
        # For non-logged-in users, show no content (privacy protection)
        filter_query = {"author_id": {"$in": []}}
    
    # Get blogs and posts
    blogs = await db.blog_posts.find(filter_query).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    posts = await db.short_posts.find(filter_query).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    # Process blogs
    blog_items = []
    for blog in blogs:
        # Get author info
        author = await db.users.find_one({"id": blog["author_id"]})
        
        blog_data = BlogPost(**blog).dict()
        blog_data["type"] = "blog"
        if author:
            blog_data["author_name"] = author.get("name", "")
            blog_data["author_avatar"] = author.get("avatar", "")
        
        if current_user_id:
            liked = await db.likes.find_one({"user_id": current_user_id, "post_id": blog["id"], "post_type": "blog"})
            blog_data["liked_by_user"] = bool(liked)
        blog_items.append(blog_data)
    
    # Process posts
    post_items = []
    for post in posts:
        # Get author info
        author = await db.users.find_one({"id": post["author_id"]})
        
        post_data = ShortPost(**post).dict()
        post_data["type"] = "post"
        if author:
            post_data["author_name"] = author.get("name", "")
            post_data["author_avatar"] = author.get("avatar", "")
        
        if current_user_id:
            liked = await db.likes.find_one({"user_id": current_user_id, "post_id": post["id"], "post_type": "post"})
            post_data["liked_by_user"] = bool(liked)
        post_items.append(post_data)
    
    # Combine and sort by created_at
    combined = blog_items + post_items
    combined.sort(key=lambda x: x["created_at"], reverse=True)
    
    return combined[:limit]

# WebSocket endpoint for real-time notifications and messaging
@app.websocket("/ws/notifications/{user_id}")
async def websocket_notifications(websocket: WebSocket, user_id: str):
    await manager.connect(user_id, websocket)
    try:
        while True:
            # Keep connection alive and receive any ping/pong messages or commands
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
            elif data.startswith("{"):
                # Handle JSON commands (typing indicators, etc.)
                try:
                    command = json.loads(data)
                    if command.get("type") == "typing":
                        await manager.set_typing(
                            user_id,
                            command.get("conversation_id"),
                            command.get("typing", False)
                        )
                except json.JSONDecodeError:
                    pass
    except WebSocketDisconnect:
        manager.disconnect(user_id)
        
        # Update user offline status in database
        await db.users.update_one(
            {"id": user_id},
            {"$set": {
                "online": False,
                "last_seen": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        # Broadcast offline status
        await manager.broadcast({
            "type": "user_status",
            "user_id": user_id,
            "online": False,
            "last_seen": datetime.now(timezone.utc).isoformat()
        })
        
        logging.info(f"WebSocket disconnected for user: {user_id}")
    except Exception as e:
        logging.error(f"WebSocket error for user {user_id}: {e}")
        manager.disconnect(user_id)
        
        # Update user offline status in database
        await db.users.update_one(
            {"id": user_id},
            {"$set": {
                "online": False,
                "last_seen": datetime.now(timezone.utc).isoformat()
            }}
        )

# Health check endpoint
@api_router.get("/test")
async def test_endpoint():
    """Simple test endpoint to verify API is working"""
    return {
        "status": "API is working",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "message": "Backend is responding correctly"
    }

@api_router.get("/debug/env")
async def debug_environment():
    """Debug endpoint to check environment variables and MongoDB connection"""
    try:
        # Check environment variables
        env_check = {
            "MONGO_URL": os.environ.get('MONGO_URL', 'NOT SET')[:50] + "..." if os.environ.get('MONGO_URL') else 'NOT SET',
            "DB_NAME": os.environ.get('DB_NAME', 'NOT SET'),
            "SECRET_KEY": 'SET' if os.environ.get('SECRET_KEY') else 'NOT SET',
            "FRONTEND_URL": os.environ.get('FRONTEND_URL', 'NOT SET'),
            "ENVIRONMENT": os.environ.get('ENVIRONMENT', 'NOT SET')
        }
        
        # Test MongoDB connection
        try:
            await db.command('ping')
            db_status = "Connected successfully"
            
            # Test user collection access
            user_count = await db.users.count_documents({})
            db_details = f"Users collection accessible, count: {user_count}"
        except Exception as db_error:
            db_status = f"Connection failed: {str(db_error)}"
            db_details = "Cannot access collections"
        
        return {
            "environment_variables": env_check,
            "database_status": db_status,
            "database_details": db_details,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        return {
            "error": f"Debug endpoint failed: {str(e)}",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

@api_router.get("/health")
async def health_check():
    """Health check endpoint for monitoring and load balancers"""
    try:
        # Check MongoDB connection
        await db.command('ping')
        db_status = "connected"
    except Exception as e:
        logging.warning(f"Health check: MongoDB connection issue: {e}")
        db_status = "disconnected"
    
    return {
        "status": "healthy",
        "service": "pinpost-api",
        "database": db_status,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

# Include router
app.include_router(api_router)

# Add a simple root endpoint for health checks
@app.get("/")
async def root():
    return {"message": "Pinpost Backend API", "status": "running"}

# Mount static files for uploaded images
uploads_dir = Path("uploads")
uploads_dir.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Configure CORS using CORS_ORIGINS or FRONTEND_URL
origins_env = os.environ.get('CORS_ORIGINS') or os.environ.get('FRONTEND_URL', '*')
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=origins_env.split(',') if origins_env else ['*'],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
