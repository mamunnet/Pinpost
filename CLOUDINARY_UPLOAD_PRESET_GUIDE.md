# Cloudinary Upload Preset Configuration Guide

## Overview

Upload presets allow you to centrally define upload settings that are automatically applied to all uploads using that preset. This eliminates the need to specify parameters in each upload call and ensures consistency across your application.

## Benefits of Using Upload Presets

✅ **Centralized Configuration** - Define once, use everywhere
✅ **Automatic Organization** - All media automatically stored in correct folders
✅ **Consistent Transformations** - Apply same optimizations to all uploads
✅ **Security** - Use unsigned presets for client-side uploads safely
✅ **Easy Updates** - Change settings without modifying code

---

## Step 1: Create Upload Preset in Cloudinary Console

### Option A: Using Cloudinary Console (Recommended for Quick Setup)

1. **Log in to Cloudinary Dashboard**
   - Visit: https://console.cloudinary.com

2. **Navigate to Upload Settings**
   - Click **Settings** (gear icon) → **Upload** → **Upload presets**
   - Click **Add upload preset** button

3. **Configure General Settings**
   ```
   Preset name: pinpost_media
   Signing mode: Unsigned (for client-side uploads)
   ```

4. **Configure Folder Structure** (Under "Destination" section)
   ```
   Use asset folder as public ID prefix: ✓ (checked)
   Asset folder: pinpost
   ```
   
   This ensures all uploads go to `pinpost/` folder and subfolders

5. **Configure File Naming** (Under "Public ID" section)
   ```
   Use filename: ✓ (checked)
   Unique filename: ✓ (checked)
   ```

6. **Configure Image Settings** (Under "Image" section)
   ```
   Auto format: ✓ (WebP, AVIF fallback)
   Auto quality: ✓ (Automatic quality optimization)
   ```

7. **Configure Advanced Options** (Under "Advanced" tab)
   ```
   Allowed formats: jpg, png, gif, webp, mp4, mov
   Max file size: 10485760 (10MB)
   ```

8. **Save the Preset**
   - Click **Save** button
   - Note the preset name: `pinpost_media`

### Option B: Using Admin API (Programmatic Setup)

Create a script to generate the preset programmatically:

**Create file:** `backend/setup_upload_preset.py`

```python
import cloudinary
import cloudinary.api
import os
from dotenv import load_dotenv

load_dotenv()

# Configure Cloudinary
cloudinary.config(
    cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME'),
    api_key=os.getenv('CLOUDINARY_API_KEY'),
    api_secret=os.getenv('CLOUDINARY_API_SECRET')
)

# Create upload preset
preset_config = {
    "name": "pinpost_media",
    "unsigned": True,  # Allow unsigned uploads
    "folder": "pinpost",  # Base folder for all uploads
    "use_filename": True,
    "unique_filename": True,
    "use_asset_folder_as_public_id_prefix": True,
    "allowed_formats": "jpg,png,gif,webp,mp4,mov",
    "auto_tagging": 0.6,  # Auto-tag with 60% confidence
    "tags": "pinpost,auto-upload",
    "quality": "auto",
    "fetch_format": "auto",
    "max_file_size": 10485760,  # 10MB
}

try:
    # Create the preset
    result = cloudinary.api.create_upload_preset(**preset_config)
    print(f"✓ Upload preset created successfully!")
    print(f"Preset name: {result['name']}")
    print(f"Settings: {result.get('settings', {})}")
except cloudinary.api.Error as e:
    if "already exists" in str(e):
        print(f"✓ Upload preset '{preset_config['name']}' already exists")
        # Update existing preset
        try:
            result = cloudinary.api.update_upload_preset(
                preset_config['name'],
                **{k: v for k, v in preset_config.items() if k != 'name'}
            )
            print(f"✓ Updated existing preset")
        except Exception as update_error:
            print(f"✗ Error updating preset: {update_error}")
    else:
        print(f"✗ Error creating preset: {e}")
```

**Run the script:**
```bash
cd backend
python setup_upload_preset.py
```

---

## Step 2: Create Specialized Presets for Different Media Types

### Profile Picture Preset

**Preset name:** `pinpost_profile`

**Settings:**
```python
{
    "name": "pinpost_profile",
    "unsigned": True,
    "folder": "pinpost/profiles",
    "use_filename": False,  # Use random IDs for privacy
    "unique_filename": True,
    "transformation": {
        "width": 400,
        "height": 400,
        "crop": "fill",
        "gravity": "face",
        "quality": "auto",
        "fetch_format": "auto"
    },
    "allowed_formats": "jpg,png,webp",
    "max_file_size": 5242880  # 5MB
}
```

### Cover Photo Preset

**Preset name:** `pinpost_cover`

**Settings:**
```python
{
    "name": "pinpost_cover",
    "unsigned": True,
    "folder": "pinpost/covers",
    "transformation": {
        "width": 1200,
        "height": 400,
        "crop": "fill",
        "gravity": "auto",
        "quality": "auto",
        "fetch_format": "auto"
    },
    "allowed_formats": "jpg,png,webp",
    "max_file_size": 8388608  # 8MB
}
```

