from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.schemas import ChatMessage, ChatResponse, RatingRequest, ConversationListResponse
from services.conversation_service import ConversationService
from services.ollama_service import OllamaService
from typing import List

router = APIRouter()
ollama_service = OllamaService()

@router.post("/chat", response_model=ChatResponse)
async def chat(message: ChatMessage, db: Session = Depends(get_db)):
    """
    Endpoint chính để chat với AI
    """
    try:
        # Tạo service
        conv_service = ConversationService(db)
        
        # Lấy lịch sử cuộc hội thoại
        history = conv_service.get_conversation_history(message.session_id)
        
        # Tạo phản hồi từ Ollama
        bot_response = await ollama_service.generate_response(
            message.message, 
            history
        )
        
        # Lưu cuộc hội thoại
        conv_service.create_conversation(
            session_id=message.session_id,
            user_message=message.message,
            bot_response=bot_response
        )
        
        return ChatResponse(response=bot_response, session_id=message.session_id)
        
    except Exception as e:
        print(f"Error in chat endpoint: {e}")
        raise HTTPException(status_code=500, detail="Có lỗi xảy ra khi xử lý tin nhắn")

@router.get("/history/{session_id}")
async def get_history(session_id: str, db: Session = Depends(get_db)):
    """
    Lấy lịch sử cuộc hội thoại
    """
    conv_service = ConversationService(db)
    history = conv_service.get_conversation_history(session_id)
    return {"history": history}

@router.get("/sessions")
async def get_sessions(db: Session = Depends(get_db)):
    """
    Lấy danh sách tất cả sessions
    """
    conv_service = ConversationService(db)
    sessions = conv_service.get_all_sessions()
    return {"sessions": sessions}

@router.post("/rate")
async def rate_conversation(rating_request: RatingRequest, db: Session = Depends(get_db)):
    """
    Đánh giá cuộc hội thoại
    """
    conv_service = ConversationService(db)
    success = conv_service.rate_conversation(
        rating_request.conversation_id,
        rating_request.rating,
        rating_request.feedback
    )
    
    if success:
        return {"message": "Đánh giá đã được lưu thành công"}
    else:
        raise HTTPException(status_code=404, detail="Không tìm thấy cuộc hội thoại")

@router.get("/new-session")
async def new_session(db: Session = Depends(get_db)):
    """
    Tạo session mới
    """
    conv_service = ConversationService(db)
    session_id = conv_service.generate_session_id()
    return {"session_id": session_id}

@router.delete("/session/{session_id}")
async def delete_session(session_id: str, db: Session = Depends(get_db)):
    """
    Xóa session
    """
    conv_service = ConversationService(db)
    success = conv_service.delete_session(session_id)
    
    if success:
        return {"message": "Session đã được xóa thành công"}
    else:
        raise HTTPException(status_code=404, detail="Không tìm thấy session")

@router.get("/models")
async def get_available_models():
    """
    Lấy danh sách models có sẵn từ Ollama
    """
    models = await ollama_service.list_models()
    return {"models": models}

@router.get("/health")
async def health_check():
    """
    Kiểm tra trạng thái kết nối với Ollama
    """
    is_connected = await ollama_service.check_connection()
    return {
        "status": "healthy" if is_connected else "unhealthy",
        "ollama_connected": is_connected
    }