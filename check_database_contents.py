"""
Check database contents
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_db():
    client = AsyncIOMotorClient('mongodb://localhost:27017/')
    db = client['penlink_database']
    
    print("=== DATABASE CONTENTS ===\n")
    
    # Check users
    users = await db.users.find().to_list(100)
    print(f"Users: {len(users)}")
    for u in users:
        print(f"  - {u.get('username')} ({u.get('email')})")
    
    print(f"\n{'='*50}\n")
    
    # Check posts
    posts = await db.short_posts.find().to_list(100)
    print(f"Short Posts: {len(posts)}")
    for p in posts[:10]:
        content = p.get('content', 'No content')[:50]
        print(f"  - {p.get('author_username', 'Unknown')}: {content}")
    
    print(f"\n{'='*50}\n")
    
    # Check blogs
    blogs = await db.blog_posts.find().to_list(100)
    print(f"Blog Posts: {len(blogs)}")
    for b in blogs[:10]:
        print(f"  - {b.get('author_username', 'Unknown')}: {b.get('title', 'No title')}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(check_db())