### Post Image Preset

**Preset name:** `pinpost_posts`

**Settings:**
```python
{
    "name": "pinpost_posts",
    "unsigned": True,
    "folder": "pinpost/posts",
    "transformation": {
        "width": 1200,
        "crop": "limit",
        "quality": "auto:good",
        "fetch_format": "auto"
    },
    "allowed_formats": "jpg,png,gif,webp",
    "max_file_size": 10485760  # 10MB
}
```

### Blog Image Preset

**Preset name:** `pinpost_blogs`

**Settings:**
```python
{
    "name": "pinpost_blogs",
    "unsigned": True,
    "folder": "pinpost/blogs",
    "transformation": {
        "width": 1400,
        "crop": "limit",
        "quality": "auto:best",
        "fetch_format": "auto"
    },
    "allowed_formats": "jpg,png,webp",
    "max_file_size": 10485760  # 10MB
}
```

### Story Preset

**Preset name:** `pinpost_stories`

**Settings:**
```python
{
    "name": "pinpost_stories",
    "unsigned": True,
    "folder": "pinpost/stories",
    "transformation": {
        "width": 1080,
        "height": 1920,
        "crop": "fill",
        "gravity": "auto",
        "quality": "auto",
        "fetch_format": "auto"
    },
    "allowed_formats": "jpg,png,gif,webp,mp4",
    "max_file_size": 15728640  # 15MB
}
```

---

## Step 3: Update Backend to Use Upload Presets

### Modify `cloudinary_utils.py`

Add upload preset parameter to the CloudinaryUploader class:

```python
class CloudinaryUploader:
    """Cloudinary upload utility with upload preset support"""
    
    @staticmethod
    def upload_with_preset(file, preset_name, folder=None, resource_type="image"):
        """
        Upload file using a predefined upload preset
        
        Args:
            file: File to upload
            preset_name: Name of the upload preset to use
            folder: Optional subfolder (added to preset's folder)
            resource_type: Type of resource (image, video, raw)
        
        Returns:
            dict: Upload response with URL and metadata
        """
        try:
            # Base upload parameters
            upload_params = {
                "upload_preset": preset_name,
                "resource_type": resource_type
            }
            
            # Add subfolder if specified (appended to preset's folder)
            if folder:
                upload_params["folder"] = f"pinpost/{folder}"
            
            # Upload to Cloudinary
            result = cloudinary.uploader.upload(file, **upload_params)
            
            logger.info(f"File uploaded via preset '{preset_name}': {result.get('secure_url')}")
            
            return {
                "url": result["secure_url"],
                "public_id": result["public_id"],
                "format": result.get("format"),
                "width": result.get("width"),
                "height": result.get("height"),
                "bytes": result.get("bytes"),
                "storage": "cloudinary",
                "preset": preset_name
            }
            
        except Exception as e:
            logger.error(f"Cloudinary preset upload failed: {str(e)}")
            raise
```

### Update `server.py` Upload Endpoints

Modify your upload endpoints to use presets:

```python
from cloudinary_utils import CloudinaryUploader

# Profile photo upload
@app.post("/api/upload/profile")
async def upload_profile(file: UploadFile = File(...)):
    """Upload profile photo using preset"""
    try:
        contents = await file.read()
        
        # Use upload preset
        result = CloudinaryUploader.upload_with_preset(
            contents,
            preset_name="pinpost_profile"
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Profile upload error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Cover photo upload
@app.post("/api/upload/cover")
async def upload_cover(file: UploadFile = File(...)):
    """Upload cover photo using preset"""
    try:
        contents = await file.read()
        
        result = CloudinaryUploader.upload_with_preset(
            contents,
            preset_name="pinpost_cover"
        )
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Post image upload
@app.post("/api/upload/image")
async def upload_post_image(
    file: UploadFile = File(...),
    current_user_id: str = Depends(get_current_user)
):
    """Upload post image using preset with user subfolder"""
    try:
        contents = await file.read()
        
        # Use preset with user-specific subfolder
        result = CloudinaryUploader.upload_with_preset(
            contents,
            preset_name="pinpost_posts",
            folder=f"posts/{current_user_id}"
        )
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Blog image upload
@app.post("/api/upload/blog")
async def upload_blog_image(
    file: UploadFile = File(...),
    current_user_id: str = Depends(get_current_user)
):
    """Upload blog image using preset"""
    try:
        contents = await file.read()
        
        result = CloudinaryUploader.upload_with_preset(
            contents,
            preset_name="pinpost_blogs",
            folder=f"blogs/{current_user_id}"
        )
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

---

## Step 4: Frontend Integration

### Update Upload Functions

**Example for profile photo upload:**

```javascript
// In your React component
const uploadProfilePhoto = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    // Backend automatically uses 'pinpost_profile' preset
    const response = await axios.post(
      `${API}/upload/profile`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    // Response includes Cloudinary URL
    console.log('Uploaded to:', response.data.url);
    // URL format: https://res.cloudinary.com/your-cloud/image/upload/v123/pinpost/profiles/abc123.jpg
    
    return response.data.url;
    
  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
};
```

---

## Step 5: Verify Upload Preset Configuration

### Test Upload Preset

Create a test script: `backend/test_upload_preset.py`

```python
import cloudinary
import cloudinary.uploader
import os
from dotenv import load_dotenv

