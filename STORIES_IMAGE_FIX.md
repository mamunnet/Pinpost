# Stories Image Fix - Production Deployment Issue

## Problem
Stories with images were showing as **broken** in production (Docker deployment) but worked fine in local development.

## Root Cause
The frontend was creating **absolute URLs** with `localhost:8000` hardcoded:

```javascript
// ❌ BEFORE (Wrong)
setStoryImage(`${BACKEND_URL}${response.data.url}`);
// Result: http://localhost:8000/uploads/image.jpg (broken in production)
```

When deployed to production, the images still pointed to `localhost:8000` instead of the actual production domain.

## Solution
Store **relative URLs** in the database and let the `getImageUrl()` utility handle conversion:

```javascript
// ✅ AFTER (Correct)
setStoryImage(response.data.url);
// Result: /uploads/image.jpg (converted by getImageUrl() to correct domain)
```

## Changes Made

### 1. **Stories.js - Image Upload Handler** (Line 53)
```javascript
// Changed from:
setStoryImage(`${BACKEND_URL}${response.data.url}`);

// To:
setStoryImage(response.data.url);
```

### 2. **Stories.js - Image Preview** (Line 372)
```javascript
// Changed from:
<img src={storyImage} alt="Story" />

// To:
<img src={getImageUrl(storyImage)} alt="Story" />
```

## How It Works

1. **Backend** returns: `/uploads/abc123.jpg` (relative path)
2. **Frontend** stores: `/uploads/abc123.jpg` (relative path in DB)
3. **getImageUrl()** converts to:
   - Local: `http://localhost:8000/uploads/abc123.jpg`
   - Production: `https://yourdomain.com/uploads/abc123.jpg`

## Deployment Instructions

1. **Commit and push changes:**
   ```bash
   git add frontend/src/components/Stories.js
   git commit -m "Fix: Stories images broken in production - use relative URLs"
   git push origin main
   ```

2. **Deploy to production:**
   ```bash
   cd /docker/pinpost
   git pull origin main
   docker compose up -d --build frontend
   ```

3. **Verify:**
   - Upload a new story with an image
   - Check that the image displays correctly
   - Old stories may still be broken (they have absolute URLs in DB)

## Note About Existing Stories
Stories created **before this fix** may still have absolute URLs in the database (e.g., `http://localhost:8000/uploads/...`). These will be fixed by the `getImageUrl()` utility which:
- Detects URLs with different domains
- Extracts the filename
- Reconstructs with the current `BACKEND_URL`

All **new stories** will work correctly immediately! 🎉
