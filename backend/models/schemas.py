from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ChatMessage(BaseModel):
    message: str
    session_id: str

class ChatResponse(BaseModel):
    response: str
    session_id: str

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