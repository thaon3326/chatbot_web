from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from routers import chat
from database import create_tables
import os

# Tạo bảng database
create_tables()

app = FastAPI(
    title="Vietnamese AI Chatbot",
    description="Chatbot AI sử dụng Ollama models với giao diện tiếng Việt",
    version="1.0.0"
)

# Cấu hình CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(chat.router, prefix="/api", tags=["chat"])

# Serve static files
frontend_path = os.path.join(os.path.dirname(__file__), "..", "frontend")
if os.path.exists(frontend_path):
    app.mount("/static", StaticFiles(directory=frontend_path), name="static")

@app.get("/")
async def read_root():
    """
    Serve trang chủ
    """
    frontend_file = os.path.join(frontend_path, "index.html")
    if os.path.exists(frontend_file):
        return FileResponse(frontend_file)
    return {"message": "Vietnamese AI Chatbot API", "docs": "/docs"}

@app.get("/health")
async def health():
    return {"status": "healthy", "message": "Vietnamese AI Chatbot is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app", 
        host="0.0.0.0", 
        port=12000, 
        reload=True,
        access_log=True
    )