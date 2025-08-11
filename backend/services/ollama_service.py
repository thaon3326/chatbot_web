import httpx
import json
from typing import List, Dict

class OllamaService:
    def __init__(self, base_url: str = "http://localhost:11434"):
        self.base_url = base_url
        self.model = "llama3.2:1b"  # Model mặc định, có thể thay đổi
    
    async def generate_response(self, message: str, conversation_history: List[Dict] = None) -> str:
        """
        Tạo phản hồi từ Ollama model với context từ lịch sử cuộc hội thoại
        """
        try:
            # Tạo context từ lịch sử cuộc hội thoại
            context = self._build_context(conversation_history)
            
            # Tạo prompt với context
            prompt = self._build_prompt(context, message)
            
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    f"{self.base_url}/api/generate",
                    json={
                        "model": self.model,
                        "prompt": prompt,
                        "stream": False,
                        "options": {
                            "temperature": 0.7,
                            "top_p": 0.9,
                            "num_predict": 1000
                        }
                    }
                )
                
                if response.status_code == 200:
                    result = response.json()
                    return result.get("response", "Xin lỗi, tôi không thể tạo phản hồi lúc này.")
                else:
                    return "Xin lỗi, có lỗi xảy ra khi kết nối với AI model."
                    
        except Exception as e:
            print(f"Error calling Ollama: {e}")
            return "Xin lỗi, có lỗi xảy ra khi xử lý yêu cầu của bạn."
    
    def _build_context(self, conversation_history: List[Dict]) -> str:
        """
        Xây dựng context từ lịch sử cuộc hội thoại
        """
        if not conversation_history:
            return ""
        
        context_parts = []
        # Chỉ lấy 5 cuộc hội thoại gần nhất để tránh context quá dài
        recent_history = conversation_history[-5:] if len(conversation_history) > 5 else conversation_history
        
        for conv in recent_history:
            context_parts.append(f"Người dùng: {conv['user_message']}")
            context_parts.append(f"AI: {conv['bot_response']}")
        
        return "\n".join(context_parts)
    
    def _build_prompt(self, context: str, current_message: str) -> str:
        """
        Xây dựng prompt hoàn chỉnh cho model
        """
        system_prompt = """Bạn là một trợ lý AI thông minh và hữu ích, chuyên trả lời bằng tiếng Việt. 
Hãy trả lời một cách tự nhiên, thân thiện và chính xác. 
Nếu bạn không biết câu trả lời, hãy thành thật nói rằng bạn không biết.
Hãy duy trì ngữ cảnh của cuộc hội thoại và tham khảo các tin nhắn trước đó khi cần thiết."""

        if context:
            prompt = f"""{system_prompt}

Lịch sử cuộc hội thoại:
{context}

Tin nhắn hiện tại:
Người dùng: {current_message}
AI:"""
        else:
            prompt = f"""{system_prompt}

Người dùng: {current_message}
AI:"""
        
        return prompt
    
    async def check_connection(self) -> bool:
        """
        Kiểm tra kết nối với Ollama server
        """
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(f"{self.base_url}/api/tags")
                return response.status_code == 200
        except:
            return False
    
    async def list_models(self) -> List[str]:
        """
        Lấy danh sách các models có sẵn
        """
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(f"{self.base_url}/api/tags")
                if response.status_code == 200:
                    data = response.json()
                    return [model["name"] for model in data.get("models", [])]
                return []
        except:
            return []