"""
Cloudinary Integration Module
Handles all media uploads to Cloudinary with optimization and transformations
"""

import os
import logging
from typing import Optional, Dict, Any
import cloudinary
import cloudinary.uploader
import cloudinary.api
from pathlib import Path

# Configure Cloudinary
cloudinary.config(
    cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME'),
    api_key=os.getenv('CLOUDINARY_API_KEY'),
    api_secret=os.getenv('CLOUDINARY_API_SECRET'),
    secure=True
)

logger = logging.getLogger(__name__)


class CloudinaryUploader:
    """
    Handles media uploads to Cloudinary with upload presets
    """
    
    # Upload preset names (created in Cloudinary Console)
    UPLOAD_PRESETS = {
        'profile': 'pinpost_profile',
        'cover': 'pinpost_cover',
        'post': 'pinpost_posts',
        'blog': 'pinpost_blogs',
        'story': 'pinpost_stories',
    }
    
    # Folder structure for organized media storage (used when preset not available)
    FOLDERS = {
        'profile': 'pinpost/profiles',
        'cover': 'pinpost/covers',
        'post': 'pinpost/posts',
        'blog': 'pinpost/blogs',
        'story': 'pinpost/stories',
    }
    
    # Default transformations for different media types (fallback if preset fails)
    TRANSFORMATIONS = {
        'profile': {
            'width': 400,
            'height': 400,
            'crop': 'fill',
            'gravity': 'face',
            'quality': 'auto:good',
            'fetch_format': 'auto',
        },
        'cover': {
            'width': 1200,
            'height': 400,
            'crop': 'fill',
            'quality': 'auto:good',
            'fetch_format': 'auto',
        },
        'post': {
            'width': 1200,
            'crop': 'limit',
            'quality': 'auto:good',
            'fetch_format': 'auto',
        },
        'blog': {
            'width': 1400,
            'crop': 'limit',
            'quality': 'auto:best',
            'fetch_format': 'auto',
        },
        'story': {
            'width': 1080,
            'height': 1920,
            'crop': 'fill',
            'quality': 'auto:good',
            'fetch_format': 'auto',
        },
    }
    
    @staticmethod
    def is_configured() -> bool:
        """Check if Cloudinary is properly configured"""
        return all([
            os.getenv('CLOUDINARY_CLOUD_NAME'),
            os.getenv('CLOUDINARY_API_KEY'),
            os.getenv('CLOUDINARY_API_SECRET')
        ])
    
    @staticmethod
    async def upload_image(
        file_content: bytes,
        filename: str,
        media_type: str = 'post',
        user_id: Optional[str] = None,
        custom_transformation: Optional[Dict[str, Any]] = None
    ) -> Dict[str, str]:
        """
        Upload image to Cloudinary using upload presets for automatic optimization
        
        Args:
            file_content: Binary content of the file
            filename: Original filename
            media_type: Type of media (profile, cover, post, blog, story)
            user_id: Optional user ID for organizing uploads into subfolders
            custom_transformation: Optional custom transformation parameters (overrides preset)
            
        Returns:
            Dictionary with url, secure_url, public_id, and other metadata
        """
        try:
            # Get upload preset name for this media type
            upload_preset = CloudinaryUploader.UPLOAD_PRESETS.get(media_type)
            
            # Base upload parameters
            upload_params = {
                'resource_type': 'image',
            }
            
            # Option 1: Use upload preset (recommended - automatic organization)
            if upload_preset and not custom_transformation:
                upload_params['upload_preset'] = upload_preset
                
                # For posts and blogs, add user subfolder within preset's base folder
                if user_id and media_type in ['post', 'blog']:
                    # The preset sets base folder (pinpost/posts or pinpost/blogs)
                    # We append user subfolder to create structure like: pinpost/posts/user123
                    upload_params['folder'] = f"pinpost/{media_type}s/{user_id}"
                
                logger.info(f"Uploading with preset: {upload_preset}")
                
            # Option 2: Fallback - manual configuration (if preset not available)
            else:
                folder = CloudinaryUploader.FOLDERS.get(media_type, 'pinpost/misc')
                
                # Add user subfolder if provided
                if user_id:
                    folder = f"{folder}/{user_id}"
                
                upload_params['folder'] = folder
                upload_params['overwrite'] = True
                
                # Get transformation settings
                transformation = custom_transformation or CloudinaryUploader.TRANSFORMATIONS.get(
                    media_type, 
                    CloudinaryUploader.TRANSFORMATIONS['post']
                )
                upload_params['transformation'] = transformation
                
                logger.info(f"Uploading without preset to folder: {folder}")
            
            # Upload to Cloudinary
            result = cloudinary.uploader.upload(file_content, **upload_params)
            
            logger.info(f"✅ Image uploaded to Cloudinary: {result['secure_url']}")
            
            return {
                'url': result['secure_url'],
                'public_id': result['public_id'],
                'format': result['format'],
                'width': result['width'],
                'height': result['height'],
                'bytes': result['bytes'],
                'resource_type': result['resource_type'],
                'created_at': result['created_at'],
                # Responsive image URLs for different breakpoints
                'responsive_urls': [
                    bp['secure_url'] 
                    for bp in result.get('responsive_breakpoints', [[]])[0].get('breakpoints', [])
                ]
            }
            
        except Exception as e:
            logger.error(f"❌ Cloudinary upload failed: {str(e)}")
            raise Exception(f"Failed to upload image to Cloudinary: {str(e)}")
    
    @staticmethod
    async def delete_image(public_id: str) -> bool:
        """
        Delete image from Cloudinary
        
        Args:
            public_id: The public ID of the image to delete
            
        Returns:
            True if successful, False otherwise
        """
        try:
            result = cloudinary.uploader.destroy(public_id)
            success = result.get('result') == 'ok'
            
            if success:
                logger.info(f"✅ Image deleted from Cloudinary: {public_id}")
            else:
                logger.warning(f"⚠️ Failed to delete from Cloudinary: {public_id}")
            
            return success
            
        except Exception as e:
            logger.error(f"❌ Cloudinary delete failed: {str(e)}")
            return False
    
    @staticmethod
    def get_optimized_url(
        url: str,
        width: Optional[int] = None,
        height: Optional[int] = None,
        quality: str = 'auto:good',
        format: str = 'auto'
    ) -> str:
        """
        Get optimized version of Cloudinary URL with transformations
        
        Args:
            url: Original Cloudinary URL
            width: Desired width
            height: Desired height
            quality: Quality setting (auto:good, auto:best, auto:eco)
            format: Format (auto, webp, jpg, png)
            
        Returns:
            Optimized URL with transformations
        """
        if 'cloudinary.com' not in url:
            return url
        
        # Build transformation string
        transformations = []
        if width:
            transformations.append(f"w_{width}")
        if height:
            transformations.append(f"h_{height}")
        transformations.append(f"q_{quality}")
        transformations.append(f"f_{format}")
        
        transformation_str = ','.join(transformations)
        
        # Insert transformation into URL
        # URL format: https://res.cloudinary.com/{cloud_name}/image/upload/v123456/{public_id}.jpg
        # New format: https://res.cloudinary.com/{cloud_name}/image/upload/{transformation}/v123456/{public_id}.jpg
        
        parts = url.split('/upload/')
        if len(parts) == 2:
            return f"{parts[0]}/upload/{transformation_str}/{parts[1]}"
        
        return url
    
    @staticmethod
    def extract_public_id(url: str) -> Optional[str]:
        """
        Extract public_id from Cloudinary URL
        
        Args:
            url: Cloudinary URL
            
        Returns:
            Public ID or None if not a Cloudinary URL
        """
        if 'cloudinary.com' not in url:
            return None
        
        try:
            # URL format: https://res.cloudinary.com/{cloud_name}/image/upload/v123456/{folder}/{public_id}.ext
            parts = url.split('/upload/')
            if len(parts) == 2:
                # Remove version and get path
                path_parts = parts[1].split('/')
                # Remove version if present (starts with 'v')
                if path_parts[0].startswith('v'):
                    path_parts = path_parts[1:]
                
                # Join remaining parts and remove extension
                public_id = '/'.join(path_parts)
                public_id = public_id.rsplit('.', 1)[0]
                
                return public_id
        except Exception as e:
            logger.error(f"Failed to extract public_id from URL: {str(e)}")
        
        return None


class CloudinaryHelper:
    """
    Helper methods for Cloudinary operations
    """
    
    @staticmethod
    def get_thumbnail_url(url: str, width: int = 200, height: int = 200) -> str:
        """Get thumbnail version of image"""
        return CloudinaryUploader.get_optimized_url(
            url, 
            width=width, 
            height=height, 
            quality='auto:eco'
        )
    
    @staticmethod
    def get_responsive_url(url: str, width: int) -> str:
        """Get responsive version of image for different screen sizes"""
        return CloudinaryUploader.get_optimized_url(
            url,
            width=width,
            quality='auto:good',
            format='auto'
        )
    
    @staticmethod
    def is_cloudinary_url(url: str) -> bool:
        """Check if URL is from Cloudinary"""
        return url and 'cloudinary.com' in url
