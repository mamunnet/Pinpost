# AUTHENTICATION & DATABASE ANALYSIS

## How Authentication Works in Your App:

### 1. **Registration Flow** (`/api/auth/register`):
```
User fills form → POST to /api/auth/register
                ↓
Backend checks if user exists in MongoDB
                ↓
Hash password with bcrypt
                ↓
Create user in MongoDB users collection
                ↓
Generate JWT token (expires in 7 days)
                ↓
Return {token, user} to frontend
                ↓
Frontend saves token in localStorage
Frontend sets axios Authorization header
```

### 2. **Login Flow** (`/api/auth/login`):
```
User enters credentials → POST to /api/auth/login
                        ↓
Backend finds user by email in MongoDB
                        ↓
Verify password using bcrypt
                        ↓
Generate JWT token
                        ↓
Return {token, user}
                        ↓
Frontend saves in localStorage
```

### 3. **Protected Routes**:
Every protected API endpoint uses `Depends(get_current_user)`:
- Extracts token from `Authorization: Bearer <token>` header
- Decodes JWT to get user_id
- Returns user_id if valid, otherwise 401 error

### 4. **User Session**:
- Token stored in `localStorage.token`
- Automatically attached to all axios requests
- On page refresh, `AuthContext` checks token and fetches user data

---

## The Test Users Issue - ROOT CAUSE:

Your screenshots show users like `testuser_223027`, `testuser_222929`, etc.

**These are NOT in your local database!** (confirmed - database is empty)

### What's Happening:

You're still seeing **cached data from the remote production server** because:

1. Your `.env` was pointing to `https://penlink-social-1.preview.emergentagent.com`
2. You loaded the app and it fetched posts from remote server
3. Even after changing `.env`, the React app needs a **full restart**
4. Browser may have cached the API responses

---

## SOLUTION - Complete Fix:

### Step 1: Clear Everything
```powershell
# Stop frontend (Ctrl+C in the terminal running npm start)
cd frontend
npm start
```

### Step 2: Clear Browser Cache
1. Open DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"
4. OR clear all site data:
   - DevTools → Application → Storage → Clear site data

### Step 3: Verify Backend is Local
```powershell
# In a separate terminal
cd backend
python -m uvicorn server:app --reload --port 8000
```

### Step 4: Check .env Files Again
Frontend `.env` should have:
```
REACT_APP_BACKEND_URL=http://localhost:8000
```

Backend `.env` should have:
```
MONGO_URL=mongodb://localhost:27017/
DB_NAME=penlink_database
CORS_ORIGINS=http://localhost:3000
```

### Step 5: Create Fresh Test Data
After restarting everything:
1. Register a new user on http://localhost:3000
2. Create some posts
3. You should ONLY see your posts (no test users)

---

## Database Storage Details:

### Collections Used:
- **users** - User accounts (username, email, password_hash, profile info)
- **short_posts** - Short text posts (like tweets)
- **blog_posts** - Long-form blog articles
- **likes** - Likes on posts/blogs
- **comments** - Comments on posts/blogs
- **follows** - Follow relationships
- **notifications** - User notifications
- **stories** - 24-hour stories
- **story_views** - Story view tracking

### Where User Data is Stored:
```javascript
{
  id: "uuid",
  username: "mamunnet",
  email: "user@example.com",
  password_hash: "bcrypt_hash...",
  name: "Mamun Saikh",
  bio: "I love to solve problems",
  avatar: "/uploads/xxx.jpg",
  cover_photo: "/uploads/yyy.jpg",
  date_of_birth: "1997-12-25",
  location: "Kolkata",
  profile_completed: true,
  followers_count: 1,
  following_count: 3,
  created_at: "2025-10-05T..."
}
```

### Where Posts are Stored:
```javascript
// short_posts collection
{
  id: "uuid",
  author_id: "user_uuid",
  author_username: "mamunnet",
  author_avatar: "/uploads/avatar.jpg",
  content: "My post content...",
  likes_count: 0,
  comments_count: 0,
  shares_count: 0,
  created_at: "2025-10-05T..."
}
```

---

## Why You're Seeing "mamunnet" After Login:

The second screenshot shows your real user "mamunnet" which means:
- You successfully registered/logged in
- The profile page is working
- BUT the posts feed is still showing cached data from remote server

**Once you restart the frontend and clear cache, you'll ONLY see posts from your local database (which is currently empty except for your user).**
