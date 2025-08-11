from sqlalchemy import create_engine, Column, Integer, String, DateTime, Text, Float, ForeignKey, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
from passlib.context import CryptContext

SQLITE_DATABASE_URL = "sqlite:///./chatbot.db"

engine = create_engine(SQLITE_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Password context for bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    full_name = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    
    # Relationship với conversations
    conversations = relationship("Conversation", back_populates="user")
    
    def verify_password(self, password: str) -> bool:
        return pwd_context.verify(password, self.password_hash)
    
    @staticmethod
    def hash_password(password: str) -> str:
        return pwd_context.hash(password)

class Conversation(Base):
    __tablename__ = "conversations"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    user_message = Column(Text)
    bot_response = Column(Text)
    timestamp = Column(DateTime, default=datetime.utcnow)
    rating = Column(Float, nullable=True)  # Đánh giá từ 1-5
    feedback = Column(Text, nullable=True)  # Phản hồi chi tiết
    
    # Relationship với user
    user = relationship("User", back_populates="conversations")

def create_tables():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()