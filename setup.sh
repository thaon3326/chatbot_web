#!/bin/bash

echo "🚀 Thiết lập Chatbot AI Tiếng Việt..."

# Cài đặt Python dependencies
echo "📦 Cài đặt Python dependencies..."
cd backend
pip install -r requirements.txt

# Kiểm tra và cài đặt Ollama
echo "🤖 Kiểm tra Ollama..."
if ! command -v ollama &> /dev/null; then
    echo "⬇️ Cài đặt Ollama..."
    curl -fsSL https://ollama.ai/install.sh | sh
else
    echo "✅ Ollama đã được cài đặt"
fi

# Khởi động Ollama service (nếu chưa chạy)
echo "🔄 Khởi động Ollama service..."
ollama serve &
sleep 5

# Pull model mặc định
echo "📥 Tải model AI (llama3.2:3b)..."
ollama pull llama3.2:3b

echo "✅ Thiết lập hoàn tất!"
echo "🌐 Chạy lệnh sau để khởi động server:"
echo "   cd backend && python main.py"
echo "📱 Sau đó truy cập: http://localhost:12000"