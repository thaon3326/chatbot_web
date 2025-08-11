from sqlalchemy.orm import Session
from database import Conversation
from typing import List, Dict
import uuid

class ConversationService:
    def __init__(self, db: Session):
        self.db = db
    
    def create_conversation(self, session_id: str, user_message: str, bot_response: str) -> Conversation:
        """
        Tạo một cuộc hội thoại mới
        """
        conversation = Conversation(
            session_id=session_id,
            user_message=user_message,
            bot_response=bot_response
        )
        self.db.add(conversation)
        self.db.commit()
        self.db.refresh(conversation)
        return conversation
    
    def get_conversation_history(self, session_id: str) -> List[Dict]:
        """
        Lấy lịch sử cuộc hội thoại theo session_id
        """
        conversations = self.db.query(Conversation).filter(
            Conversation.session_id == session_id
        ).order_by(Conversation.timestamp).all()
        
        return [
            {
                "id": conv.id,
                "user_message": conv.user_message,
                "bot_response": conv.bot_response,
                "timestamp": conv.timestamp,
                "rating": conv.rating,
                "feedback": conv.feedback
            }
            for conv in conversations
        ]
    
    def get_all_sessions(self) -> List[str]:
        """
        Lấy danh sách tất cả session_id
        """
        sessions = self.db.query(Conversation.session_id).distinct().all()
        return [session[0] for session in sessions]
    
    def rate_conversation(self, conversation_id: int, rating: float, feedback: str = None) -> bool:
        """
        Đánh giá một cuộc hội thoại
        """
        conversation = self.db.query(Conversation).filter(
            Conversation.id == conversation_id
        ).first()
        
        if conversation:
            conversation.rating = rating
            conversation.feedback = feedback
            self.db.commit()
            return True
        return False
    
    def get_conversation_by_id(self, conversation_id: int) -> Conversation:
        """
        Lấy cuộc hội thoại theo ID
        """
        return self.db.query(Conversation).filter(
            Conversation.id == conversation_id
        ).first()
    
    def generate_session_id(self) -> str:
        """
        Tạo session_id mới
        """
        return str(uuid.uuid4())
    
    def delete_session(self, session_id: str) -> bool:
        """
        Xóa toàn bộ cuộc hội thoại của một session
        """
        try:
            self.db.query(Conversation).filter(
                Conversation.session_id == session_id
            ).delete()
            self.db.commit()
            return True
        except:
            return False