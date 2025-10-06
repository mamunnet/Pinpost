# Image Upload Issue on Deployed Server - SOLUTION

## Problem
✅ **Localhost**: Images upload and display correctly  
❌ **Deployed Server**: Images upload but don't display (404 errors)

## Root Cause
When using Docker deployment, uploaded images are saved inside the container's `/app/uploads` directory. However, there are several potential issues:

1. **Volume not persisting** - Images lost when container restarts
2. **Permission issues** - Backend can't write to uploads folder
3. **nginx can't access uploads** - Proxy configuration issue
4. **BACKEND_URL mismatch** - Frontend points to wrong URL

## Solution: Fix Docker Configuration

### Step 1: Update docker-compose.yml (or docker-compose.production.yml)

The current configuration is mostly correct, but we need to ensure proper volume mounting:

```yaml
services:
  backend:
    volumes:
      - uploads:/app/uploads  # ✅ This is correct
    environment:
      - UPLOAD_DIR=/app/uploads  # ✅ Explicit upload directory
```

### Step 2: Check Backend Environment Variables

In your deployed `.env` file on the server, make sure you have:

```env
# Production Backend URL
FRONTEND_URL=https://bartaaddaa.com

# Optional but recommended
UPLOAD_DIR=/app/uploads
MAX_FILE_SIZE=10485760
```

### Step 3: Check Frontend Environment Variable

**CRITICAL**: The frontend needs to know the backend URL!

Create `.env` file in `frontend/` directory:

```env
# For deployed server
REACT_APP_BACKEND_URL=https://bartaaddaa.com
```

**OR** if backend is on different subdomain:
```env
REACT_APP_BACKEND_URL=https://api.bartaaddaa.com
```

### Step 4: Verify nginx.conf

Your current nginx.conf is correct (lines 49-55):

```nginx
# Proxy uploads folder
location /uploads {
    proxy_pass http://backend:8000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

This proxies all `/uploads/` requests to the backend container.

## Deployment Commands

### Option 1: Quick Fix (If issue is just environment variables)

1. SSH into your server
2. Go to project directory: `cd /docker/pinpost`
3. Edit or create `frontend/.env`:
   ```bash
   echo "REACT_APP_BACKEND_URL=https://bartaaddaa.com" > frontend/.env
   ```
4. Rebuild only frontend:
   ```bash
   docker compose up -d --build frontend
   ```

### Option 2: Full Redeploy (Recommended)

```bash
cd /docker/pinpost
git pull origin main
docker compose down
docker compose up -d --build
```

### Option 3: Check if uploads exist in container

```bash
# Check backend container
docker exec -it pinpost-backend ls -la /app/uploads/

# You should see your uploaded files like:
# -rw-r--r-- 1 appuser appuser 123456 Jan 01 12:00 abc123-def456.jpg
```

## Debugging Steps

### Test 1: Check if images are being uploaded

```bash
# SSH into backend container
docker exec -it pinpost-backend bash

# List uploaded files
ls -la /app/uploads/

# You should see .jpg, .png files with UUID names
```

### Test 2: Check if backend serves images

```bash
# From your server or local machine
curl -I https://bartaaddaa.com/uploads/[filename].jpg

# Should return:
# HTTP/1.1 200 OK
# Content-Type: image/jpeg
```

### Test 3: Check frontend environment

```bash
# Check if REACT_APP_BACKEND_URL is baked into build
docker exec -it pinpost-frontend cat /usr/share/nginx/html/static/js/main.*.js | grep -o "http[s]*://[^\"]*" | head -5

# You should see your backend URL in the output
```

### Test 4: Check browser network tab

1. Open deployed site: https://bartaaddaa.com
2. Open DevTools (F12) → Network tab
3. Upload an image
4. Look for the request to `/uploads/...`
5. Check the full URL - is it correct?

**Expected**: `https://bartaaddaa.com/uploads/abc123.jpg`  
**Wrong**: `http://localhost:8000/uploads/abc123.jpg`

