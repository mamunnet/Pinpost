# Cloudinary Integration for Production

## Current Situation

**Localhost:** Works because files are saved to local `uploads/` directory and served via `http://localhost:8000/uploads/xxx.jpg`

**Production:** NOT working because:
1. Files are saved to Docker container's `/app/uploads`
2. Volume is mounted correctly
3. BUT you want to use Cloudinary instead

## Why Use Cloudinary?

- ✅ **CDN**: Fast image delivery worldwide
- ✅ **Automatic optimization**: WebP, compression
- ✅ **Transformations**: Resize, crop on-the-fly
- ✅ **No storage issues**: Unlimited uploads
- ✅ **Better than local storage**: No server disk space concerns

## Setup Steps

### 1. Get Cloudinary Credentials

1. Go to https://cloudinary.com
2. Sign up / Log in
3. Go to Dashboard
4. Copy these values:
   - **Cloud Name**: `dxxxxxx`
   - **API Key**: `123456789012345`
   - **API Secret**: `xxxxxxxxxxxxxxxxxxxxxxx`

### 2. Install Cloudinary in Backend

```bash
# On your local machine or server
cd D:\dev_project\Pinpost\backend
pip install cloudinary
pip freeze > requirements.txt
```

### 3. Update backend/.env

Add Cloudinary credentials:

```env
# Existing
MONGO_URL=mongodb+srv://...
DB_NAME=penlink_database
SECRET_KEY=...
FRONTEND_URL=http://localhost:3000

# Add these for Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 4. Update Docker Environment Variables

**docker-compose.yml:**

```yaml
services:
  backend:
    environment:
      - MONGO_URL=...
      - DB_NAME=...
      - SECRET_KEY=...
      - FRONTEND_URL=https://bartaaddaa.com
      - CLOUDINARY_CLOUD_NAME=your_cloud_name
      - CLOUDINARY_API_KEY=your_api_key
      - CLOUDINARY_API_SECRET=your_api_secret
      - ENVIRONMENT=production
```

### 5. Update Backend Upload Endpoint

Replace the current `/upload/image` endpoint in `backend/server.py`:

```python
import cloudinary
import cloudinary.uploader
import cloudinary.api
from pathlib import Path
import uuid
import os

# Configure Cloudinary (add at top of file after imports)
cloudinary.config( 
  cloud_name = os.environ.get('CLOUDINARY_CLOUD_NAME'),
  api_key = os.environ.get('CLOUDINARY_API_KEY'),
  api_secret = os.environ.get('CLOUDINARY_API_SECRET'),
  secure = True
)

@api_router.post("/upload/image")
async def upload_image(file: UploadFile = File(...), user_id: str = Depends(get_current_user)):
    # Validate file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Validate file size (10MB limit)
    content = await file.read()
    file_size = len(content)
    
    if file_size > 10 * 1024 * 1024:  # 10MB
        raise HTTPException(status_code=400, detail="File size must be less than 10MB")
    
    try:
        # Check if Cloudinary is configured
        use_cloudinary = bool(os.environ.get('CLOUDINARY_CLOUD_NAME'))
        
        if use_cloudinary:
            # Upload to Cloudinary
            file_extension = Path(file.filename).suffix if file.filename else ".jpg"
            public_id = f"pinpost/{user_id}/{uuid.uuid4()}"
            
            # Upload with optimizations
            upload_result = cloudinary.uploader.upload(
                content,
                public_id=public_id,
                folder="pinpost/uploads",
                resource_type="image",
                format=file_extension.lstrip('.'),
                transformation=[
                    {'quality': 'auto:good'},
                    {'fetch_format': 'auto'}
                ]
            )
            
            # Return Cloudinary URL
            file_url = upload_result['secure_url']
            return {
                "url": file_url,
                "filename": upload_result['public_id'],
                "cloudinary": True
            }
        else:
            # Fallback to local storage (for localhost)
            upload_dir = Path("uploads")
            upload_dir.mkdir(exist_ok=True)
            
            file_extension = Path(file.filename).suffix if file.filename else ".jpg"
            unique_filename = f"{uuid.uuid4()}{file_extension}"
            file_path = upload_dir / unique_filename
            
            with open(file_path, "wb") as buffer:
                buffer.write(content)
            
            file_url = f"/uploads/{unique_filename}"
            return {
                "url": file_url,
                "filename": unique_filename,
                "cloudinary": False
            }
            
    except Exception as e:
        print(f"Upload error: {e}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")
