import cloudinary
import cloudinary.uploader
import cloudinary.api
import os
from typing import Optional

# Configure Cloudinary
cloudinary.config(
    cloud_name="djfz2dzes",
    api_key="149856726514542",
    api_secret="ED2ML-7gjYXguM4xTYCxf0hvGoY",
    secure=True
)

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