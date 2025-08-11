from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# User schemas
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: Optional[str] = None

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: Optional[str] = None
    created_at: datetime
    is_active: bool

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

# Chat schemas
class ChatMessage(BaseModel):
    message: str
    session_id: str

class ChatResponse(BaseModel):
    response: str
    session_id: str
    conversation_id: Optional[int] = None

class ConversationHistory(BaseModel):
    id: int
    session_id: str
    user_message: str
    bot_response: str
    timestamp: datetime
    rating: Optional[float] = None
    feedback: Optional[str] = None

class RatingRequest(BaseModel):
    conversation_id: int
    rating: float  # 1-5
    feedback: Optional[str] = None

class ConversationListResponse(BaseModel):
    conversations: List[ConversationHistory]