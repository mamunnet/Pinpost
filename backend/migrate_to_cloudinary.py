"""
Migration Script: Local Images to Cloudinary
Migrates all existing local images to Cloudinary and updates database URLs
"""

import os
import asyncio
import logging
from pathlib import Path
from motor.motor_asyncio import AsyncIOMotorClient
from cloudinary_utils import CloudinaryUploader
from dotenv import load_dotenv
from datetime import datetime

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# MongoDB connection
mongo_url = os.getenv('MONGO_URL')
db_name = os.getenv('DB_NAME')
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]


class ImageMigration:
    """Handles migration of images from local storage to Cloudinary"""
    
    def __init__(self):
        self.stats = {
            'total_users': 0,
            'total_posts': 0,
            'total_blogs': 0,
            'migrated_avatars': 0,
            'migrated_covers': 0,
            'migrated_post_images': 0,
            'migrated_blog_images': 0,
            'failed_uploads': 0,
            'skipped_already_migrated': 0
        }
    
    async def migrate_user_images(self):
        """Migrate user profile pictures and cover photos"""
        logger.info("📸 Starting user images migration...")
        
        users = await db.users.find({}).to_list(None)
        self.stats['total_users'] = len(users)
        
        for user in users:
            user_id = user['id']
            username = user.get('username', 'unknown')
            
            # Migrate avatar
            if user.get('avatar'):
                avatar_url = user['avatar']
                
                # Skip if already Cloudinary URL
                if 'cloudinary.com' in avatar_url:
                    self.stats['skipped_already_migrated'] += 1
                    logger.info(f"⏭️  Skipped {username} avatar (already on Cloudinary)")
                else:
                    # Upload to Cloudinary
                    new_url = await self._upload_local_file(
                        avatar_url, 
                        media_type='profile',
                        user_id=user_id
                    )
                    
                    if new_url:
                        # Update database
                        await db.users.update_one(
                            {'id': user_id},
                            {'$set': {'avatar': new_url}}
                        )
                        self.stats['migrated_avatars'] += 1
                        logger.info(f"✅ Migrated avatar for {username}")
            
            # Migrate cover photo
            if user.get('cover_photo'):
                cover_url = user['cover_photo']
                
                if 'cloudinary.com' in cover_url:
                    self.stats['skipped_already_migrated'] += 1
                else:
                    new_url = await self._upload_local_file(
                        cover_url,
                        media_type='cover',
                        user_id=user_id
                    )
                    
                    if new_url:
                        await db.users.update_one(
                            {'id': user_id},
                            {'$set': {'cover_photo': new_url}}
                        )
                        self.stats['migrated_covers'] += 1
                        logger.info(f"✅ Migrated cover photo for {username}")
        
        logger.info(f"👥 User images migration complete: {self.stats['migrated_avatars']} avatars, {self.stats['migrated_covers']} covers")
    
    async def migrate_post_images(self):
        """Migrate post images"""
        logger.info("📝 Starting post images migration...")
        
        posts = await db.posts.find({}).to_list(None)
        self.stats['total_posts'] = len(posts)
        
        for post in posts:
            post_id = post['id']
            images = post.get('images', [])
            
            if not images:
                continue
            
            new_images = []
            migrated_count = 0
            
            for img_url in images:
                if 'cloudinary.com' in img_url:
                    new_images.append(img_url)
                    self.stats['skipped_already_migrated'] += 1
                else:
                    new_url = await self._upload_local_file(
                        img_url,
                        media_type='post',
                        user_id=post.get('author_id')
                    )
                    
                    if new_url:
                        new_images.append(new_url)
                        migrated_count += 1
                        self.stats['migrated_post_images'] += 1
                    else:
                        # Keep original URL if migration fails
                        new_images.append(img_url)
            
            # Update post with new image URLs
            if migrated_count > 0:
                await db.posts.update_one(
                    {'id': post_id},
                    {'$set': {'images': new_images}}
                )
                logger.info(f"✅ Migrated {migrated_count} images for post {post_id[:8]}...")
        
        logger.info(f"📝 Post images migration complete: {self.stats['migrated_post_images']} images")
    
    async def migrate_blog_images(self):
        """Migrate blog cover images"""
        logger.info("📰 Starting blog images migration...")
        
        blogs = await db.blog_posts.find({}).to_list(None)
        self.stats['total_blogs'] = len(blogs)
        
        for blog in blogs:
            blog_id = blog['id']
            cover_image = blog.get('cover_image')
            
            if not cover_image:
                continue
            
            if 'cloudinary.com' in cover_image:
                self.stats['skipped_already_migrated'] += 1
                continue
            
            new_url = await self._upload_local_file(
                cover_image,
                media_type='blog',
                user_id=blog.get('author_id')
            )
            
            if new_url:
                await db.blog_posts.update_one(
                    {'id': blog_id},
                    {'$set': {'cover_image': new_url}}
                )
                self.stats['migrated_blog_images'] += 1
                logger.info(f"✅ Migrated cover image for blog: {blog.get('title', 'Untitled')[:30]}...")
        
        logger.info(f"📰 Blog images migration complete: {self.stats['migrated_blog_images']} images")
    
    async def _upload_local_file(self, file_url: str, media_type: str, user_id: str = None) -> str:
        """
        Upload a local file to Cloudinary
        Returns new Cloudinary URL or None if failed
        """
        try:
            # Extract filename from URL
            if file_url.startswith('/uploads/'):
                filename = file_url.replace('/uploads/', '')
            elif 'uploads/' in file_url:
                filename = file_url.split('uploads/')[-1]
            else:
                logger.warning(f"⚠️  Invalid URL format: {file_url}")
                return None
            
            # Check if local file exists
            local_path = Path('uploads') / filename
            if not local_path.exists():
                logger.warning(f"⚠️  Local file not found: {local_path}")
                self.stats['failed_uploads'] += 1
                return None
            
            # Read file content
            with open(local_path, 'rb') as f:
                file_content = f.read()
            
            # Upload to Cloudinary
            result = await CloudinaryUploader.upload_image(
                file_content=file_content,
                filename=filename,
                media_type=media_type,
                user_id=user_id
            )
            
            return result['url']
            
        except Exception as e:
            logger.error(f"❌ Failed to upload {file_url}: {str(e)}")
            self.stats['failed_uploads'] += 1
            return None
    
    async def migrate_all(self):
        """Run complete migration"""
        logger.info("="*60)
        logger.info("🚀 Starting Cloudinary Migration")
        logger.info("="*60)
        
        # Check if Cloudinary is configured
        if not CloudinaryUploader.is_configured():
            logger.error("❌ Cloudinary is not configured! Please set environment variables:")
            logger.error("   - CLOUDINARY_CLOUD_NAME")
            logger.error("   - CLOUDINARY_API_KEY")
            logger.error("   - CLOUDINARY_API_SECRET")
            return
        
        start_time = datetime.now()
        
        # Run migrations
        await self.migrate_user_images()
        await self.migrate_post_images()
        await self.migrate_blog_images()
        
        # Calculate duration
        duration = (datetime.now() - start_time).total_seconds()
        
        # Print summary
        logger.info("="*60)
        logger.info("📊 Migration Summary")
        logger.info("="*60)
        logger.info(f"Total users processed: {self.stats['total_users']}")
        logger.info(f"Total posts processed: {self.stats['total_posts']}")
        logger.info(f"Total blogs processed: {self.stats['total_blogs']}")
        logger.info("-"*60)
        logger.info(f"✅ Migrated avatars: {self.stats['migrated_avatars']}")
        logger.info(f"✅ Migrated covers: {self.stats['migrated_covers']}")
        logger.info(f"✅ Migrated post images: {self.stats['migrated_post_images']}")
        logger.info(f"✅ Migrated blog images: {self.stats['migrated_blog_images']}")
        logger.info("-"*60)
        logger.info(f"⏭️  Skipped (already migrated): {self.stats['skipped_already_migrated']}")
        logger.info(f"❌ Failed uploads: {self.stats['failed_uploads']}")
        logger.info("-"*60)
        logger.info(f"⏱️  Total time: {duration:.2f} seconds")
        logger.info("="*60)
        
        total_migrated = (
            self.stats['migrated_avatars'] + 
            self.stats['migrated_covers'] + 
            self.stats['migrated_post_images'] + 
            self.stats['migrated_blog_images']
        )
        
        if total_migrated > 0:
            logger.info("🎉 Migration completed successfully!")
            logger.info("💡 Next steps:")
            logger.info("   1. Set USE_CLOUDINARY=true in your .env file")
            logger.info("   2. Restart your backend server")
            logger.info("   3. All new uploads will use Cloudinary")
        else:
            logger.info("ℹ️  No images needed migration")


async def main():
    """Main migration function"""
    migration = ImageMigration()
    await migration.migrate_all()
    
    # Close MongoDB connection
    client.close()
    logger.info("👋 Migration script finished")


if __name__ == "__main__":
    asyncio.run(main())