```

### 6. Update Frontend to Handle Both Local and Cloudinary URLs

**frontend/src/utils/imageUtils.js:**

```javascript
export const getImageUrl = (imageUrl) => {
  if (!imageUrl) return '';
  
  // Cloudinary URLs (https://res.cloudinary.com/...)
  if (imageUrl.startsWith('https://res.cloudinary.com/')) {
    return imageUrl;
  }
  
  // Full URLs (http:// or https://)
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    if (imageUrl.startsWith(BACKEND_URL)) {
      return imageUrl;
    }
    if (imageUrl.includes('/uploads/')) {
      const fileName = imageUrl.split('/uploads/')[1];
      return `${BACKEND_URL}/uploads/${fileName}`;
    }
    return imageUrl;
  }
  
  // Relative paths (/uploads/xxx.jpg)
  if (imageUrl.startsWith('/uploads/')) {
    return `${BACKEND_URL}${imageUrl}`;
  }
  
  // Just filename
  if (!imageUrl.includes('/')) {
    return `${BACKEND_URL}/uploads/${imageUrl}`;
  }
  
  return `${BACKEND_URL}${imageUrl}`;
};
```

### 7. Update Frontend Upload Handler

**frontend/src/components/EditAvatarModal.js:**

```javascript
const handleFileUpload = async (file) => {
  if (file && file.type.startsWith('image/')) {
    try {
      setUploading(true);
      
      // Create preview URL immediately
      const localPreview = URL.createObjectURL(file);
      setPreviewUrl(localPreview);
      setPosition({ x: 0, y: 0 });
      setHasChanges(true);
      
      // Upload to server
      const formData = new FormData();
      formData.append('file', file);
      
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/upload/image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
      });
      
      // Handle both Cloudinary and local URLs
      const uploadedUrl = response.data.url;
      
      if (response.data.cloudinary) {
        // Cloudinary URL (full HTTPS URL)
        setAvatarUrl(uploadedUrl);
        setPreviewUrl(uploadedUrl);
      } else {
        // Local storage (relative path)
        setAvatarUrl(uploadedUrl); // /uploads/xxx.jpg
        setPreviewUrl(`${BACKEND_URL}${uploadedUrl}`); // Full URL for preview
      }
      
      setUploadedServerUrl(uploadedUrl);
      toast.success('Image uploaded successfully!');
      
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed');
      setPreviewUrl(originalAvatar);
      setAvatarUrl(user.avatar || '');
      setHasChanges(false);
    } finally {
      setUploading(false);
    }
  }
};
```

## Deployment Steps

### Local Development (No Cloudinary)

1. Don't add Cloudinary env vars
2. Works with local `/uploads` directory
3. Files served via `http://localhost:8000/uploads/`

### Production (With Cloudinary)

```bash
# 1. Update backend requirements
cd D:\dev_project\Pinpost\backend
pip install cloudinary
pip freeze > requirements.txt

# 2. Commit changes
git add .
git commit -m "feat: add Cloudinary integration for production image uploads"
git push origin main

# 3. SSH to production server
ssh your-server
cd /docker/pinpost

# 4. Create/update production env file
nano backend/.env.production
# Add:
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# 5. Update docker-compose.yml to use env file
# Or add environment variables directly

# 6. Rebuild and deploy
git pull origin main
docker compose down
docker compose build --no-cache backend
docker compose up -d

# 7. Test upload
# - Go to profile
# - Upload avatar
# - Check browser Network tab
# - Should see Cloudinary URL: https://res.cloudinary.com/...
```

## Testing

### Check if Using Cloudinary

**In browser console after uploading:**

```javascript
// Network tab → Check upload response
// Should see:
{
  "url": "https://res.cloudinary.com/your_cloud/image/upload/...",
  "cloudinary": true
}

// Instead of:
{
  "url": "/uploads/xxx.jpg",
  "cloudinary": false
}
```

### Verify Images Load

1. Upload avatar
2. Check Network tab
3. Image request should go to:
   - **Production with Cloudinary**: `https://res.cloudinary.com/...`
   - **Localhost**: `http://localhost:8000/uploads/...`

## Benefits of This Approach

✅ **Automatic fallback**: Localhost uses local storage, production uses Cloudinary
✅ **No breaking changes**: Works in both environments
✅ **Better performance**: Cloudinary CDN for production
✅ **Optimized images**: Automatic WebP, compression
✅ **Scalable**: No server storage limits

## Quick Fix Without Cloudinary

If you just want to fix production **without** Cloudinary:

**Check these:**

1. **Volume mounting working?**
   ```bash
   docker exec -it pinpost-backend ls -la /app/uploads
   ```

2. **nginx serving uploads?**
   ```nginx
   location /uploads {
       proxy_pass http://backend:8000;
   }
   ```

3. **Files actually saved?**
   ```bash
   docker exec -it pinpost-backend find /app/uploads -name "*.jpg"
   ```

4. **URL correct in database?**
   ```bash
   # Check user avatar in MongoDB
   # Should be: /uploads/xxx.jpg
   # NOT: http://localhost:8000/uploads/xxx.jpg
   ```

Let me know if you want:
- ✅ Full Cloudinary integration
- ✅ Fix local storage for production
- ✅ Both options working
