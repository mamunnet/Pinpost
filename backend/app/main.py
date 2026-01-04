"""
Pinpost Backend - Main FastAPI Application
Modular architecture with separated routes, models, and services.
"""
import logging
import uuid
from pathlib import Path
from datetime import datetime, timezone
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

# Configure logging FIRST (before any other code runs)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

from .config import settings
from .database import db, client
from .routes import api_router
from .services import hash_password, manager


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler - startup and shutdown events."""
    # Startup
    try:
        await db.command('ping')
        await db.users.create_index("email", unique=True)
        await db.users.create_index("username", unique=True)
        logging.info("Database connected; ensured users indexes.")
        
        # Create admin user if not exists
        await create_admin_user()
    except Exception as e:
        logging.error(f"Startup DB initialization failed: {e}")
    
    yield
    
    # Shutdown
    client.close()
    logging.info("MongoDB client closed")


async def create_admin_user():
    """Create admin user on startup if credentials are configured in .env."""
    print(f"[DEBUG] create_admin_user called. ADMIN_EMAIL={settings.ADMIN_EMAIL}")
    
    # Skip if admin credentials not configured
    if not settings.ADMIN_EMAIL or not settings.ADMIN_USERNAME or not settings.ADMIN_PASSWORD:
        logging.warning("⚠️  Admin credentials not set in .env - skipping admin user creation")
        logging.warning("   Add ADMIN_EMAIL, ADMIN_USERNAME, ADMIN_PASSWORD to .env to create admin")
        return
    
    try:
        existing_admin = await db.users.find_one({"email": settings.ADMIN_EMAIL})
        if existing_admin:
            if not existing_admin.get("is_admin"):
                await db.users.update_one(
                    {"email": settings.ADMIN_EMAIL},
                    {"$set": {"is_admin": True}}
                )
                logging.info(f"Updated existing user {settings.ADMIN_EMAIL} to admin")
            else:
                logging.info(f"Admin user {settings.ADMIN_EMAIL} already exists")
            return
        
        admin_user = {
            "id": str(uuid.uuid4()),
            "username": settings.ADMIN_USERNAME,
            "email": settings.ADMIN_EMAIL,
            "password_hash": hash_password(settings.ADMIN_PASSWORD),
            "name": "Administrator",
            "bio": "Platform Administrator",
            "avatar": "",
            "cover_photo": "",
            "date_of_birth": "",
            "location": "",
            "profile_completed": True,
            "is_admin": True,
            "followers_count": 0,
            "following_count": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.users.insert_one(admin_user)
        logging.info(f"✅ Admin user created: {settings.ADMIN_EMAIL}")
    except Exception as e:
        logging.error(f"Failed to create admin user: {e}")


# Create FastAPI app
app = FastAPI(
    title="Pinpost API",
    description="Social Media & Blogging Platform API",
    version="1.0.0",
    lifespan=lifespan
)

# Include API router
app.include_router(api_router)


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint."""
    return {"message": "Pinpost Backend API", "status": "running"}


# WebSocket endpoint for real-time notifications
@app.websocket("/ws/notifications/{user_id}")
async def websocket_notifications(websocket: WebSocket, user_id: str):
    """WebSocket endpoint for real-time notifications and messaging."""
    await manager.connect(user_id, websocket)
    try:
        while True:
            data = await websocket.receive_json()
            
            if data.get("type") == "ping":
                await websocket.send_json({"type": "pong"})
            elif data.get("type") == "typing":
                await manager.set_typing(
                    user_id,
                    data.get("conversation_id"),
                    data.get("typing", False)
                )
    except WebSocketDisconnect:
        manager.disconnect(user_id)
        await manager.broadcast({
            "type": "user_status",
            "user_id": user_id,
            "online": False,
            "last_seen": datetime.now(timezone.utc).isoformat()
        })


# Mount static files for uploads
uploads_dir = Path("uploads")
uploads_dir.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=settings.cors_origins_list,
    allow_methods=["*"],
    allow_headers=["*"],
)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
