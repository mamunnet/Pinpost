"""
Pinpost Database Connection
MongoDB client and database instance.
"""
import os
import ssl
import logging
from motor.motor_asyncio import AsyncIOMotorClient
from .config import settings

# MongoDB connection with custom SSL context for production
if settings.ENVIRONMENT == 'production':
    try:
        ssl_context = ssl.create_default_context()
        ssl_context.check_hostname = False
        ssl_context.verify_mode = ssl.CERT_NONE
        
        client = AsyncIOMotorClient(
            settings.MONGO_URL,
            ssl_context=ssl_context,
            serverSelectionTimeoutMS=30000,
            connectTimeoutMS=30000,
            maxPoolSize=50,
            retryWrites=True,
        )
        logging.info("MongoDB client created with SSL context for production")
    except Exception as e:
        logging.error(f"Failed to create production MongoDB client: {e}")
        # Fallback without SSL context
        client = AsyncIOMotorClient(
            settings.MONGO_URL,
            serverSelectionTimeoutMS=30000,
            connectTimeoutMS=30000,
        )
else:
    # Local development - simple connection
    client = AsyncIOMotorClient(
        settings.MONGO_URL,
        serverSelectionTimeoutMS=10000,
        connectTimeoutMS=10000,
    )
    logging.info("MongoDB client created for local development")

# Database instance
db = client[settings.DB_NAME]
