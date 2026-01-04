"""Messaging routes - conversations and messages."""
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, Body
import uuid
from datetime import datetime, timezone

from ..database import db
from ..models import Message, MessageCreate, Conversation, ParticipantDetail
from ..dependencies import get_current_user
from ..services import manager

router = APIRouter()


@router.get("/conversations", response_model=List[Conversation])
async def get_conversations(current_user_id: str = Depends(get_current_user)):
    """Get all conversations for current user."""
    conversations = await db.conversations.find(
        {"participants": current_user_id}
    ).sort("updated_at", -1).to_list(100)
    
    return [Conversation(**c) for c in conversations]


@router.get("/conversations/{conversation_id}/messages", response_model=List[Message])
async def get_conversation_messages(
    conversation_id: str,
    skip: int = 0,
    limit: int = 50,
    current_user_id: str = Depends(get_current_user)
):
    """Get messages for a conversation."""
    conversation = await db.conversations.find_one({"id": conversation_id})
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    if current_user_id not in conversation["participants"]:
        raise HTTPException(status_code=403, detail="Not a participant")
    
    messages = await db.messages.find(
        {"conversation_id": conversation_id}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    return [Message(**m) for m in messages]


@router.post("/conversations")
async def create_or_get_conversation(
    recipient_id: str = Body(..., embed=True),
    current_user_id: str = Depends(get_current_user)
):
    """Create a new conversation or get existing one."""
    if recipient_id == current_user_id:
        raise HTTPException(status_code=400, detail="Cannot message yourself")
    
    recipient = await db.users.find_one({"id": recipient_id})
    if not recipient:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check for existing conversation
    existing = await db.conversations.find_one({
        "participants": {"$all": [current_user_id, recipient_id], "$size": 2}
    })
    if existing:
        return Conversation(**existing)
    
    current_user = await db.users.find_one({"id": current_user_id})
    
    now = datetime.now(timezone.utc).isoformat()
    conversation = {
        "id": str(uuid.uuid4()),
        "participants": [current_user_id, recipient_id],
        "participant_details": [
            {"user_id": current_user_id, "username": current_user["username"], "avatar": current_user.get("avatar", "")},
            {"user_id": recipient_id, "username": recipient["username"], "avatar": recipient.get("avatar", "")}
        ],
        "last_message": None,
        "last_message_at": None,
        "unread_count": {current_user_id: 0, recipient_id: 0},
        "created_at": now,
        "updated_at": now
    }
    await db.conversations.insert_one(conversation)
    return Conversation(**conversation)


@router.post("/messages")
async def send_message(
    message_data: MessageCreate,
    current_user_id: str = Depends(get_current_user)
):
    """Send a message."""
    conversation = await db.conversations.find_one({"id": message_data.conversation_id})
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    if current_user_id not in conversation["participants"]:
        raise HTTPException(status_code=403, detail="Not a participant")
    
    sender = await db.users.find_one({"id": current_user_id})
    now = datetime.now(timezone.utc).isoformat()
    
    message = {
        "id": str(uuid.uuid4()),
        "conversation_id": message_data.conversation_id,
        "sender_id": current_user_id,
        "sender_username": sender["username"],
        "sender_avatar": sender.get("avatar", ""),
        "content": message_data.content,
        "type": message_data.type or "text",
        "image_url": message_data.image_url,
        "voice_url": message_data.voice_url,
        "read_by": [current_user_id],
        "delivered_to": [current_user_id],
        "created_at": now
    }
    await db.messages.insert_one(message)
    
    # Update conversation
    recipient_id = [p for p in conversation["participants"] if p != current_user_id][0]
    await db.conversations.update_one(
        {"id": message_data.conversation_id},
        {
            "$set": {
                "last_message": message_data.content[:50],
                "last_message_at": now,
                "updated_at": now
            },
            "$inc": {f"unread_count.{recipient_id}": 1}
        }
    )
    
    # Send real-time via WebSocket
    await manager.send_notification(recipient_id, {
        "type": "new_message",
        "message": Message(**message).dict()
    })
    
    return Message(**message)


@router.put("/messages/{message_id}/read")
async def mark_message_read(message_id: str, current_user_id: str = Depends(get_current_user)):
    """Mark a message as read."""
    message = await db.messages.find_one({"id": message_id})
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    if current_user_id not in message.get("read_by", []):
        await db.messages.update_one(
            {"id": message_id},
            {"$addToSet": {"read_by": current_user_id}}
        )
    return {"message": "Marked as read"}


@router.put("/conversations/{conversation_id}/read")
async def mark_conversation_read(conversation_id: str, current_user_id: str = Depends(get_current_user)):
    """Mark all messages in conversation as read."""
    conversation = await db.conversations.find_one({"id": conversation_id})
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    await db.messages.update_many(
        {"conversation_id": conversation_id},
        {"$addToSet": {"read_by": current_user_id}}
    )
    await db.conversations.update_one(
        {"id": conversation_id},
        {"$set": {f"unread_count.{current_user_id}": 0}}
    )
    return {"message": "All messages marked as read"}


@router.post("/conversations/{conversation_id}/typing")
async def set_typing_status(
    conversation_id: str,
    typing: bool = Body(..., embed=True),
    current_user_id: str = Depends(get_current_user)
):
    """Set typing status."""
    await manager.set_typing(current_user_id, conversation_id, typing)
    return {"message": "Typing status updated"}


@router.get("/conversations/unread-count")
@router.get("/messages/unread-count")
async def get_unread_message_count(current_user_id: str = Depends(get_current_user)):
    """Get total unread message count."""
    conversations = await db.conversations.find({"participants": current_user_id}).to_list(100)
    total = sum(c.get("unread_count", {}).get(current_user_id, 0) for c in conversations)
    return {"unread_count": total}


@router.get("/messages/eligibility/{user_id}")
async def check_messaging_eligibility(user_id: str, current_user_id: str = Depends(get_current_user)):
    """Check if users can message each other (mutual follow)."""
    if user_id == current_user_id:
        return {"can_message": True}
    
    # Check mutual follow
    follows_them = await db.follows.find_one({
        "follower_id": current_user_id,
        "following_id": user_id
    })
    they_follow = await db.follows.find_one({
        "follower_id": user_id,
        "following_id": current_user_id
    })
    
    return {"can_message": bool(follows_them and they_follow)}
