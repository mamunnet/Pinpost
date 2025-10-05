#!/usr/bin/env python3
"""
Startup script to diagnose container startup issues
"""
import os
import sys
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def check_environment():
    """Check all environment variables"""
    logger.info("=== ENVIRONMENT VARIABLE CHECK ===")
    
    required_vars = [
        'MONGO_URL', 'DB_NAME', 'SECRET_KEY', 'FRONTEND_URL', 
        'ENVIRONMENT', 'MAX_FILE_SIZE', 'UPLOAD_DIR'
    ]
    
    for var in required_vars:
        value = os.getenv(var)
        if value:
            # Mask sensitive values
            display_value = value[:20] + "..." if var in ['MONGO_URL', 'SECRET_KEY'] else value
            logger.info(f"✅ {var}: {display_value}")
        else:
            logger.error(f"❌ {var}: NOT SET")
    
    logger.info(f"Python version: {sys.version}")
    logger.info(f"Current working directory: {os.getcwd()}")
    logger.info(f"Python path: {sys.path}")

def test_imports():
    """Test all critical imports"""
    logger.info("=== IMPORT CHECK ===")
    
    imports_to_test = [
        ('fastapi', 'FastAPI'),
        ('motor.motor_asyncio', 'AsyncIOMotorClient'),
        ('pymongo', 'MongoClient'),
        ('jwt', 'encode'),
        ('bcrypt', 'hashpw'),
        ('dotenv', 'load_dotenv'),
        ('pydantic', 'BaseModel')
    ]
    
    for module_name, item in imports_to_test:
        try:
            module = __import__(module_name, fromlist=[item])
            getattr(module, item)
            logger.info(f"✅ {module_name}.{item}")
        except ImportError as e:
            logger.error(f"❌ {module_name}.{item}: {e}")
        except AttributeError as e:
            logger.error(f"❌ {module_name}.{item}: {e}")

def test_mongodb_connection():
    """Test MongoDB connection"""
    logger.info("=== MONGODB CONNECTION TEST ===")
    
    try:
        from motor.motor_asyncio import AsyncIOMotorClient
        import asyncio
        
        mongo_url = os.getenv('MONGO_URL')
        if not mongo_url:
            logger.error("❌ MONGO_URL not set")
            return
        
        logger.info(f"Testing connection to: {mongo_url[:50]}...")
        
        client = AsyncIOMotorClient(
            mongo_url,
            tls=True,
            tlsAllowInvalidCertificates=True,
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=10000,
        )
        
        async def test_ping():
            try:
                db = client[os.getenv('DB_NAME', 'penlink_database')]
                result = await db.command('ping')
                logger.info(f"✅ MongoDB ping successful: {result}")
                return True
            except Exception as e:
                logger.error(f"❌ MongoDB ping failed: {e}")
                return False
        
        # Run the async test
        success = asyncio.run(test_ping())
        client.close()
        
    except Exception as e:
        logger.error(f"❌ MongoDB connection test failed: {e}")

def main():
    logger.info("=== PINPOST BACKEND STARTUP DIAGNOSTICS ===")
    logger.info(f"Starting at: {datetime.now()}")
    
    check_environment()
    test_imports()
    test_mongodb_connection()
    
    logger.info("=== DIAGNOSTICS COMPLETE ===")
    logger.info("Now starting the main server...")

if __name__ == "__main__":
    main()