"""Upload routes - image and audio upload to Cloudinary."""
import logging
from fastapi import APIRouter, HTTPException, Depends, File, UploadFile
import sys
from pathlib import Path

# Add parent directory to path for cloudinary_utils
sys.path.insert(0, str(Path(__file__).parent.parent.parent))
from cloudinary_utils import upload_to_cloudinary

from ..dependencies import get_current_user

router = APIRouter()


@router.post("/upload/image")
async def upload_image(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user),
    upload_type: str = "profile"
):
    """Upload an image to Cloudinary."""
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Determine Cloudinary folder based on upload type
    folders = {
        "profile": "pinpost/avatars",
        "cover": "pinpost/covers",
        "post": "pinpost/posts",
        "blog": "pinpost/blogs",
        "story": "pinpost/stories",
        "message": "pinpost/messages"
    }
    folder = folders.get(upload_type, "pinpost/uploads")
    
    try:
        file_content = await file.read()
        result = upload_to_cloudinary(file_content, file.filename, upload_type, folder)
        
        if result:
            return {"url": result["secure_url"], "public_id": result.get("public_id")}
        else:
            raise HTTPException(status_code=500, detail="Upload failed")
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"CRITICAL UPLOAD ERROR: {type(e).__name__}: {e}")
        logging.error(f"Upload error: {e}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@router.post("/upload/audio")
async def upload_audio(file: UploadFile = File(...), user_id: str = Depends(get_current_user)):
    """Upload an audio file to Cloudinary."""
    allowed_types = ["audio/mpeg", "audio/wav", "audio/webm", "audio/ogg", "audio/mp4"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Invalid audio format")
    
    try:
        file_content = await file.read()
        result = upload_to_cloudinary(file_content, file.filename, "message")
        
        if result:
            return {"url": result["secure_url"], "public_id": result.get("public_id")}
        else:
            raise HTTPException(status_code=500, detail="Upload failed")
    except Exception as e:
        logging.error(f"Audio upload error: {e}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")
