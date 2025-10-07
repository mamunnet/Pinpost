# Production Avatar Upload Troubleshooting

## Quick Diagnosis

Run these commands on your production server to find the issue:

### 1. Check if uploads directory exists and has files

```bash
ssh root@your-server
cd /docker/pinpost

# Check if container has uploads directory
docker exec -it pinpost-backend ls -la /app/uploads

# Check for uploaded files
docker exec -it pinpost-backend find /app/uploads -type f -name "*.jpg" -o -name "*.png"

# Check volume
docker volume inspect pinpost_uploads
```

### 2. Check nginx configuration

```bash
# Inside container
docker exec -it pinpost-frontend cat /etc/nginx/conf.d/default.conf | grep -A 5 "location /uploads"
```

Should show:
```nginx
location /uploads {
    proxy_pass http://backend:8000;
    ...
}
```

### 3. Test upload endpoint directly

```bash
# From your local machine
curl -X POST https://bartaaddaa.com/api/upload/image \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test-image.jpg"
```

Should return:
```json
{
  "url": "/uploads/xxxxx.jpg",
  "filename": "xxxxx.jpg"
}
```

### 4. Check if uploaded file is accessible

```bash
# Replace with actual filename from upload
curl -I https://bartaaddaa.com/uploads/your-filename.jpg
```

Should return `200 OK`, not `404 Not Found`

## Common Issues & Fixes

### Issue 1: Files Upload But Show Broken Image

**Cause:** Frontend saves full localhost URL instead of relative path

**Check:**
```bash
# Connect to MongoDB and check user avatar field
# It should be: "/uploads/xxx.jpg"
# NOT: "http://localhost:8000/uploads/xxx.jpg"
```

**Fix:** Already fixed in EditAvatarModal.js (stores relative path)

### Issue 2: 404 on Image URLs

**Cause:** nginx not proxying `/uploads` correctly

**Fix:**
```bash
# On server
cd /docker/pinpost

# Check nginx.conf has this
cat nginx.conf | grep -A 10 "location /uploads"

# Should see:
# location /uploads {
#     proxy_pass http://backend:8000;
# }

# If missing, it's already in your nginx.conf
# Just rebuild frontend:
docker compose down
docker compose build --no-cache frontend
docker compose up -d
```

### Issue 3: Container Has No Write Permission

**Cause:** Upload directory permissions

**Fix:**
```bash
# Enter backend container
docker exec -it pinpost-backend bash

# Check permissions
ls -la /app

# Create uploads directory with correct permissions
mkdir -p /app/uploads
chmod 777 /app/uploads

# Or in Dockerfile.backend, add:
# RUN mkdir -p /app/uploads && chmod 777 /app/uploads
```

### Issue 4: Volume Not Persisting

**Cause:** Docker volume not mounted correctly

**Fix:**
```bash
# Check current volumes
docker volume ls | grep pinpost

# Inspect uploads volume
docker volume inspect pinpost_uploads

# Should show mount point like:
# "Mountpoint": "/var/lib/docker/volumes/pinpost_uploads/_data"

# Recreate volume if needed
docker compose down
docker volume rm pinpost_uploads
docker compose up -d
```

## Immediate Fix

While I investigate, try this quick fix:

### Step 1: Ensure Backend Environment is Correct

**On production server:**

```bash
cd /docker/pinpost

# Check backend environment
docker exec -it pinpost-backend env | grep -E "FRONTEND_URL|UPLOAD_DIR|ENVIRONMENT"

# Should show:
# FRONTEND_URL=https://bartaaddaa.com
# UPLOAD_DIR=/app/uploads
# ENVIRONMENT=production
```

### Step 2: Verify Frontend .env

**Check what frontend was built with:**

```bash
# On server
cd /docker/pinpost
cat frontend/.env.production

# Should show:
# REACT_APP_BACKEND_URL=https://bartaaddaa.com
```

### Step 3: Test the Full Flow

1. Open https://bartaaddaa.com
2. Open DevTools (F12) → Network tab
3. Go to profile → Click camera icon
4. Upload image
5. Watch Network tab for:
   - **POST to /api/upload/image** → Check response
   - **PUT to /api/users/avatar** → Check what URL is sent
   - **GET to /uploads/xxx.jpg** → Should succeed (200), not fail (404)

### Step 4: Check What's Saved in Database

```bash
# From server or local
# Use MongoDB Compass or mongo shell

# Find your user
db.users.findOne({username: "your_username"})

# Check avatar field:
# ✅ Good: "avatar": "/uploads/abc123.jpg"
# ❌ Bad: "avatar": "http://localhost:8000/uploads/abc123.jpg"
# ❌ Bad: "avatar": "blob:http://localhost:3000/..."
```

## The Real Fix

Based on the symptoms, the issue is likely:

1. **Frontend built with wrong BACKEND_URL** (already fixed)
2. **Avatar URL stored with full localhost URL instead of relative path** (already fixed in EditAvatarModal)
3. **Need to rebuild frontend and clear old data**

**Deploy the fix:**

```bash
# On production server
cd /docker/pinpost

# Pull latest changes (includes EditAvatarModal fix)
git pull origin main

# Rebuild frontend with correct env
docker compose down
docker compose build --no-cache frontend
docker compose build --no-cache backend
docker compose up -d

# Wait 2-3 minutes

# Test again
```

## Send Me Debug Info

Run this on your production server and send me the output:

```bash
#!/bin/bash
echo "=== Backend Environment ==="
docker exec pinpost-backend env | grep -E "FRONTEND_URL|UPLOAD|ENVIRONMENT"

echo -e "\n=== Uploads Directory ==="
docker exec pinpost-backend ls -la /app/uploads | head -20

echo -e "\n=== Nginx Uploads Config ==="
docker exec pinpost-frontend cat /etc/nginx/conf.d/default.conf | grep -A 5 "location /uploads"

echo -e "\n=== Frontend .env.production ==="
cat frontend/.env.production

echo -e "\n=== Test Upload Access ==="
curl -I https://bartaaddaa.com/uploads/test.jpg 2>&1 | head -5

echo -e "\n=== Docker Volumes ==="
docker volume ls | grep pinpost
```

This will help me see exactly what's wrong!
