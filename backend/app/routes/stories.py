"""Stories routes - CRUD for stories."""
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Depends
import uuid
from datetime import datetime, timezone, timedelta

from ..database import db
from ..models import Story, StoryCreate
from ..dependencies import get_current_user, get_optional_user

router = APIRouter()


@router.post("/stories", response_model=Story)
async def create_story(story_data: StoryCreate, user_id: str = Depends(get_current_user)):
    """Create a new story."""
    user = await db.users.find_one({"id": user_id})
    
    now = datetime.now(timezone.utc)
    story = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "username": user["username"],
        "user_avatar": user.get("avatar", ""),
        "content": story_data.content,
        "media_url": story_data.media_url or "",
        "views_count": 0,
        "created_at": now.isoformat(),
        "expires_at": (now + timedelta(hours=24)).isoformat()
    }
    await db.stories.insert_one(story)
    return Story(**story)


@router.get("/stories")
async def get_stories(current_user_id: Optional[str] = Depends(get_optional_user)):
    """Get all active stories grouped by user."""
    now = datetime.now(timezone.utc).isoformat()
    
    # Get non-expired stories
    stories = await db.stories.find({"expires_at": {"$gt": now}}).sort("created_at", -1).to_list(100)
    
    # Group by user
    user_stories = {}
    for story in stories:
        uid = story["user_id"]
        if uid not in user_stories:
            user_stories[uid] = {
                "user_id": uid,
                "username": story["username"],
                "user_avatar": story["user_avatar"],
                "stories": []
            }
        user_stories[uid]["stories"].append(Story(**story).dict())
    
    return list(user_stories.values())


@router.get("/stories/user/{user_id}", response_model=List[Story])
async def get_user_stories(user_id: str):
    """Get all active stories for a user."""
    now = datetime.now(timezone.utc).isoformat()
    stories = await db.stories.find({
        "user_id": user_id,
        "expires_at": {"$gt": now}
    }).sort("created_at", -1).to_list(100)
    
    return [Story(**s) for s in stories]


@router.post("/stories/{story_id}/view")
async def view_story(story_id: str, current_user_id: str = Depends(get_current_user)):
    """Mark a story as viewed."""
    story = await db.stories.find_one({"id": story_id})
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")
    
    # Check if already viewed
    existing = await db.story_views.find_one({
        "story_id": story_id,
        "user_id": current_user_id
    })
    if not existing:
        await db.story_views.insert_one({
            "id": str(uuid.uuid4()),
            "story_id": story_id,
            "user_id": current_user_id,
            "viewed_at": datetime.now(timezone.utc).isoformat()
        })
        await db.stories.update_one({"id": story_id}, {"$inc": {"views_count": 1}})
    
    return {"message": "Story viewed"}


@router.delete("/stories/{story_id}")
async def delete_story(story_id: str, user_id: str = Depends(get_current_user)):
    """Delete a story."""
    story = await db.stories.find_one({"id": story_id})
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")
    if story["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.stories.delete_one({"id": story_id})
    await db.story_views.delete_many({"story_id": story_id})
    return {"message": "Story deleted"}
