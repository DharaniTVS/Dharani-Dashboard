from fastapi import FastAPI, APIRouter, HTTPException, Depends, Query, Response, Request, UploadFile, File
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
import httpx
from pathlib import Path
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
import PyPDF2
import io
import re

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from sheets_service import sheets_service
from emergentintegrations.llm.chat import LlmChat, UserMessage

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# LLM API key
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ==================== PYDANTIC MODELS ====================

class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    role: str = "user"
    branch_id: Optional[str] = None

class SessionRequest(BaseModel):
    session_id: str

class AppSettings(BaseModel):
    dark_mode: bool = False
    allowed_emails: List[str] = []

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None

# ==================== AUTH HELPERS ====================

async def get_current_user(request: Request) -> User:
    """Get current user from session token (cookie or header)"""
    # Try cookie first
    session_token = request.cookies.get("session_token")
    
    # Fallback to Authorization header
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Find session
    session_doc = await db.user_sessions.find_one(
        {"session_token": session_token},
        {"_id": 0}
    )
    
    if not session_doc:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    # Check expiry
    expires_at = session_doc.get("expires_at")
    if expires_at:
        if isinstance(expires_at, str):
            expires_at = datetime.fromisoformat(expires_at)
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at < datetime.now(timezone.utc):
            raise HTTPException(status_code=401, detail="Session expired")
    
    # Find user
    user_doc = await db.users.find_one(
        {"user_id": session_doc["user_id"]},
        {"_id": 0}
    )
    
    if not user_doc:
        raise HTTPException(status_code=401, detail="User not found")
    
    return User(**user_doc)

# ==================== AUTH ENDPOINTS (Google OAuth) ====================

