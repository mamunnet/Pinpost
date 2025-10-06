# Cloudinary Integration Guide

## Overview

Pinpost now supports **Cloudinary** for media storage and delivery, providing:
- ✅ **CDN delivery worldwide** - Fast image loading globally
- ✅ **Automatic optimization** - WebP, format conversion, quality optimization
- ✅ **Responsive images** - Multiple sizes generated automatically
- ✅ **Mobile compatibility** - No more mobile caching issues
- ✅ **Face detection** - Smart cropping for profile pictures
- ✅ **Unlimited storage** - No server disk space issues
- ✅ **Image transformations** - Resize, crop, filters on-the-fly

---

## Table of Contents

1. [Setup Cloudinary Account](#setup-cloudinary-account)
2. [Configuration](#configuration)
3. [Migration from Local Storage](#migration-from-local-storage)
4. [Features](#features)
5. [API Endpoints](#api-endpoints)
6. [Frontend Integration](#frontend-integration)
7. [Troubleshooting](#troubleshooting)

---

## Setup Cloudinary Account

### 1. Create Free Account

1. Visit [https://cloudinary.com](https://cloudinary.com)
2. Click **"Sign Up for Free"**
3. Choose the **free tier** (25GB storage, 25GB bandwidth/month)
4. Verify your email

### 2. Get Your Credentials

After signing in:

1. Go to **Dashboard**
2. Find your credentials:
   - **Cloud Name**: e.g., `pinpost-media`
   - **API Key**: e.g., `123456789012345`
   - **API Secret**: e.g., `abcdef1234567890abcdef1234567890`

### 3. Optional: Configure Upload Presets

1. Go to **Settings** → **Upload**
2. Create an upload preset named `pinpost`
3. Set **Folder** to `pinpost`
4. Enable **Auto-tagging**
5. Set **Responsive breakpoints** (optional)

---

## Configuration

### Backend Configuration

#### 1. Install Cloudinary Package

```bash
cd backend
pip install cloudinary==1.41.0
```

Or reinstall all requirements:
```bash
pip install -r requirements.txt
```

#### 2. Configure Environment Variables

Edit `backend/.env`:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
USE_CLOUDINARY=true
```

**Important:** Replace `your_cloud_name_here`, `your_api_key_here`, and `your_api_secret_here` with your actual Cloudinary credentials.

#### 3. Production Environment Variables

For Docker deployment, update `docker-compose.yml`:

```yaml
services:
  backend:
    environment:
      - CLOUDINARY_CLOUD_NAME=your_cloud_name
      - CLOUDINARY_API_KEY=your_api_key
      - CLOUDINARY_API_SECRET=your_api_secret
      - USE_CLOUDINARY=true
```

---

## Migration from Local Storage

### Prerequisites

- Cloudinary account configured
- Backend environment variables set
- Local `uploads/` directory with existing images

### Run Migration Script

```bash
cd backend
python migrate_to_cloudinary.py
```

### Migration Process

The script will:

1. ✅ Connect to your MongoDB database
2. ✅ Find all local images (`/uploads/...`)
3. ✅ Upload each image to Cloudinary with optimizations
4. ✅ Update database URLs to point to Cloudinary
5. ✅ Generate migration report

### Migration Output Example

```
============================================================
🚀 Starting Cloudinary Migration
============================================================
📸 Starting user images migration...
✅ Migrated avatar for john_doe
✅ Migrated cover photo for john_doe
...
👥 User images migration complete: 50 avatars, 30 covers

📝 Starting post images migration...
✅ Migrated 3 images for post abc123...
...
📝 Post images migration complete: 245 images

📰 Starting blog images migration...
✅ Migrated cover image for blog: Getting Started with...
...
📰 Blog images migration complete: 15 images

============================================================
📊 Migration Summary
============================================================
Total users processed: 50
Total posts processed: 100
Total blogs processed: 15
------------------------------------------------------------
✅ Migrated avatars: 50
✅ Migrated covers: 30
✅ Migrated post images: 245
✅ Migrated blog images: 15
------------------------------------------------------------
⏭️  Skipped (already migrated): 0
❌ Failed uploads: 0
------------------------------------------------------------
⏱️  Total time: 45.32 seconds
============================================================
🎉 Migration completed successfully!
💡 Next steps:
   1. Set USE_CLOUDINARY=true in your .env file
   2. Restart your backend server
   3. All new uploads will use Cloudinary
```

### Verify Migration

After migration:

1. Check MongoDB - URLs should start with `https://res.cloudinary.com/...`
2. Test image loading on frontend
3. Original files remain in `uploads/` folder (safe to delete after verification)

---

## Features

### Automatic Optimizations

#### Profile Pictures (`/api/upload/profile`)
- **Size**: 400x400px
- **Crop**: Fill with face detection
- **Quality**: Auto good
- **Format**: Auto (WebP when supported)

#### Cover Photos (`/api/upload/cover`)
- **Size**: 1200x400px (wide aspect ratio)
- **Crop**: Fill center
- **Quality**: Auto good
- **Format**: Auto

#### Post Images (`/api/upload/image`)
- **Max Width**: 1200px (maintains aspect ratio)
- **Crop**: Limit (no cropping, just resize)
- **Quality**: Auto good
- **Format**: Auto

#### Blog Cover Images (`/api/upload/blog`)
- **Max Width**: 1400px
- **Quality**: Auto best (higher quality)
- **Format**: Auto

### Responsive Images

Cloudinary automatically generates multiple breakpoints:
- 200px, 400px, 600px, 800px, 1000px, 1200px

Frontend can request specific sizes:
```javascript
getResponsiveImageUrl(imageUrl, 800); // Get 800px version
```

### CDN Delivery

All images served through Cloudinary's global CDN:
- ⚡ **Fast loading** from nearest edge server
- 🌍 **Global coverage** - 200+ edge locations
- 📱 **Mobile optimized** - Automatic format selection
- 🔒 **HTTPS** - Secure delivery

---

## API Endpoints

### Upload Endpoints

#### General Upload
```http
POST /api/upload/image
Content-Type: multipart/form-data
Authorization: Bearer {token}

file: {image file}
```

**Response:**
```json
{
  "url": "https://res.cloudinary.com/.../image.jpg",
  "filename": "original-name.jpg",
  "public_id": "pinpost/posts/user123/image",
  "width": 1200,
  "height": 800,
  "format": "jpg",
  "bytes": 245678,
  "storage": "cloudinary"
}
```

#### Profile Picture Upload
```http
POST /api/upload/profile
```
Optimized for profile pictures (400x400, face detection)

#### Cover Photo Upload
```http
POST /api/upload/cover
```
Optimized for cover photos (1200x400, wide aspect)

#### Blog Cover Upload
```http
POST /api/upload/blog
```
Optimized for blog covers (1400px, high quality)

### Fallback Behavior

If Cloudinary fails or is disabled (`USE_CLOUDINARY=false`):
- ✅ Automatically falls back to local storage
- ✅ Returns `/uploads/...` URL
- ✅ No errors thrown
- ✅ Seamless for end users

---

## Frontend Integration

### Image URL Handling

The frontend automatically handles both Cloudinary and local URLs:

```javascript
import { getImageUrl, getResponsiveImageUrl, getThumbnailUrl } from '@/utils/imageUtils';

// Basic usage
const imageUrl = getImageUrl(user.avatar);

// Responsive image (800px width)
const responsiveUrl = getResponsiveImageUrl(post.cover_image, 800);

// Thumbnail (200x200)
const thumbUrl = getThumbnailUrl(user.avatar, 200);
```

### Automatic Optimizations

```javascript
// Cloudinary URL
const url = "https://res.cloudinary.com/.../image.jpg";

// Frontend automatically adds transformations:
getResponsiveImageUrl(url, 600);
// Returns: ...cloudinary.com/.../w_600,q_auto:good,f_auto/image.jpg

// Thumbnail with lower quality
getThumbnailUrl(url, 150);
// Returns: ...cloudinary.com/.../w_150,q_auto:eco,f_auto/image.jpg
```

### Component Usage

```jsx
import { getImageUrl } from '@/utils/imageUtils';

function UserAvatar({ user }) {
  return (
    <img 
      src={getImageUrl(user.avatar)} 
      alt={user.username}
      className="avatar"
    />
  );
}
```

Works with:
- ✅ Cloudinary URLs: `https://res.cloudinary.com/...`
- ✅ Local URLs: `/uploads/image.jpg`
- ✅ Localhost URLs: `http://localhost:8000/uploads/...`
- ✅ Relative URLs: `/uploads/...`

---

## Folder Structure on Cloudinary

Images are organized in folders:

```
pinpost/
├── profiles/
│   ├── user123/
│   │   └── avatar.jpg
│   └── user456/
│       └── avatar.jpg
├── covers/
│   ├── user123/
│   │   └── cover.jpg
│   └── user456/
│       └── cover.jpg
├── posts/
│   ├── user123/
│   │   ├── post1.jpg
│   │   └── post2.jpg
│   └── user456/
│       └── post1.jpg
├── blogs/
│   └── user123/
│       └── blog-cover.jpg
└── stories/
    └── user123/
        └── story1.jpg
```

---

## Cloudinary Dashboard

### Monitor Usage

1. Go to [Cloudinary Dashboard](https://cloudinary.com/console)
2. View **Media Library** to see all uploaded images
3. Check **Usage** for bandwidth and storage stats

### Free Tier Limits

- **Storage**: 25 GB
- **Bandwidth**: 25 GB/month
- **Transformations**: 25,000/month
- **Images**: Unlimited uploads

### Upgrade if Needed

If you exceed free tier:
- **Plus Plan**: $99/month (100GB storage, 100GB bandwidth)
- **Advanced Plan**: Custom pricing

---

## Troubleshooting

### Images Not Uploading to Cloudinary

**Check environment variables:**
```bash
cd backend
python -c "import os; from dotenv import load_dotenv; load_dotenv(); print(f'CLOUDINARY_CLOUD_NAME={os.getenv(\"CLOUDINARY_CLOUD_NAME\")}'); print(f'USE_CLOUDINARY={os.getenv(\"USE_CLOUDINARY\")}')"
```

**Check Cloudinary configuration:**
```bash
cd backend
python -c "from cloudinary_utils import CloudinaryUploader; print(f'Configured: {CloudinaryUploader.is_configured()}')"
```

**Check backend logs:**
```bash
docker-compose logs backend | grep -i cloudinary
```

### Migration Failed

**Common issues:**

1. **Local files not found**
   - Ensure `uploads/` directory exists
   - Check file paths in database match actual files

2. **Cloudinary credentials invalid**
   - Verify credentials in Cloudinary dashboard
   - Check for typos in .env file

3. **Network timeout**
   - Increase timeout in cloudinary_utils.py
   - Run migration in batches (modify script)

### Images Load Slowly

**Possible causes:**

1. **Not using CDN** - Check if URLs start with `res.cloudinary.com`
2. **Large original images** - Cloudinary auto-optimizes, but may take first load
3. **No responsive breakpoints** - Ensure frontend uses `getResponsiveImageUrl()`

**Solutions:**

- Use `getThumbnailUrl()` for small previews
- Implement lazy loading in frontend
- Enable Cloudinary auto-format and auto-quality

### Costs Too High

**Optimize bandwidth:**

1. Use responsive images (don't load 4K images on mobile)
2. Use thumbnails in lists/grids
3. Enable browser caching
4. Use `q_auto:eco` for thumbnails

**Monitor usage:**
```javascript
// Frontend - use smaller sizes
getThumbnailUrl(image, 200);  // Instead of full size
getResponsiveImageUrl(image, 800);  // Instead of 1200px
```

---

## Advanced Features

### Custom Transformations

```python
# In backend - custom transformation
from cloudinary_utils import CloudinaryUploader

result = await CloudinaryUploader.upload_image(
    file_content=content,
    filename="image.jpg",
    media_type='post',
    custom_transformation={
        'width': 800,
        'height': 600,
        'crop': 'fill',
        'gravity': 'auto',
        'quality': 'auto:best',
        'effect': 'sharpen:50'
    }
)
```

### Image Filters

```javascript
// Frontend - add filters via URL
const filteredUrl = getImageUrl(image).replace(
  '/upload/',
  '/upload/e_grayscale,e_contrast:30/'
);
```

### Lazy Loading

```jsx
import { getResponsiveImageUrl } from '@/utils/imageUtils';

function LazyImage({ src, alt }) {
  return (
    <img 
      src={getResponsiveImageUrl(src, 800)}
      loading="lazy"
      alt={alt}
    />
  );
}
```

---

## Production Deployment

### Deploy with Cloudinary

```bash
# 1. Set environment variables
export CLOUDINARY_CLOUD_NAME=your_cloud_name
export CLOUDINARY_API_KEY=your_api_key
export CLOUDINARY_API_SECRET=your_api_secret
export USE_CLOUDINARY=true

# 2. Run migration (one-time)
cd backend
python migrate_to_cloudinary.py

# 3. Deploy
cd /docker/pinpost
git pull origin main
docker-compose down
docker-compose up -d --build
```

### Verify Production

1. Upload a new image
2. Check response - should contain `"storage": "cloudinary"`
3. Verify URL starts with `https://res.cloudinary.com/`
4. Test image loading on desktop and mobile

---

## Benefits Summary

### Before Cloudinary (Local Storage)
- ❌ Images stored on server disk
- ❌ No CDN - slow loading globally
- ❌ Mobile caching issues
- ❌ Manual optimization needed
- ❌ Large bandwidth costs
- ❌ Single server = single point of failure

### After Cloudinary
- ✅ Images on global CDN
- ✅ Fast loading worldwide
- ✅ No mobile caching issues
- ✅ Automatic optimization (WebP, resize, quality)
- ✅ Reduced bandwidth costs
- ✅ Unlimited storage (free tier: 25GB)
- ✅ Responsive images auto-generated
- ✅ Face detection for profile pics
- ✅ Image transformations on-the-fly

---

## Next Steps

1. ✅ Set up Cloudinary account
2. ✅ Configure environment variables
3. ✅ Run migration script
4. ✅ Deploy to production
5. ✅ Monitor usage in Cloudinary dashboard
6. ✅ Optimize frontend to use responsive images

---

## Support

- **Cloudinary Docs**: [https://cloudinary.com/documentation](https://cloudinary.com/documentation)
- **API Reference**: [https://cloudinary.com/documentation/image_upload_api_reference](https://cloudinary.com/documentation/image_upload_api_reference)
- **Community**: [https://community.cloudinary.com/](https://community.cloudinary.com/)

---

## License

Cloudinary integration code is part of Pinpost and follows the same license.
