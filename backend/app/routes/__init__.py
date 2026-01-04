# Routes package
from fastapi import APIRouter

# Create main API router
api_router = APIRouter(prefix="/api")

# Import all route modules
from . import auth, users, posts, blogs, comments, likes
from . import notifications, messages, stories, feed, admin, upload, health

# Include all routers
api_router.include_router(auth.router, tags=["Authentication"])
api_router.include_router(users.router, tags=["Users"])
api_router.include_router(posts.router, tags=["Posts"])
api_router.include_router(blogs.router, tags=["Blogs"])
api_router.include_router(comments.router, tags=["Comments"])
api_router.include_router(likes.router, tags=["Likes"])
api_router.include_router(notifications.router, tags=["Notifications"])
api_router.include_router(messages.router, tags=["Messages"])
api_router.include_router(stories.router, tags=["Stories"])
api_router.include_router(feed.router, tags=["Feed"])
api_router.include_router(admin.router, tags=["Admin"])
api_router.include_router(upload.router, tags=["Upload"])
api_router.include_router(health.router, tags=["Health"])
