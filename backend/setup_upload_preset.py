"""
Cloudinary Upload Preset Setup Script
Creates all necessary upload presets for Pinpost
"""

import cloudinary
import cloudinary.api
import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure Cloudinary
try:
    cloudinary.config(
        cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME'),
        api_key=os.getenv('CLOUDINARY_API_KEY'),
        api_secret=os.getenv('CLOUDINARY_API_SECRET')
    )
    print("✓ Cloudinary configured successfully")
except Exception as e:
    print(f"✗ Cloudinary configuration failed: {e}")
    sys.exit(1)

# Define upload presets
UPLOAD_PRESETS = [
    {
        "name": "pinpost_profile",
        "unsigned": True,
        "folder": "pinpost/profiles",
        "use_filename": False,  # Use random IDs for privacy
        "unique_filename": True,
        "transformation": [
            {
                "width": 400,
                "height": 400,
                "crop": "fill",
                "gravity": "face",
                "quality": "auto",
                "fetch_format": "auto"
            }
        ],
        "allowed_formats": "jpg,png,webp",
        "tags": "pinpost,profile",
        "max_file_size": 5242880,  # 5MB
        "discard_original_filename": False
    },
    {
        "name": "pinpost_cover",
        "unsigned": True,
        "folder": "pinpost/covers",
        "use_filename": False,
        "unique_filename": True,
        "transformation": [
            {
                "width": 1200,
                "height": 400,
                "crop": "fill",
                "gravity": "auto",
                "quality": "auto",
                "fetch_format": "auto"
            }
        ],
        "allowed_formats": "jpg,png,webp",
        "tags": "pinpost,cover",
        "max_file_size": 8388608,  # 8MB
        "discard_original_filename": False
    },
    {
        "name": "pinpost_posts",
        "unsigned": True,
        "folder": "pinpost/posts",
        "use_filename": True,
        "unique_filename": True,
        "transformation": [
            {
                "width": 1200,
                "crop": "limit",
                "quality": "auto:good",
                "fetch_format": "auto"
            }
        ],
        "allowed_formats": "jpg,png,gif,webp",
        "tags": "pinpost,post",
        "max_file_size": 10485760,  # 10MB
        "discard_original_filename": False
    },
    {
        "name": "pinpost_blogs",
        "unsigned": True,
        "folder": "pinpost/blogs",
        "use_filename": True,
        "unique_filename": True,
        "transformation": [
            {
                "width": 1400,
                "crop": "limit",
                "quality": "auto:best",
                "fetch_format": "auto"
            }
        ],
        "allowed_formats": "jpg,png,webp",
        "tags": "pinpost,blog",
        "max_file_size": 10485760,  # 10MB
        "discard_original_filename": False
    },
    {
        "name": "pinpost_stories",
        "unsigned": True,
        "folder": "pinpost/stories",
        "use_filename": True,
        "unique_filename": True,
        "transformation": [
            {
                "width": 1080,
                "height": 1920,
                "crop": "fill",
                "gravity": "auto",
                "quality": "auto",
                "fetch_format": "auto"
            }
        ],
        "allowed_formats": "jpg,png,gif,webp,mp4",
        "tags": "pinpost,story",
        "max_file_size": 15728640,  # 15MB
        "discard_original_filename": False
    }
]

def create_or_update_preset(preset_config):
    """Create or update an upload preset"""
    preset_name = preset_config['name']
    
    try:
        # Try to create new preset
        result = cloudinary.api.create_upload_preset(**preset_config)
        print(f"✓ Created preset: {preset_name}")
        print(f"  Folder: {preset_config.get('folder', 'root')}")
        print(f"  Unsigned: {preset_config.get('unsigned', False)}")
        print(f"  Max size: {preset_config.get('max_file_size', 'unlimited')} bytes")
        return result
        
    except Exception as e:
        error_message = str(e)
        
        if "already" in error_message.lower() or "AlreadyExists" in str(type(e).__name__):
            # Preset exists, try to update it
            try:
                # Remove 'name' from config for update call
                update_config = {k: v for k, v in preset_config.items() if k != 'name'}
                result = cloudinary.api.update_upload_preset(preset_name, **update_config)
                print(f"✓ Updated existing preset: {preset_name}")
                print(f"  Folder: {preset_config.get('folder', 'root')}")
                print(f"  Unsigned: {preset_config.get('unsigned', False)}")
                print(f"  Max size: {preset_config.get('max_file_size', 'unlimited')} bytes")
                return result
                
            except Exception as update_error:
                print(f"✗ Error updating preset {preset_name}: {update_error}")
                return None
        else:
            print(f"✗ Error creating preset {preset_name}: {e}")
            return None

def list_existing_presets():
    """List all existing upload presets"""
    try:
        result = cloudinary.api.upload_presets()
        presets = result.get('presets', [])
        
        if presets:
            print("\n📋 Existing Upload Presets:")
            for preset in presets:
                print(f"  - {preset.get('name')}")
                print(f"    Unsigned: {preset.get('unsigned', False)}")
                print(f"    Settings: {preset.get('settings', {}).get('folder', 'root')}")
        else:
            print("\n📋 No existing upload presets found")
            
        return presets
        
    except Exception as e:
        print(f"✗ Error listing presets: {e}")
        return []

def verify_presets():
    """Verify that all required presets exist"""
    try:
        result = cloudinary.api.upload_presets()
        existing_names = [p.get('name') for p in result.get('presets', [])]
        
        required_names = [p['name'] for p in UPLOAD_PRESETS]
        missing = [name for name in required_names if name not in existing_names]
        
        if missing:
            print(f"\n⚠️  Missing presets: {', '.join(missing)}")
            return False
        else:
            print("\n✓ All required presets are configured!")
            return True
            
    except Exception as e:
        print(f"✗ Error verifying presets: {e}")
        return False

def main():
    """Main execution function"""
    print("=" * 60)
    print("CLOUDINARY UPLOAD PRESET SETUP")
    print("=" * 60)
    print()
    
    # List existing presets
    list_existing_presets()
    print()
    
    # Create or update presets
    print("🔧 Creating/Updating Upload Presets...")
    print()
    
    success_count = 0
    for preset in UPLOAD_PRESETS:
        result = create_or_update_preset(preset)
        if result:
            success_count += 1
        print()
    
    # Summary
    print("=" * 60)
    print(f"SUMMARY: {success_count}/{len(UPLOAD_PRESETS)} presets configured")
    print("=" * 60)
    print()
    
    # Verify all presets
    verify_presets()
    print()
    
    # Instructions
    print("📚 Next Steps:")
    print("1. Verify presets in Cloudinary Console:")
    print("   https://console.cloudinary.com/app/settings/upload/presets")
    print()
    print("2. Test upload with preset:")
    print("   python test_upload_preset.py")
    print()
    print("3. Deploy backend with new upload endpoints")
    print()

if __name__ == "__main__":
    main()
