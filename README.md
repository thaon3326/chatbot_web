# Chatbot AI Tiếng Việt

Ứng dụng chatbot AI đơn giản sử dụng FastAPI và Ollama models, được thiết kế đặc biệt cho tiếng Việt.

## Tính năng

- 🤖 Chat với AI models từ Ollama
- 💬 Lưu lịch sử cuộc hội thoại
- 🧠 Nhớ context trong cùng một phiên chat
- ⭐ Đánh giá và phản hồi để cải thiện model
- 🇻🇳 Giao diện và AI được tối ưu cho tiếng Việt
- 📱 Responsive design, hoạt động tốt trên mobile

## Yêu cầu hệ thống

- Python 3.8+
- Ollama (đã cài đặt và chạy)
- Một AI model đã được pull về Ollama (ví dụ: llama3.2:3b)

## Cài đặt

### 1. Cài đặt Ollama

```bash
# Trên Linux/macOS
curl -fsSL https://ollama.ai/install.sh | sh

# Hoặc tải từ https://ollama.ai/download
```

### 2. Pull một AI model

```bash
# Ví dụ với Llama 3.2 3B (khuyến nghị cho tiếng Việt)
ollama pull llama3.2:3b

# Hoặc các models khác
ollama pull llama3.2:1b
ollama pull qwen2.5:3b
```

### 3. Chạy ứng dụng

```bash
# Clone repository
git clone <repository-url>
cd chatbot_web

# Cài đặt dependencies
cd backend
pip install -r requirements.txt

# Chạy server
python main.py
```

### 4. Truy cập ứng dụng

Mở trình duyệt và truy cập: `http://localhost:12000`

## Cấu trúc dự án

```
chatbot_web/
├── backend/
│   ├── main.py              # Entry point
│   ├── database.py          # Database setup
│   ├── requirements.txt     # Python dependencies
│   ├── models/
│   │   └── schemas.py       # Pydantic models
│   ├── routers/
│   │   └── chat.py          # API routes
│   └── services/
│       ├── ollama_service.py      # Ollama integration
│       └── conversation_service.py # Database operations
├── frontend/
│   ├── index.html           # Main UI
│   ├── style.css            # Styling
│   └── script.js            # Frontend logic
└── README.md
```

## API Endpoints

- `POST /api/chat` - Gửi tin nhắn và nhận phản hồi
- `GET /api/history/{session_id}` - Lấy lịch sử cuộc hội thoại
- `GET /api/sessions` - Lấy danh sách tất cả sessions
- `POST /api/rate` - Đánh giá cuộc hội thoại
- `GET /api/new-session` - Tạo session mới
- `DELETE /api/session/{session_id}` - Xóa session
- `GET /api/models` - Lấy danh sách models có sẵn
- `GET /api/health` - Kiểm tra trạng thái server

## Cấu hình

### Thay đổi AI model

Chỉnh sửa file `backend/services/ollama_service.py`:

```python
self.model = "llama3.2:3b"  # Thay đổi tên model ở đây
```

### Cấu hình Ollama URL

Nếu Ollama chạy trên port khác hoặc server khác:

```python
ollama_service = OllamaService(base_url="http://localhost:11434")
```

## Sử dụng

1. **Bắt đầu cuộc hội thoại**: Nhập tin nhắn và nhấn Enter hoặc click nút gửi
2. **Xem lịch sử**: Click nút "Lịch sử" để xem các cuộc hội thoại trước
3. **Tạo cuộc hội thoại mới**: Click "Cuộc hội thoại mới"
4. **Đánh giá**: Click nút "Đánh giá" dưới câu trả lời của AI để đánh giá chất lượng

## Troubleshooting

### Ollama không kết nối được

1. Kiểm tra Ollama đã chạy: `ollama serve`
2. Kiểm tra port: Ollama mặc định chạy trên port 11434
3. Kiểm tra firewall và network settings

### Model không phản hồi

1. Kiểm tra model đã được pull: `ollama list`
2. Test model trực tiếp: `ollama run llama3.2:3b`
3. Kiểm tra logs trong console

### Database issues

Database SQLite sẽ được tạo tự động. Nếu có vấn đề, xóa file `chatbot.db` và restart server.

## Phát triển

### Thêm models mới

1. Pull model từ Ollama: `ollama pull <model-name>`
2. Cập nhật `ollama_service.py` để sử dụng model mới
3. Test và điều chỉnh prompt cho phù hợp với tiếng Việt

### Cải thiện UI

- Chỉnh sửa `frontend/style.css` cho giao diện
- Cập nhật `frontend/script.js` cho tính năng mới
- Thêm themes hoặc customization options

## License

MIT License