load_dotenv()

cloudinary.config(
    cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME'),
    api_key=os.getenv('CLOUDINARY_API_KEY'),
    api_secret=os.getenv('CLOUDINARY_API_SECRET')
)

# Test upload with preset
test_image_url = "https://via.placeholder.com/400x400.png"

try:
    result = cloudinary.uploader.upload(
        test_image_url,
        upload_preset="pinpost_profile"
    )
    
    print("✓ Upload successful!")
    print(f"URL: {result['secure_url']}")
    print(f"Folder: {result.get('folder', 'root')}")
    print(f"Public ID: {result['public_id']}")
    print(f"Format: {result['format']}")
    print(f"Transformations: {result.get('transformation', 'none')}")
    
except Exception as e:
    print(f"✗ Upload failed: {e}")
```

**Run test:**
```bash
cd backend
python test_upload_preset.py
```

---

## Folder Structure Result

After implementing upload presets, your Cloudinary media library will be organized like this:

```
pinpost/
├── profiles/
│   ├── user1_abc123.jpg (400x400, face-cropped)
│   ├── user2_def456.jpg
│   └── user3_ghi789.jpg
├── covers/
│   ├── user1_cover_xyz.jpg (1200x400, auto-gravity)
│   ├── user2_cover_abc.jpg
│   └── user3_cover_def.jpg
├── posts/
│   ├── user1/
│   │   ├── post1_image.jpg (max 1200px width)
│   │   ├── post2_image.jpg
│   │   └── post3_image.jpg
│   ├── user2/
│   │   └── post1_image.jpg
│   └── user3/
│       ├── post1_image.jpg
│       └── post2_image.jpg
├── blogs/
│   ├── user1/
│   │   ├── blog1_cover.jpg (max 1400px, best quality)
│   │   └── blog2_cover.jpg
│   └── user2/
│       └── blog1_cover.jpg
└── stories/
    ├── story1_abc.jpg (1080x1920, vertical)
    ├── story2_def.mp4
    └── story3_ghi.jpg
```

---

## Benefits Summary

### Automatic Organization
✅ All media automatically organized in correct folders
✅ No manual folder specification needed in code
✅ Consistent naming across the app

### Automatic Transformations
✅ Profile photos auto-cropped to 400x400 with face detection
✅ Cover photos auto-fitted to 1200x400
✅ All images auto-converted to WebP when supported
✅ Quality automatically optimized

### Security
✅ Unsigned presets allow safe client-side uploads
✅ File type restrictions enforced
✅ Size limits automatically applied

### Performance
✅ WebP format reduces file sizes by 30-80%
✅ Auto-quality reduces bandwidth usage
✅ CDN delivery ensures fast loading worldwide

---

## Troubleshooting

### Issue: "Upload preset not found"
**Solution:**
```bash
# Verify preset exists
cd backend
python -c "import cloudinary.api; print(cloudinary.api.upload_presets())"
```

### Issue: "Unsigned uploads not allowed"
**Solution:**
- Check preset is set to `unsigned: true`
- Verify in Console: Settings → Upload → Upload presets → Edit preset → Signing mode: Unsigned

### Issue: "Files not going to correct folder"
**Solution:**
- Verify preset has `folder` parameter set
- Check `use_asset_folder_as_public_id_prefix: true` is enabled

### Issue: "Transformations not applied"
**Solution:**
- Presets apply transformations during upload
- Check preset configuration includes `transformation` object
- Verify in Cloudinary dashboard under Media Library

---

## Advanced: Webhook Notifications

Configure webhook to receive notifications when uploads complete:

**In Cloudinary Console:**
1. Settings → Webhooks
2. Add notification URL: `https://yourdomain.com/api/webhooks/cloudinary`
3. Select events: Upload, Delete, Transform

**Backend webhook handler:**
```python
@app.post("/api/webhooks/cloudinary")
async def cloudinary_webhook(request: Request):
    """Handle Cloudinary upload notifications"""
    try:
        payload = await request.json()
        
        if payload.get("notification_type") == "upload":
            public_id = payload.get("public_id")
            url = payload.get("secure_url")
            
            logger.info(f"Upload completed: {public_id} → {url}")
            
            # Optional: Update database, send notifications, etc.
            
        return {"status": "ok"}
        
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return {"status": "error", "message": str(e)}
```

---

## Next Steps

1. ✅ Create upload presets in Cloudinary Console
2. ✅ Update `cloudinary_utils.py` with preset support
3. ✅ Modify upload endpoints to use presets
4. ✅ Test uploads with preset
5. ✅ Deploy to production
6. ✅ Monitor Cloudinary dashboard for organized media

**Full documentation:** See [CLOUDINARY_INTEGRATION.md](./CLOUDINARY_INTEGRATION.md)
