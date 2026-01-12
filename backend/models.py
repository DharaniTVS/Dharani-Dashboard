from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    phone: str
    name: str
    role: str  # owner, branch_manager, sales_executive, service_technician
    branch_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserCreate(BaseModel):
    phone: str
    name: str
    role: str
    branch_id: Optional[str] = None

class PhoneRequest(BaseModel):
    phone: str

class VerifyOTPRequest(BaseModel):
    phone: str
    code: str
    name: Optional[str] = None
    role: Optional[str] = "owner"
    branch_id: Optional[str] = None

class ChatMessage(BaseModel):
    role: str  # user or assistant
    content: str

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    session_id: str

class CommitmentData(BaseModel):
    executive_id: str
    executive_name: str
    branch_id: str
    date: str
    bookings_planned: int = 0
    deliveries_planned: int = 0
    follow_ups_planned: int = 0
    bookings_actual: int = 0
    deliveries_actual: int = 0
    follow_ups_actual: int = 0

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]