"""
Test the registration endpoint directly
"""
import asyncio
import httpx

async def test_registration():
    url = "http://localhost:8000/api/auth/register"
    
    test_user = {
        "username": "testuser123",
        "email": "test@example.com",
        "password": "password123",
        "bio": "Test user bio"
    }
    
    print("Testing registration endpoint...")
    print(f"URL: {url}")
    print(f"Data: {test_user}")
    print("-" * 50)
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, json=test_user)
            print(f"Status Code: {response.status_code}")
            print(f"Response: {response.text}")
            
            if response.status_code == 200:
                print("\n✓ Registration successful!")
                data = response.json()
                print(f"Token: {data.get('token', 'N/A')[:50]}...")
                print(f"User: {data.get('user', {}).get('username', 'N/A')}")
            else:
                print(f"\n✗ Registration failed!")
                
        except Exception as e:
            print(f"\n✗ Error connecting to backend: {e}")
            print("\nIs the backend running? Start it with:")
            print("cd backend && uvicorn server:app --reload")

if __name__ == "__main__":
    asyncio.run(test_registration())
