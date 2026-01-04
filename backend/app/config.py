"""
Pinpost Backend Configuration
All environment variables and settings are managed here.
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
ROOT_DIR = Path(__file__).resolve().parent.parent
ENV_PATH = ROOT_DIR / '.env'
if ENV_PATH.exists():
    load_dotenv(ENV_PATH)

class Settings:
    """Application settings loaded from environment variables."""
    
    # MongoDB
    MONGO_URL: str = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    DB_NAME: str = os.environ.get('DB_NAME', 'pinpost_database')
    
    # Security
    SECRET_KEY: str = os.environ.get('SECRET_KEY', 'your-secret-key-change-in-production')
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_DAYS: int = 7
    
    # Admin credentials (REQUIRED in .env for admin creation)
    ADMIN_EMAIL: str = os.environ.get('ADMIN_EMAIL', '')
    ADMIN_USERNAME: str = os.environ.get('ADMIN_USERNAME', '')
    ADMIN_PASSWORD: str = os.environ.get('ADMIN_PASSWORD', '')
    
    # CORS & Frontend
    FRONTEND_URL: str = os.environ.get('FRONTEND_URL', 'http://localhost:3000')
    CORS_ORIGINS: str = os.environ.get('CORS_ORIGINS', '')
    
    # Environment
    ENVIRONMENT: str = os.environ.get('ENVIRONMENT', 'development')
    
    # File uploads
    MAX_FILE_SIZE: int = int(os.environ.get('MAX_FILE_SIZE', 10485760))  # 10MB
    UPLOAD_DIR: str = os.environ.get('UPLOAD_DIR', 'uploads')
    
    @property
    def cors_origins_list(self) -> list:
        """Get CORS origins as a list."""
        if self.CORS_ORIGINS:
            return self.CORS_ORIGINS.split(',')
        if self.FRONTEND_URL:
            return [self.FRONTEND_URL]
        return ['*']

settings = Settings()
