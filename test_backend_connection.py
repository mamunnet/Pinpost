"""
Test if frontend is connecting to local or remote backend
"""
import httpx
import asyncio

async def test_backend():
    print("Testing backend endpoints...\n")
    
    # Test local backend
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get("http://localhost:8000/api/posts", timeout=5.0)
            posts = response.json()
            print(f"✓ Local backend (localhost:8000) is running")
            print(f"  Posts count: {len(posts)}")
            if posts:
                print(f"  Sample post: {posts[0].get('author_username', 'Unknown')}")
            else:
                print(f"  ✓ No posts (database is clean)")
    except Exception as e:
        print(f"✗ Local backend not accessible: {e}")
    
    print("\n" + "="*50 + "\n")
    
    # Test remote backend
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://penlink-social-1.preview.emergentagent.com/api/posts",
                timeout=5.0
            )
            posts = response.json()
            print(f"⚠ Remote backend (emergentagent.com) is accessible")
            print(f"  Posts count: {len(posts)}")
            if posts:
                print(f"  Sample users: {', '.join(set([p.get('author_username', 'Unknown') for p in posts[:5]]))}")
                print(f"\n  ⚠ WARNING: If you see these users in your app,")
                print(f"     your frontend is still connecting to remote server!")
    except Exception as e:
        print(f"Remote backend: {e}")

if __name__ == "__main__":
    asyncio.run(test_backend())