## Common Issues & Fixes

### Issue 1: Images uploading but returning "localhost" URL

**Symptom**: Avatar saves but URL is `http://localhost:8000/uploads/...`

**Cause**: Frontend `REACT_APP_BACKEND_URL` not set during build

**Fix**:
```bash
# Create frontend/.env
echo "REACT_APP_BACKEND_URL=https://bartaaddaa.com" > frontend/.env

# Rebuild frontend only
docker compose up -d --build frontend
```

### Issue 2: 404 on /uploads/ path

**Symptom**: GET `/uploads/abc123.jpg` returns 404

**Cause**: nginx not proxying to backend OR backend not mounting volume

**Fix**:
```bash
# Check nginx config is correct
docker exec -it pinpost-frontend cat /etc/nginx/conf.d/default.conf | grep -A5 "location /uploads"

# Should show proxy_pass to backend:8000

# Check backend has files
docker exec -it pinpost-backend ls /app/uploads/
```

### Issue 3: Permission denied writing to uploads

**Symptom**: Upload fails with 500 error

**Cause**: Docker volume permissions issue

**Fix**:
```bash
# Fix permissions in backend container
docker exec -it pinpost-backend chmod 777 /app/uploads

# Or rebuild with proper permissions
docker compose down
docker volume rm pinpost_uploads
docker compose up -d --build
```

### Issue 4: Volume data lost after redeploy

**Symptom**: Old images disappear after `docker compose down`

**Cause**: Not using named volume correctly

**Fix**: Ensure docker-compose.yml has:
```yaml
volumes:
  uploads:
    driver: local
```

And backend service mounts it:
```yaml
services:
  backend:
    volumes:
      - uploads:/app/uploads
```

## Quick Diagnosis Script

Run this on your server to diagnose the issue:

```bash
#!/bin/bash
echo "=== Checking Docker Containers ==="
docker ps | grep pinpost

echo -e "\n=== Checking Backend Uploads Directory ==="
docker exec pinpost-backend ls -lah /app/uploads/ | head -10

echo -e "\n=== Checking nginx config for /uploads ==="
docker exec pinpost-frontend cat /etc/nginx/conf.d/default.conf | grep -A10 "location /uploads"

echo -e "\n=== Testing backend upload URL ==="
curl -I https://bartaaddaa.com/uploads/test.jpg 2>&1 | head -5

echo -e "\n=== Checking frontend build env ==="
docker exec pinpost-frontend env | grep REACT

echo -e "\n=== Done! ==="
```

Save as `diagnose.sh`, make executable (`chmod +x diagnose.sh`), and run it.

## Most Likely Fix (TL;DR)

Based on "works on localhost but not deployed", the issue is almost certainly:

**Frontend is using `http://localhost:8000` instead of `https://bartaaddaa.com`**

### Quick Fix:

```bash
# SSH to server
cd /docker/pinpost

# Create frontend environment file
cat > frontend/.env << EOF
REACT_APP_BACKEND_URL=https://bartaaddaa.com
EOF

# Rebuild frontend
docker compose up -d --build frontend

# Wait 30 seconds for build
sleep 30

# Test
curl -I https://bartaaddaa.com/uploads/test.jpg
```

After this, clear browser cache and test again!

## Verification

After fix, you should see:

1. **In browser DevTools Network tab**: 
   - URL: `https://bartaaddaa.com/uploads/abc123.jpg`
   - Status: `200 OK`
   - Type: `image/jpeg`

2. **In browser Console**:
   - ✅ `Avatar loaded successfully: https://bartaaddaa.com/uploads/...`
   - NOT: `http://localhost:8000/uploads/...`

3. **Test upload**:
   - Upload new avatar
   - Check console for saved URL
   - Refresh page
   - Avatar should still show

If you're still having issues after this fix, run the diagnosis script and share the output!
