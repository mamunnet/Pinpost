# Production Routing Issue - Root Cause & Fix

## Problem Summary

On production (https://bartaaddaa.com):
- ❌ Profile pages show "User Not Found"
- ❌ Blog detail pages show "Article not found"
- ❌ Post detail pages don't work
- ✅ Everything works fine on localhost

## Root Cause Analysis

The issue is **NOT with nginx** or **NOT with React Router**. The problem is:

### The React app was built with the WRONG `REACT_APP_BACKEND_URL`

When you build a React app:
```bash
yarn build
```

It **bakes the environment variable** into the JavaScript bundle at BUILD TIME.

**If you built the production frontend with:**
```env
REACT_APP_BACKEND_URL=http://localhost:8000  ❌ WRONG
```

**Then the production app tries to call:**
```
http://localhost:8000/api/users/johndoe  ❌ FAILS
http://localhost:8000/api/blogs/123      ❌ FAILS
```

**Instead of:**
```
https://bartaaddaa.com/api/users/johndoe  ✅ CORRECT
https://bartaaddaa.com/api/blogs/123      ✅ CORRECT
```

## How To Verify This Is The Issue

1. Open https://bartaaddaa.com in browser
2. Press F12 (open DevTools)
3. Go to **Network** tab
4. Click on your profile
5. Look at the failed request URL

**If you see:**
```
Request URL: http://localhost:8000/api/users/...
Status: (failed) net::ERR_CONNECTION_REFUSED
```

**This confirms the issue!** The production app is trying to connect to localhost.

## The Fix

You need to:
1. Update `frontend/.env` to production URL
2. Rebuild the Docker image (which runs `yarn build` inside)
3. Redeploy

### Step-by-Step Fix

#### 1. Update frontend/.env for Production

```bash
# On your production server (SSH into it)
cd /docker/pinpost

# Edit the .env file
nano frontend/.env

# Change line 5 to:
REACT_APP_BACKEND_URL=https://bartaaddaa.com

# Save (Ctrl+O, Enter, Ctrl+X)
```

Or do it locally and push to Git:

```powershell
# On your local machine
cd D:\dev_project\Pinpost

# Edit frontend/.env manually or:
echo "REACT_APP_BACKEND_URL=https://bartaaddaa.com" > frontend/.env

# Commit and push
git add frontend/.env
git commit -m "Fix: Set production backend URL for deployment"
git push origin main
```

#### 2. Deploy with Full Rebuild

```bash
# SSH into your production server
ssh your-server

# Go to project directory
cd /docker/pinpost

# Pull latest changes (if you pushed from local)
git pull origin main

# Update .env to production URL (CRITICAL!)
echo "REACT_APP_BACKEND_URL=https://bartaaddaa.com" > frontend/.env

# Stop containers
docker compose down

# Rebuild frontend with correct env var
docker compose build --no-cache frontend

# Start everything
docker compose up -d

# Check logs
docker compose logs -f frontend
```

Wait 2-3 minutes for the build to complete.

#### 3. Verify the Fix

1. **Clear browser cache** (Ctrl+Shift+Delete → Clear all)
2. Open https://bartaaddaa.com
3. Press F12 → Network tab
4. Click on "My Profile"
5. **Check the request URL** - should now show:
   ```
   Request URL: https://bartaaddaa.com/api/users/yourname  ✅
   Status: 200 OK  ✅
   ```

## Why This Happens

### Build-Time vs Runtime Variables

**React environment variables are BUILD-TIME only:**

```javascript
// This gets replaced during build
const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// After build with REACT_APP_BACKEND_URL=http://localhost:8000:
const API = `http://localhost:8000/api`;  // ❌ Hardcoded!

// After build with REACT_APP_BACKEND_URL=https://bartaaddaa.com:
const API = `https://bartaaddaa.com/api`;  // ✅ Correct!
```

Once built, the JavaScript bundle contains the **hardcoded** value. Changing `.env` after building does nothing!

### The Deployment Workflow

**Correct workflow:**
1. Update `frontend/.env` → `REACT_APP_BACKEND_URL=https://bartaaddaa.com`
2. Build → `yarn build` (inside Docker)
3. Deploy → Docker image contains correctly built app

**Incorrect workflow (what probably happened):**
1. `.env` had → `REACT_APP_BACKEND_URL=http://localhost:8000`
2. Built with localhost URL
3. Deployed → App tries to connect to localhost on production

## Preventing This in the Future

### Option 1: Separate Environment Files

Create two separate files:

```bash
frontend/
  .env.local        # For local development (gitignored)
  .env.production   # For production (committed to git)
```

**.env.local** (for local dev):
```env
REACT_APP_BACKEND_URL=http://localhost:8000
```

**.env.production** (for production):
```env
REACT_APP_BACKEND_URL=https://bartaaddaa.com
```

**Update .gitignore:**
```
frontend/.env.local
frontend/.env
```

**Update Dockerfile.frontend:**
```dockerfile
# Copy production env
COPY frontend/.env.production frontend/.env

# Build
RUN yarn build
```

### Option 2: Docker Compose Environment Variable

**Update docker-compose.yml:**
```yaml
services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
      args:
        - REACT_APP_BACKEND_URL=https://bartaaddaa.com
```

**Update Dockerfile.frontend:**
```dockerfile
ARG REACT_APP_BACKEND_URL
ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL

# Build
RUN yarn build
```

### Option 3: Build Script with Environment Check

Create `frontend/build-prod.sh`:
```bash
#!/bin/bash
if [ "$REACT_APP_BACKEND_URL" != "https://bartaaddaa.com" ]; then
  echo "❌ ERROR: REACT_APP_BACKEND_URL must be https://bartaaddaa.com for production"
  exit 1
fi

echo "✅ Building with REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL"
yarn build
```

## Additional Debugging

### Check Current Built App's Backend URL

1. **On production server:**
```bash
docker compose exec frontend cat /usr/share/nginx/html/static/js/main.*.js | grep -o 'http[s]*://[^"]*8000'
```

If this returns `http://localhost:8000`, it confirms the app was built with wrong URL.

2. **In browser console on production:**
```javascript
// This won't show the env var (it's removed during build)
console.log(process.env.REACT_APP_BACKEND_URL);  // undefined

// But you can check actual API calls in Network tab
```

### Check Docker Build Logs

```bash
docker compose logs frontend | grep -i "backend"
docker compose logs frontend | grep -i "build"
```

Look for any mentions of the backend URL during build.

## Summary Checklist

To fix production routing issues:

- [ ] Update `frontend/.env` to `REACT_APP_BACKEND_URL=https://bartaaddaa.com`
- [ ] Commit and push changes
- [ ] SSH into production server
- [ ] `cd /docker/pinpost`
- [ ] `git pull origin main`
- [ ] Verify `.env` shows production URL: `cat frontend/.env`
- [ ] `docker compose down`
- [ ] `docker compose build --no-cache frontend`
- [ ] `docker compose up -d`
- [ ] Wait 2-3 minutes
- [ ] Clear browser cache
- [ ] Test profile page on https://bartaaddaa.com
- [ ] Check Network tab shows `https://bartaaddaa.com/api/...`
- [ ] Verify all routes work (profile, blog, post detail)

## Expected Outcome

After the fix:

✅ Profile pages load correctly
✅ Blog detail pages show full article
✅ Post detail pages work
✅ Network tab shows: `https://bartaaddaa.com/api/...`
✅ No CORS errors
✅ No "User Not Found" errors
✅ No "Article not found" errors

The app will behave identically to localhost, just with production data! 🎉
