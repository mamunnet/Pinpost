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

    if not all([cloud_name, api_key, api_secret]):
        print("WARNING: Cloudinary credentials missing in environment variables!")
        # Fallback to try loading explicitly if checks fail (though config.py should have handled it)
        # from dotenv import load_dotenv
        # load_dotenv()
        # Retry
        cloud_name = os.environ.get('CLOUDINARY_CLOUD_NAME', '')
        api_key = os.environ.get('CLOUDINARY_API_KEY', '')
        api_secret = os.environ.get('CLOUDINARY_API_SECRET', '')
        
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

def upload_to_cloudinary(file_content: bytes, filename: str, upload_type: str = 'profile') -> dict:
    """
    Upload image to Cloudinary using unsigned presets
    
    Args:
        file_content: Image file bytes
        filename: Original filename
        upload_type: Type of upload (profile, cover, post, blog, story)
    
    Returns:
        dict with url, public_id, secure_url
    """
    try:
        global _configured
        if not _configured:
            configure_cloudinary()
            _configured = True
            
        preset = PRESETS.get(upload_type, 'pinpost_profile')
        
        result = cloudinary.uploader.upload(
            file_content,
            upload_preset=preset,
            resource_type="image"
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