@api_router.post("/auth/session")
async def create_session(request: SessionRequest, response: Response):
    """Exchange session_id from Emergent Auth for session_token"""
    try:
        # Call Emergent Auth API to get user data
        async with httpx.AsyncClient() as client_http:
            auth_response = await client_http.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": request.session_id},
                timeout=10.0
            )
        
        if auth_response.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid session_id")
        
        auth_data = auth_response.json()
        email = auth_data.get("email")
        name = auth_data.get("name")
        picture = auth_data.get("picture")
        session_token = auth_data.get("session_token")
        
        # Check if email is allowed (if whitelist exists)
        settings_doc = await db.app_settings.find_one({"setting_id": "global"}, {"_id": 0})
        if settings_doc and settings_doc.get("allowed_emails"):
            allowed = settings_doc["allowed_emails"]
            if allowed and email not in allowed:
                raise HTTPException(status_code=403, detail="Email not authorized. Contact admin.")
        
        # Find or create user
        existing_user = await db.users.find_one({"email": email}, {"_id": 0})
        
        if existing_user:
            user_id = existing_user["user_id"]
            # Update user info
            await db.users.update_one(
                {"user_id": user_id},
                {"$set": {"name": name, "picture": picture}}
            )
        else:
            user_id = f"user_{uuid.uuid4().hex[:12]}"
            new_user = {
                "user_id": user_id,
                "email": email,
                "name": name,
                "picture": picture,
                "role": "user",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.users.insert_one(new_user)
        
        # Create session
        expires_at = datetime.now(timezone.utc) + timedelta(days=7)
        await db.user_sessions.insert_one({
            "user_id": user_id,
            "session_token": session_token,
            "expires_at": expires_at.isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
        # Set cookie
        response.set_cookie(
            key="session_token",
            value=session_token,
            httponly=True,
            secure=True,
            samesite="none",
            path="/",
            max_age=7 * 24 * 60 * 60  # 7 days
        )
        
        # Get user data
        user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
        
        return {"user": user_doc, "session_token": session_token}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Session creation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/auth/me")
async def get_me(user: User = Depends(get_current_user)):
    """Get current authenticated user"""
    return user.model_dump()

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    """Logout and clear session"""
    session_token = request.cookies.get("session_token")
    
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response.delete_cookie(
        key="session_token",
        path="/",
        secure=True,
        samesite="none"
    )
    
    return {"message": "Logged out successfully"}

# ==================== SETTINGS ENDPOINTS ====================

@api_router.get("/settings")
async def get_settings(user: User = Depends(get_current_user)):
    """Get app settings"""
    settings_doc = await db.app_settings.find_one({"setting_id": "global"}, {"_id": 0})
    if not settings_doc:
        return {"dark_mode": False, "allowed_emails": []}
    return settings_doc

@api_router.put("/settings")
async def update_settings(settings: AppSettings, user: User = Depends(get_current_user)):
    """Update app settings"""
    await db.app_settings.update_one(
        {"setting_id": "global"},
        {"$set": {
            "setting_id": "global",
            "dark_mode": settings.dark_mode,
            "allowed_emails": settings.allowed_emails,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )
    return {"message": "Settings updated"}

@api_router.post("/settings/add-email")
async def add_allowed_email(email: str = Query(...), user: User = Depends(get_current_user)):
    """Add email to allowed list"""
    await db.app_settings.update_one(
        {"setting_id": "global"},
        {"$addToSet": {"allowed_emails": email}},
        upsert=True
    )
    return {"message": f"Email {email} added to allowed list"}

@api_router.delete("/settings/remove-email")
async def remove_allowed_email(email: str = Query(...), user: User = Depends(get_current_user)):
    """Remove email from allowed list"""
    await db.app_settings.update_one(
        {"setting_id": "global"},
        {"$pull": {"allowed_emails": email}}
    )
    return {"message": f"Email {email} removed from allowed list"}

# ==================== GOOGLE SHEETS DATA ENDPOINTS ====================

@api_router.get("/sheets/sales-data")
async def get_sheets_sales_data(
    search: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    branch: Optional[str] = Query(None),
    executive: Optional[str] = Query(None),
    user: User = Depends(get_current_user)
):
    """Get sales data from Google Sheets with filters"""
    try:
        sales_data = await sheets_service.get_sales_data(branch)
        
        # Apply filters
        filtered_data = []
        for record in sales_data:
            # Search filter
            if search:
                search_lower = search.lower()
                searchable = f"{record.get('Customer Name', '')} {record.get('Mobile No', '')} {record.get('Vehicle Model', '')}".lower()
                if search_lower not in searchable:
                    continue
            
            # Date filter
            if start_date and end_date:
                sale_date = record.get('Sales Date', '')
                if sale_date and (sale_date < start_date or sale_date > end_date):
                    continue
            
            # Executive filter  
            if executive and record.get('Executive Name', '') != executive:
                continue
            
            filtered_data.append(record)
        
        return {
            "data": filtered_data,
            "total": len(filtered_data)
        }
    except Exception as e:
        logger.error(f"Sheets sales data error: {e}")
        return {"data": [], "total": 0}

@api_router.get("/sheets/stock-data")
async def get_sheets_stock_data(
    branch: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    user: User = Depends(get_current_user)
):
    """Get inventory/stock data from Google Sheets"""
    try:
        stock_data = await sheets_service.get_stock_data(branch)
        
        if search:
            search_lower = search.lower()
            stock_data = [
                record for record in stock_data
                if search_lower in str(record).lower()
            ]
        
        return {
            "data": stock_data,
            "total": len(stock_data)
        }
    except Exception as e:
        logger.error(f"Sheets stock data error: {e}")
        return {"data": [], "total": 0}

@api_router.get("/sheets/service-data")
async def get_sheets_service_data(
    branch: Optional[str] = Query(None),
    user: User = Depends(get_current_user)
):
    """Get service data from Google Sheets"""
    try:
        service_data = await sheets_service.get_service_data(branch)
        return {
            "data": service_data,
            "total": len(service_data)
        }
    except Exception as e:
        logger.error(f"Sheets service data error: {e}")
        return {"data": [], "total": 0}

@api_router.get("/sheets/branches")
async def get_sheets_branches(user: User = Depends(get_current_user)):
    """Get list of all branches"""
    return {"branches": sheets_service.get_branches()}

@api_router.get("/sheets/executives")
async def get_sheets_executives(
    branch: Optional[str] = Query(None),
    user: User = Depends(get_current_user)
):
    """Get unique executives from Google Sheets"""
    try:
        sales_data = await sheets_service.get_sales_data(branch)
        executives = list(set([
            record.get('Executive Name', '') 
            for record in sales_data 
            if record.get('Executive Name')
        ]))
        return {"executives": sorted(executives)}
    except Exception as e:
        logger.error(f"Sheets executives error: {e}")
        return {"executives": []}

# ==================== SERVICE PDF UPLOAD ====================

@api_router.post("/service/upload-pdf")
async def upload_service_pdf(
    file: UploadFile = File(...),
    branch: str = Query(...),
    user: User = Depends(get_current_user)
):
    """Upload and parse S601 service PDF"""
    try:
        if not file.filename.endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files allowed")
        
        content = await file.read()
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(content))
        
        extracted_data = []
        full_text = ""
        
        for page in pdf_reader.pages:
            full_text += page.extract_text() + "\n"
        
        # Parse the S601 format - technician productivity table
        lines = full_text.split('\n')
        headers = None
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Look for header row
            if 'Technician' in line and 'Free' in line and 'Paid' in line:
                headers = ['SI No', 'Technician', 'Free', 'Paid', 'PSF', 'Major', 'Minor', 
                          'Accident', 'PDI', 'Veh Tot', 'Parts Val', 'Bench work', 
                          'Out Work', 'Water Work', 'Dealer Cat Work']
                continue
            
            # Parse data rows (numbers followed by name)
            if headers and re.match(r'^\d+\s+[A-Z]', line):
                parts = line.split()
                if len(parts) >= 10:
                    row = {
                        'SI No': parts[0] if parts[0].isdigit() else '',
                        'Technician': ' '.join(parts[1:3]) if len(parts) > 2 else parts[1],
                        'Free': parts[-13] if len(parts) > 13 else '0',
                        'Paid': parts[-12] if len(parts) > 12 else '0',
                        'PSF': parts[-11] if len(parts) > 11 else '0',
                        'Major': parts[-10] if len(parts) > 10 else '0',
                        'Minor': parts[-9] if len(parts) > 9 else '0',
                        'Accident': parts[-8] if len(parts) > 8 else '0',
                        'PDI': parts[-7] if len(parts) > 7 else '0',
                        'Veh Tot': parts[-6] if len(parts) > 6 else '0',
                        'Parts Val': parts[-5] if len(parts) > 5 else '0',
                        'Bench work': parts[-4] if len(parts) > 4 else '0',
                        'Out Work': parts[-3] if len(parts) > 3 else '0',
                        'Water Work': parts[-2] if len(parts) > 2 else '0',
                        'Dealer Cat Work': parts[-1] if len(parts) > 1 else '0',
                        'Branch': branch
                    }
                    extracted_data.append(row)
        
        # Store in database (replace previous day's data for this branch)
        today = datetime.now(timezone.utc).strftime('%Y-%m-%d')
        await db.service_reports.delete_many({"branch": branch, "date": today})
        
        if extracted_data:
            for record in extracted_data:
                record['date'] = today
                record['uploaded_at'] = datetime.now(timezone.utc).isoformat()
            await db.service_reports.insert_many(extracted_data)
        
        return {
            "message": f"Successfully extracted {len(extracted_data)} records",
            "data": extracted_data,
            "filename": file.filename
        }
        
    except Exception as e:
        logger.error(f"PDF upload error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/service/reports")
async def get_service_reports(
    branch: Optional[str] = Query(None),
    date: Optional[str] = Query(None),
    user: User = Depends(get_current_user)
):
    """Get service reports from uploaded PDFs"""
    try:
        query = {}
        if branch:
            query["branch"] = branch
        if date:
            query["date"] = date
        
        reports = await db.service_reports.find(query, {"_id": 0}).to_list(None)
        return {"data": reports, "total": len(reports)}
    except Exception as e:
        logger.error(f"Service reports error: {e}")
        return {"data": [], "total": 0}

# ==================== ROOT ====================

@api_router.get("/")
async def root():
    return {"message": "Dharani TVS Business Manager API", "status": "active"}

app.include_router(api_router)

cors_origins = os.environ.get('CORS_ORIGINS', '*')
if cors_origins == '*':
    # Get the frontend URL from environment or use defaults
    frontend_url = os.environ.get('FRONTEND_URL', 'https://sales-insights-86.preview.emergentagent.com')
    cors_origins_list = [
        frontend_url,
        'http://localhost:3000',
        'https://sales-insights-86.preview.emergentagent.com'
    ]
else:
    cors_origins_list = [origin.strip() for origin in cors_origins.split(',')]

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=cors_origins_list,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    logger.info("Starting Dharani TVS Business Manager API...")
    await sheets_service.connect()

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
