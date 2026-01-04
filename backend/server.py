"""
Pinpost Backend Server
Legacy entry point for backward compatibility.

Usage:
    uvicorn server:app --reload --host 0.0.0.0 --port 8000
    
Or use the new modular structure:
    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
"""

# Import app from new modular structure
from app.main import app

# This allows: uvicorn server:app to still work
__all__ = ["app"]
