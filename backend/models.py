from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime
import uuid

# ==================== USER MODELS ====================

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    phone: str
    name: str
    role: str  # admin, manager, executive
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
    role: Optional[str] = "admin"
    branch_id: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

# ==================== MASTER DATA MODELS ====================

class Branch(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    location: str
    manager_name: Optional[str] = None
    phone: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Executive(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    phone: str
    branch_id: str
    branch_name: Optional[str] = None
    email: Optional[str] = None
    joined_date: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class VehicleModel(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    category: str  # scooter, motorcycle, etc
    price: float
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Target(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    branch_id: Optional[str] = None
    executive_id: Optional[str] = None
    month: str  # YYYY-MM
    enquiry_target: int
    booking_target: int
    sales_target: int
    created_at: datetime = Field(default_factory=datetime.utcnow)

# ==================== SALES FUNNEL MODELS ====================

class Enquiry(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_name: str
    phone: str
    model_id: str
    model_name: Optional[str] = None
    branch_id: str
    branch_name: Optional[str] = None
    executive_id: str
    executive_name: Optional[str] = None
    enquiry_date: str
    status: str = "open"  # open, follow_up, converted, closed
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class EnquiryCreate(BaseModel):
    customer_name: str
    phone: str
    model_id: str
    branch_id: str
    executive_id: str
    enquiry_date: str
    status: str = "open"
    notes: Optional[str] = None

class Booking(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    enquiry_id: Optional[str] = None
    customer_name: str
    phone: str
    model_id: str
    model_name: Optional[str] = None
    branch_id: str
    branch_name: Optional[str] = None
    executive_id: str
    executive_name: Optional[str] = None
    booking_date: str
    booking_amount: float
    status: str = "confirmed"  # confirmed, delivered, cancelled
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class BookingCreate(BaseModel):
    enquiry_id: Optional[str] = None
    customer_name: str
    phone: str
    model_id: str
    branch_id: str
    executive_id: str
    booking_date: str
    booking_amount: float
    status: str = "confirmed"
    notes: Optional[str] = None

class Sale(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    booking_id: Optional[str] = None
    enquiry_id: Optional[str] = None
    customer_name: str
    phone: str
    model_id: str
    model_name: Optional[str] = None
    branch_id: str
    branch_name: Optional[str] = None
    executive_id: str
    executive_name: Optional[str] = None
    sale_date: str
    sale_amount: float
    payment_mode: str = "cash"  # cash, finance, etc
    vehicle_number: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class SaleCreate(BaseModel):
    booking_id: Optional[str] = None
    enquiry_id: Optional[str] = None
    customer_name: str
    phone: str
    model_id: str
    branch_id: str
    executive_id: str
    sale_date: str
    sale_amount: float
    payment_mode: str = "cash"
    vehicle_number: Optional[str] = None
    notes: Optional[str] = None

# ==================== DASHBOARD MODELS ====================

class DashboardFilters(BaseModel):
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    branch_id: Optional[str] = None
    executive_id: Optional[str] = None
    model_id: Optional[str] = None