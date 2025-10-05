"""
Script to check MongoDB connection and provide troubleshooting info
"""
import os
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent / 'backend'))

from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
from dotenv import load_dotenv

# Load environment variables
ROOT_DIR = Path(__file__).parent / 'backend'
load_dotenv(ROOT_DIR / '.env')

async def check_mongodb():
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017/')
    db_name = os.environ.get('DB_NAME', 'penlink_database')
    
    print(f"Attempting to connect to MongoDB at: {mongo_url}")
    print(f"Database name: {db_name}")
    print("-" * 50)
    
    try:
        client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=5000)
        
        # Try to ping the server
        await client.admin.command('ping')
        print("✓ MongoDB is running and accessible!")
        
        # Check database
        db = client[db_name]
        
        # List collections
        collections = await db.list_collection_names()
        print(f"\n✓ Connected to database: {db_name}")
        print(f"Collections found: {collections if collections else 'None (database is empty)'}")
        
        # Check users collection
        if 'users' in collections:
            user_count = await db.users.count_documents({})
            print(f"\n✓ Users collection exists with {user_count} user(s)")
            
            if user_count > 0:
                # Show sample users (without passwords)
                users = await db.users.find({}, {'password_hash': 0}).to_list(length=5)
                print("\nExisting users:")
                for user in users:
                    print(f"  - {user.get('username')} ({user.get('email')})")
        else:
            print("\n✓ No users collection yet (will be created on first user registration)")
        
        print("\n" + "=" * 50)
        print("MongoDB is working correctly!")
        print("=" * 50)
        
    except Exception as e:
        print("✗ MongoDB Connection Failed!")
        print(f"Error: {str(e)}")
        print("\n" + "=" * 50)
        print("TROUBLESHOOTING STEPS:")
        print("=" * 50)
        print("\n1. MongoDB is NOT running. You need to:")
        print("   a) Install MongoDB Community Server from:")
        print("      https://www.mongodb.com/try/download/community")
        print("   b) Or use MongoDB Atlas (free cloud database):")
        print("      https://www.mongodb.com/cloud/atlas/register")
        print("\n2. If using MongoDB Atlas, update your .env file with:")
        print("   MONGO_URL=\"mongodb+srv://username:password@cluster.mongodb.net/\"")
        print("\n3. If MongoDB is installed, start the service:")
        print("   - Windows: Run 'net start MongoDB' in Administrator PowerShell")
        print("   - Or check Services and start 'MongoDB' service")
        print("\n" + "=" * 50)

if __name__ == "__main__":
    asyncio.run(check_mongodb())
