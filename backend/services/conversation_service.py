from sqlalchemy.orm import Session
from database import Conversation
from typing import List, Dict
import uuid

class ConversationService:
    def __init__(self, db: Session):
        self.db = db
    
    def create_conversation(self, session_id: str, user_id: int, user_message: str, bot_response: str) -> Conversation:
        """
        Tạo một cuộc hội thoại mới
        """
        conversation = Conversation(
            session_id=session_id,
            user_id=user_id,
            user_message=user_message,
            bot_response=bot_response
        )
        self.db.add(conversation)
        self.db.commit()
        self.db.refresh(conversation)
        return conversation
    
    def get_conversation_history(self, session_id: str, user_id: int = None) -> List[Dict]:
        """
        Lấy lịch sử cuộc hội thoại theo session_id và user_id
        """
        query = self.db.query(Conversation).filter(
            Conversation.session_id == session_id
        )
        
        if user_id:
            query = query.filter(Conversation.user_id == user_id)
            
        conversations = query.order_by(Conversation.timestamp).all()
        
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
    
    def get_all_sessions(self, user_id: int = None) -> List[Dict]:
        """
        Lấy danh sách tất cả session_id của user
        """
        query = self.db.query(Conversation.session_id, Conversation.user_message, Conversation.timestamp).distinct(Conversation.session_id)
        
        if user_id:
            query = query.filter(Conversation.user_id == user_id)
            
        sessions = query.order_by(Conversation.timestamp.desc()).all()
        
        return [
            {
                "session_id": session[0],
                "first_message": session[1][:50] + "..." if len(session[1]) > 50 else session[1],
                "timestamp": session[2]
            }
            for session in sessions
        ]
    
    def rate_conversation(self, conversation_id: int, rating: float, feedback: str = None, user_id: int = None) -> bool:
        """
        Đánh giá một cuộc hội thoại
        """
        query = self.db.query(Conversation).filter(
            Conversation.id == conversation_id
        )
        
        if user_id:
            query = query.filter(Conversation.user_id == user_id)
            
        conversation = query.first()
        
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
    
    def delete_session(self, session_id: str, user_id: int = None) -> bool:
        """
        Xóa toàn bộ cuộc hội thoại của một session
        """
        try:
            query = self.db.query(Conversation).filter(
                Conversation.session_id == session_id
            )
            
            if user_id:
                query = query.filter(Conversation.user_id == user_id)
                
            query.delete()
            self.db.commit()
            return True
        except:
            return False