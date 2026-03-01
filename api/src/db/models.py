from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from src.db.database import Base


class User(Base):
    """User account model"""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_superuser = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    api_keys = relationship("APIKey", back_populates="user", cascade="all, delete-orphan")
    encryption_logs = relationship("EncryptionLog", back_populates="user")


class APIKey(Base):
    """API key for programmatic access"""

    __tablename__ = "api_keys"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    key_hash = Column(String(255), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    rate_limit = Column(Integer, default=1000, nullable=False)  # requests per hour
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    last_used_at = Column(DateTime)

    # Relationships
    user = relationship("User", back_populates="api_keys")
    encryption_logs = relationship("EncryptionLog", back_populates="api_key")


class EncryptionLog(Base):
    """Log of encryption/decryption operations"""

    __tablename__ = "encryption_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    api_key_id = Column(Integer, ForeignKey("api_keys.id"), index=True)
    operation = Column(String(20), nullable=False, index=True)  # encrypt/decrypt/keygen
    bytes_processed = Column(Integer)
    used_quantum = Column(Boolean, default=False, nullable=False)
    duration_ms = Column(Integer)
    success = Column(Boolean, default=True, nullable=False)
    error_message = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Relationships
    user = relationship("User", back_populates="encryption_logs")
    api_key = relationship("APIKey", back_populates="encryption_logs")
