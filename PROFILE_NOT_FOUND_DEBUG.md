# Profile "User Not Found" Issue - Debugging Guide

## Problem
When clicking on profile on the deployed server, it shows "user not found" error.

## Possible Causes

1. **User object missing username field**
2. **API returning different data structure in production**
3. **Frontend BACKEND_URL still pointing to localhost** (check this first!)
4. **Database user document missing username field**
5. **Token authentication failing on production**

## Debugging Added

### App.js - User Fetch
Added comprehensive logging to track:
- API endpoint being called
- User data received
- Whether username field exists

**Look for these logs in console**:
- 🔍 `App.js - Fetching user from:` [API URL]
- ✅ `App.js - User fetched successfully:` [user object]
- 📝 `App.js - Username:` [username value]
- ❌ `App.js - User has no username!` [ERROR]

### MenuPage.js - Profile Link
Added safety checks to prevent crashes when username is missing.

**Look for these logs**:
- 🔍 `MenuPage - User object:` [full object]
- 📝 `MenuPage - Username:` [username value]
- ❌ `MenuPage - User has no username field:` [ERROR]

## Testing Steps

### Step 1: Check Frontend BACKEND_URL (MOST LIKELY CAUSE)

1. Open https://bartaaddaa.com
2. Open DevTools (F12) → Console
3. Look for the logs above
4. **Check the API endpoint**:
   - ✅ Should be: `https://bartaaddaa.com/api/auth/me`
   - ❌ If it shows: `http://localhost:8000/api/auth/me` → **THIS IS YOUR ISSUE!**

**If it's still localhost**, you need to rebuild frontend with correct `.env`:

```bash
# SSH to server
cd /docker/pinpost
git pull origin main
docker compose down
docker compose up -d --build
```

### Step 2: Check User Object Structure

In browser console, look at the logged user object:
```javascript
// Good structure:
{
  id: "abc-123",
  username: "testuser",  // ✅ This should exist
  email: "test@example.com",
  name: "Test User",
  ...
}

// Bad structure (missing username):
{
  id: "abc-123",
  email: "test@example.com",  // ❌ No username field
  name: "Test User",
  ...
}
```

### Step 3: Test Backend Directly

```bash
# SSH to server
# Get your auth token from browser localStorage

# Test /auth/me endpoint
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  https://bartaaddaa.com/api/auth/me

# Should return JSON with username field:
# {"id":"...","username":"testuser","email":"..."}
```

### Step 4: Check Database

```bash
# If you have access to MongoDB
# Check a user document structure

# Use MongoDB shell or MongoDB Compass
db.users.findOne({ email: "your@email.com" })

# Should have:
{
  "_id": ObjectId("..."),
  "id": "uuid-here",
  "username": "testuser",  // ✅ This must exist
  "email": "your@email.com",
  ...
}
```

## Solutions Based on Cause

### Solution 1: Frontend Still Using Localhost URL

**Symptom**: Console shows API calls to `http://localhost:8000`

**Fix**:
```bash
# Verify frontend/.env has:
REACT_APP_BACKEND_URL=https://bartaaddaa.com

# Then rebuild:
cd /docker/pinpost
git pull origin main
docker compose down
docker compose up -d --build
```

### Solution 2: User Document Missing Username

**Symptom**: Backend returns user object without username field

**Fix (Backend)**:
If old users were created before username field was added, update them:

```javascript
// In MongoDB
db.users.updateMany(
  { username: { $exists: false } },
  { $set: { username: "$email" } }  // Use email as username temporarily
)
```

Or add migration script to backend:

```python
# backend/migrate_users.py
async def add_usernames():
    users_without_username = await db.users.find({"username": {"$exists": False}}).to_list(None)
    for user in users_without_username:
        email = user["email"]
        username = email.split("@")[0]  # Use email prefix as username
        await db.users.update_one(
            {"id": user["id"]},
            {"$set": {"username": username}}
        )
```

### Solution 3: Token Invalid or Expired

**Symptom**: `/auth/me` returns 401 Unauthorized

**Fix**:
1. Logout and login again
2. Clear localStorage
3. Generate new token

```bash
# In browser console
localStorage.clear()
# Then reload page and login again
```

### Solution 4: CORS or Network Issues

**Symptom**: Network errors in console, CORS errors

**Fix**: Verify backend `.env` has:
```env
FRONTEND_URL=https://bartaaddaa.com
```

And backend CORS config is correct (should already be in server.py):
```python
origins_env = os.environ.get('FRONTEND_URL', '*')
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=origins_env.split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Quick Diagnosis Script

Save this as `check_profile.sh` on your local machine:

```bash
#!/bin/bash
echo "=== Testing Profile API ==="

# Replace with your actual token from browser localStorage
TOKEN="your_token_here"

echo -e "\n1. Testing /auth/me endpoint:"
curl -s -H "Authorization: Bearer $TOKEN" \
  https://bartaaddaa.com/api/auth/me | jq '.'

echo -e "\n2. Checking if username exists:"
curl -s -H "Authorization: Bearer $TOKEN" \
  https://bartaaddaa.com/api/auth/me | jq -r '.username'

echo -e "\n3. Testing profile endpoint (replace testuser with actual username):"
curl -s https://bartaaddaa.com/api/users/testuser | jq '.'

echo -e "\n=== Done ==="
```

## Expected Console Output (Working System)

When everything works correctly, you should see:

```
🔍 App.js - Fetching user from: https://bartaaddaa.com/api/auth/me
✅ App.js - User fetched successfully: {id: "...", username: "testuser", ...}
📝 App.js - Username: testuser
🔍 MenuPage - User object: {id: "...", username: "testuser", ...}
📝 MenuPage - Username: testuser
```

## Expected Console Output (Problem)

If there's an issue, you'll see:

```
🔍 App.js - Fetching user from: http://localhost:8000/api/auth/me  ← WRONG URL!
❌ App.js - Failed to fetch user: Network Error
```

OR:

```
🔍 App.js - Fetching user from: https://bartaaddaa.com/api/auth/me
✅ App.js - User fetched successfully: {id: "...", email: "test@example.com", ...}
❌ App.js - User has no username! {id: "...", email: "..."} ← USERNAME MISSING!
User keys: ["id", "email", "name", "bio", ...]  ← No "username" in array
```

## What to Report Back

Please check your browser console and tell me:

1. **What API URL is being called?**
   - Should be: `https://bartaaddaa.com/api/auth/me`
   - Not: `http://localhost:8000/api/auth/me`

2. **Does the user object have a username field?**
   - Look at the logged object
   - Check "User keys:" array

3. **What error do you see?**
   - Network error?
   - 401 Unauthorized?
   - 404 Not found?
   - No error but username is undefined?

4. **Screenshot of browser console** showing the emoji logs

Once you provide this information, I can give you the exact fix!

## Most Likely Fix

Based on pattern (images work locally but not on server), this is probably:

**Frontend still using localhost URL for API calls**

Quick fix:
```bash
# On server
cd /docker/pinpost
git pull origin main
docker compose down
docker compose up -d --build

# Wait 2-3 minutes for rebuild
# Then test again with cleared browser cache
```
