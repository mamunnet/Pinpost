"""Health check routes - API status and monitoring endpoints."""
import os
from datetime import datetime, timezone
from fastapi import APIRouter

from ..database import db
from ..config import settings

router = APIRouter()


@router.get("/test")
async def test_endpoint():
    """Simple test endpoint to verify API is working."""
    return {
        "status": "API is working",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "message": "Backend is responding correctly"
    }


@router.get("/debug/env")
async def debug_environment():
    """Debug endpoint to check environment configuration."""
    env_check = {
        "MONGO_URL": settings.MONGO_URL[:50] + "..." if len(settings.MONGO_URL) > 50 else settings.MONGO_URL,
        "DB_NAME": settings.DB_NAME,
        "SECRET_KEY": "SET" if settings.SECRET_KEY != "your-secret-key-change-in-production" else "DEFAULT",
        "FRONTEND_URL": settings.FRONTEND_URL,
        "ENVIRONMENT": settings.ENVIRONMENT
    }
    
    try:
        await db.command("ping")
        db_status = "Connected successfully"
        user_count = await db.users.count_documents({})
        db_details = f"Users collection accessible, count: {user_count}"
    except Exception as e:
        db_status = f"Connection failed: {str(e)}"
        db_details = "Cannot access collections"
    
    return {
        "environment_variables": env_check,
        "database_status": db_status,
        "database_details": db_details,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.get("/health")
async def health_check():
    """Health check endpoint for monitoring and load balancers."""
    try:
        await db.command("ping")
        db_status = "connected"
    except Exception:
        db_status = "disconnected"
    
    return {
        "status": "healthy",
        "service": "pinpost-api",
        "database": db_status,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
