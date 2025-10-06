"""
Test Cloudinary Upload Presets
Uploads test images using each preset and verifies configuration
"""

import cloudinary
import cloudinary.uploader
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
    print(f"  Cloud: {os.getenv('CLOUDINARY_CLOUD_NAME')}")
    print()
except Exception as e:
    print(f"✗ Cloudinary configuration failed: {e}")
    sys.exit(1)

# Test image URLs (placeholder images)
TEST_IMAGES = {
    "profile": "https://via.placeholder.com/800x800/4A90E2/ffffff?text=Profile+Test",
    "cover": "https://via.placeholder.com/1600x600/7B68EE/ffffff?text=Cover+Test",
    "post": "https://via.placeholder.com/1920x1080/50C878/ffffff?text=Post+Test",
    "blog": "https://via.placeholder.com/2000x1200/FF6B6B/ffffff?text=Blog+Test",
    "story": "https://via.placeholder.com/1080x1920/FFD93D/000000?text=Story+Test"
}

# Preset configurations to test
PRESETS_TO_TEST = [
    {
        "name": "pinpost_profile",
        "test_image": TEST_IMAGES["profile"],
        "expected_folder": "pinpost/profiles",
        "expected_width": 400,
        "expected_height": 400
    },
    {
        "name": "pinpost_cover",
        "test_image": TEST_IMAGES["cover"],
        "expected_folder": "pinpost/covers",
        "expected_width": 1200,
        "expected_height": 400
    },
    {
        "name": "pinpost_posts",
        "test_image": TEST_IMAGES["post"],
        "expected_folder": "pinpost/posts",
        "expected_max_width": 1200
    },
    {
        "name": "pinpost_blogs",
        "test_image": TEST_IMAGES["blog"],
        "expected_folder": "pinpost/blogs",
        "expected_max_width": 1400
    },
    {
        "name": "pinpost_stories",
        "test_image": TEST_IMAGES["story"],
        "expected_folder": "pinpost/stories",
        "expected_width": 1080,
        "expected_height": 1920
    }
]

def test_upload_preset(preset_config):
    """Test uploading with a specific preset"""
    preset_name = preset_config["name"]
    test_image = preset_config["test_image"]
    
    print(f"🧪 Testing preset: {preset_name}")
    print(f"   Image: {test_image}")
    
    try:
        # Upload using the preset
        result = cloudinary.uploader.upload(
            test_image,
            upload_preset=preset_name,
            resource_type="image"
        )
        
        # Extract result information
        url = result.get("secure_url")
        public_id = result.get("public_id")
        format_type = result.get("format")
        width = result.get("width")
        height = result.get("height")
        bytes_size = result.get("bytes")
        folder = result.get("folder", "")
        
        # Display results
        print(f"   ✓ Upload successful!")
        print(f"   URL: {url}")
        print(f"   Public ID: {public_id}")
        print(f"   Folder: {folder}")
        print(f"   Format: {format_type}")
        print(f"   Dimensions: {width}x{height}")
        print(f"   Size: {bytes_size:,} bytes ({bytes_size/1024:.1f} KB)")
        
        # Verify expectations
        errors = []
        
        # Check folder
        expected_folder = preset_config.get("expected_folder")
        if expected_folder and folder != expected_folder:
            errors.append(f"Folder mismatch: expected '{expected_folder}', got '{folder}'")
        
        # Check exact dimensions (for profile, cover, stories)
        expected_width = preset_config.get("expected_width")
        expected_height = preset_config.get("expected_height")
        if expected_width and width != expected_width:
            errors.append(f"Width mismatch: expected {expected_width}, got {width}")
        if expected_height and height != expected_height:
            errors.append(f"Height mismatch: expected {expected_height}, got {height}")
        
        # Check max width (for posts, blogs)
        expected_max_width = preset_config.get("expected_max_width")
        if expected_max_width and width > expected_max_width:
            errors.append(f"Width exceeds maximum: expected <={expected_max_width}, got {width}")
        
        # Report verification results
        if errors:
            print(f"   ⚠️  Verification warnings:")
            for error in errors:
                print(f"      - {error}")
        else:
            print(f"   ✓ All verifications passed!")
        
        print()
        return True, result
        
    except Exception as e:
        print(f"   ✗ Upload failed: {e}")
        print()
        return False, None

def cleanup_test_uploads(public_ids):
    """Delete test uploads to keep account clean"""
    print("🧹 Cleaning up test uploads...")
    
    deleted_count = 0
    for public_id in public_ids:
        try:
            cloudinary.uploader.destroy(public_id)
            print(f"   ✓ Deleted: {public_id}")
            deleted_count += 1
        except Exception as e:
            print(f"   ✗ Failed to delete {public_id}: {e}")
    
    print(f"   Cleaned up {deleted_count}/{len(public_ids)} test images")
    print()

def main():
    """Main test execution"""
    print("=" * 70)
    print("CLOUDINARY UPLOAD PRESET TESTING")
    print("=" * 70)
    print()
    
    results = []
    uploaded_public_ids = []
    
    # Test each preset
    for preset in PRESETS_TO_TEST:
        success, result = test_upload_preset(preset)
        results.append(success)
        
        if result:
            uploaded_public_ids.append(result.get("public_id"))
    
    # Summary
    print("=" * 70)
    print(f"SUMMARY: {sum(results)}/{len(PRESETS_TO_TEST)} presets passed")
    print("=" * 70)
    print()
    
    # Optional cleanup
    if uploaded_public_ids:
        response = input("Delete test uploads? (y/n): ").strip().lower()
        if response == 'y':
            cleanup_test_uploads(uploaded_public_ids)
        else:
            print("Test uploads kept in Cloudinary")
            print("View them at: https://console.cloudinary.com/console/media_library")
            print()
    
    # Final recommendations
    print("📚 Next Steps:")
    print()
    print("1. ✓ Verify uploads in Cloudinary Console:")
    print("   https://console.cloudinary.com/console/media_library/folders/pinpost")
    print()
    print("2. ✓ Check folder organization:")
    print("   - pinpost/profiles/")
    print("   - pinpost/covers/")
    print("   - pinpost/posts/")
    print("   - pinpost/blogs/")
    print("   - pinpost/stories/")
    print()
    print("3. ✓ Update backend to use presets in upload endpoints")
    print()
    print("4. ✓ Test actual uploads from your application")
    print()
    
    if all(results):
        print("✓ All presets working correctly! Ready for production.")
    else:
        print("⚠️  Some presets failed. Check configuration and try again.")
    
    print()

if __name__ == "__main__":
    main()
