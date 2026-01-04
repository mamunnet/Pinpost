"""Message and Conversation models."""
from typing import Optional, List, Dict
from pydantic import BaseModel


class MessageCreate(BaseModel):
    """Schema for creating a message."""
    content: str = ""
    conversation_id: Optional[str] = None
    recipient_id: Optional[str] = None
    type: Optional[str] = "text"
    image_url: Optional[str] = None
    voice_url: Optional[str] = None


class Message(BaseModel):
    """Message response model."""
    id: str
    conversation_id: str
    sender_id: str
    sender_username: str
    sender_avatar: str
    content: str
    type: Optional[str] = "text"
    image_url: Optional[str] = None
    voice_url: Optional[str] = None
    read_by: List[str] = []
    delivered_to: List[str] = []
    created_at: str


class ParticipantDetail(BaseModel):
    """Participant detail in a conversation."""
    user_id: str
    username: str
    avatar: str


class Conversation(BaseModel):
    """Conversation response model."""
    id: str
    participants: List[str]
    participant_details: List[ParticipantDetail]
    last_message: Optional[str] = None
    last_message_at: Optional[str] = None
    unread_count: Dict[str, int] = {}
    created_at: str
    updated_at: str
