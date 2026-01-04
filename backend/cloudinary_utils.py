import cloudinary
import cloudinary.uploader
import cloudinary.api
import os
from typing import Optional

# Configure Cloudinary from environment variables
def configure_cloudinary():
    cloud_name = os.environ.get('CLOUDINARY_CLOUD_NAME', '')
    api_key = os.environ.get('CLOUDINARY_API_KEY', '')
    api_secret = os.environ.get('CLOUDINARY_API_SECRET', '')

    # Try loading environment variables explicitly
    try:
        from dotenv import load_dotenv
        from pathlib import Path
        env_path = Path(__file__).resolve().parent / '.env'
        load_dotenv(env_path)
        print(f"DEBUG: Loaded env from {env_path}")
    except Exception as e:
        print(f"DEBUG: Failed to load env: {e}")

    cloud_name = os.environ.get('CLOUDINARY_CLOUD_NAME', '')
    api_key = os.environ.get('CLOUDINARY_API_KEY', '')
    api_secret = os.environ.get('CLOUDINARY_API_SECRET', '')

    print(f"DEBUG: Cloudinary Config - Name: {'Found' if cloud_name else 'Missing'}, Key: {'Found' if api_key else 'Missing'}, Secret: {'Found' if api_secret else 'Missing'}")

    if not all([cloud_name, api_key, api_secret]):
        print("WARNING: Cloudinary credentials missing in environment variables!")
        
    print(f"Cloudinary configured with cloud_name: {cloud_name}")

    cloudinary.config(
        cloud_name=cloud_name,
        api_key=api_key,
        api_secret=api_secret,
        secure=True
    )

_configured = False

# Upload preset names
PRESETS = {
    'profile': 'pinpost_profile',
    'cover': 'pinpost_cover',
    'post': 'pinpost_posts',
    'blog': 'pinpost_blogs',
    'story': 'pinpost_stories'
}

def upload_to_cloudinary(file_content: bytes, filename: str, upload_type: str = 'profile', folder: str = 'pinpost/uploads') -> dict:
    """
    Upload image to Cloudinary using authenticated upload (API Key/Secret)
    """
    try:
        global _configured
        if not _configured:
            configure_cloudinary()
            _configured = True
            
        # Use authenticated upload with folder instead of relying on presets
        print(f"DEBUG: Uploading to folder {folder}")
        result = cloudinary.uploader.upload(
            file_content,
            folder=folder,
            resource_type="image",
            public_id=os.path.splitext(filename)[0] # Optional: keep original filename as ID
        )
        
        return {
            'url': result['secure_url'],
            'public_id': result['public_id'],
            'format': result.get('format'),
            'width': result.get('width'),
            'height': result.get('height'),
            'cloudinary': True
        }
    except Exception as e:
        print(f"Cloudinary upload error: {e}")
        raise Exception(f"Failed to upload to Cloudinary: {str(e)}")

def delete_from_cloudinary(public_id: str) -> bool:
    """Delete image from Cloudinary"""
    try:
        result = cloudinary.uploader.destroy(public_id)
        return result.get('result') == 'ok'
    except Exception as e:
        print(f"Cloudinary delete error: {e}")
        return False

def get_cloudinary_url(public_id: str, transformation: Optional[dict] = None) -> str:
    """Get Cloudinary URL with optional transformations"""
    try:
        if transformation:
            return cloudinary.CloudinaryImage(public_id).build_url(**transformation)
        return cloudinary.CloudinaryImage(public_id).build_url()
    except:
        return ""