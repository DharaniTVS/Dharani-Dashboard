from fastapi import FastAPI, APIRouter, HTTPException, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from models import *
from auth import create_access_token, get_current_user
from sheets_service import sheets_service
from twilio.rest import Client
from emergentintegrations.llm.chat import LlmChat, UserMessage
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional
import asyncio
from apscheduler.schedulers.asyncio import AsyncIOScheduler

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Twilio client
twilio_client = None
try:
    if os.getenv("TWILIO_ACCOUNT_SID") and os.getenv("TWILIO_AUTH_TOKEN"):
        twilio_client = Client(os.getenv("TWILIO_ACCOUNT_SID"), os.getenv("TWILIO_AUTH_TOKEN"))
except Exception as e:
    logging.warning(f"Twilio not configured: {e}")

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Scheduler for WhatsApp commitments
scheduler = AsyncIOScheduler()

# ==================== AUTH ENDPOINTS ====================

@api_router.post("/auth/send-otp")
async def send_otp(request: PhoneRequest):
    """Send OTP to phone number"""
    if not twilio_client:
        # Demo mode - return success without actually sending
        logger.info(f"Demo mode: OTP would be sent to {request.phone}")
        return {"status": "pending", "message": "Demo mode: Use any 6-digit code"}
    
    try:
        verification = twilio_client.verify.services(
            os.getenv("TWILIO_VERIFY_SERVICE")
        ).verifications.create(to=request.phone, channel="sms")
        return {"status": verification.status}
    except Exception as e:
        logger.error(f"Failed to send OTP: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@api_router.post("/auth/verify-otp", response_model=TokenResponse)
async def verify_otp(request: VerifyOTPRequest):
    """Verify OTP and create/login user"""
    # In demo mode, accept any 6-digit code
    is_valid = False
    
    if not twilio_client:
        # Demo mode - accept any 6-digit code
        is_valid = len(request.code) == 6 and request.code.isdigit()
    else:
        try:
            check = twilio_client.verify.services(
                os.getenv("TWILIO_VERIFY_SERVICE")
            ).verification_checks.create(to=request.phone, code=request.code)
            is_valid = check.status == "approved"
        except Exception as e:
            logger.error(f"OTP verification failed: {e}")
            is_valid = False
    
    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    # Check if user exists
    user_doc = await db.users.find_one({"phone": request.phone}, {"_id": 0})
    
    if not user_doc:
        # Create new user
        new_user = User(
            phone=request.phone,
            name=request.name or "User",
            role=request.role or "owner",
            branch_id=request.branch_id
        )
        user_dict = new_user.model_dump()
        user_dict['created_at'] = user_dict['created_at'].isoformat()
        await db.users.insert_one(user_dict)
        user = new_user
    else:
        user = User(**user_doc)
    
    # Create JWT token
    access_token = create_access_token(data={"sub": user.id, "role": user.role})
    
    return TokenResponse(
        access_token=access_token,
        user=user.model_dump()
    )

@api_router.get("/auth/me")
async def get_me(user: User = Depends(get_current_user)):
    """Get current user info"""
    return user

# ==================== DASHBOARD ENDPOINTS ====================

@api_router.get("/dashboard/overview")
async def get_dashboard_overview(user: User = Depends(get_current_user)):
    """Get multi-branch dashboard overview"""
    try:
        # Fetch data from Google Sheets
        sales_data = await sheets_service.get_sales_data()
        service_data = await sheets_service.get_service_data()
        finance_data = await sheets_service.get_finance_cases()
        
        # Aggregate by branch
        branches = {}
        for sale in sales_data:
            branch_id = sale.get('branch_id', 'unknown')
            if branch_id not in branches:
                branches[branch_id] = {
                    'branch_id': branch_id,
                    'branch_name': sale.get('branch_name', 'Unknown'),
                    'bookings': 0,
                    'deliveries': 0,
                    'revenue': 0
                }
            
            if sale.get('status') == 'booked':
                branches[branch_id]['bookings'] += 1
            if sale.get('status') == 'delivered':
                branches[branch_id]['deliveries'] += 1
            
            branches[branch_id]['revenue'] += float(sale.get('amount', 0) or 0)
        
        # Service stats
        service_stats = {
            'total_jobs': len(service_data),
            'completed': sum(1 for s in service_data if s.get('status') == 'completed'),
            'pending': sum(1 for s in service_data if s.get('status') == 'pending')
        }
        
        # Finance stats
        finance_stats = {
            'total_cases': len(finance_data),
            'approved': sum(1 for f in finance_data if f.get('status') == 'approved'),
            'pending': sum(1 for f in finance_data if f.get('status') == 'pending'),
            'rejected': sum(1 for f in finance_data if f.get('status') == 'rejected')
        }
        
        return {
            'branches': list(branches.values()),
            'service_stats': service_stats,
            'finance_stats': finance_stats,
            'total_branches': len(branches)
        }
    except Exception as e:
        logger.error(f"Dashboard overview error: {e}")
        # Return demo data if sheets not accessible
        return {
            'branches': [
                {'branch_id': '1', 'branch_name': 'Branch 1', 'bookings': 12, 'deliveries': 8, 'revenue': 850000},
                {'branch_id': '2', 'branch_name': 'Branch 2', 'bookings': 15, 'deliveries': 10, 'revenue': 1200000},
                {'branch_id': '3', 'branch_name': 'Branch 3', 'bookings': 10, 'deliveries': 7, 'revenue': 650000},
                {'branch_id': '4', 'branch_name': 'Branch 4', 'bookings': 18, 'deliveries': 12, 'revenue': 1400000},
                {'branch_id': '5', 'branch_name': 'Branch 5', 'bookings': 14, 'deliveries': 9, 'revenue': 980000}
            ],
            'service_stats': {'total_jobs': 145, 'completed': 120, 'pending': 25},
            'finance_stats': {'total_cases': 68, 'approved': 52, 'pending': 12, 'rejected': 4},
            'total_branches': 5,
            'demo_mode': True
        }

@api_router.get("/sales/executives")
async def get_executives_performance(user: User = Depends(get_current_user)):
    """Get executive-wise sales performance"""
    try:
        sales_data = await sheets_service.get_sales_data()
        
        executives = {}
        for sale in sales_data:
            exec_id = sale.get('executive_id')
            if not exec_id:
                continue
            
            if exec_id not in executives:
                executives[exec_id] = {
                    'executive_id': exec_id,
                    'name': sale.get('executive_name', 'Unknown'),
                    'branch': sale.get('branch_name', 'Unknown'),
                    'bookings': 0,
                    'deliveries': 0,
                    'follow_ups': 0,
                    'conversion_rate': 0
                }
            
            if sale.get('status') == 'booked':
                executives[exec_id]['bookings'] += 1
            if sale.get('status') == 'delivered':
                executives[exec_id]['deliveries'] += 1
        
        # Calculate conversion rates
        for exec_data in executives.values():
            if exec_data['bookings'] > 0:
                exec_data['conversion_rate'] = round(
                    (exec_data['deliveries'] / exec_data['bookings']) * 100, 2
                )
        
        return {'executives': list(executives.values())}
    except Exception as e:
        logger.error(f"Executives performance error: {e}")
        return {
            'executives': [
                {'executive_id': '1', 'name': 'Rajesh Kumar', 'branch': 'Branch 1', 'bookings': 12, 'deliveries': 8, 'conversion_rate': 66.67},
                {'executive_id': '2', 'name': 'Priya Sharma', 'branch': 'Branch 2', 'bookings': 15, 'deliveries': 12, 'conversion_rate': 80.0},
                {'executive_id': '3', 'name': 'Arun Patel', 'branch': 'Branch 3', 'bookings': 10, 'deliveries': 6, 'conversion_rate': 60.0}
            ],
            'demo_mode': True
        }

@api_router.get("/service/technicians")
async def get_technicians_performance(user: User = Depends(get_current_user)):
    """Get technician-wise service performance"""
    try:
        service_data = await sheets_service.get_service_data()
        
        technicians = {}
        for job in service_data:
            tech_id = job.get('technician_id')
            if not tech_id:
                continue
            
            if tech_id not in technicians:
                technicians[tech_id] = {
                    'technician_id': tech_id,
                    'name': job.get('technician_name', 'Unknown'),
                    'branch': job.get('branch_name', 'Unknown'),
                    'jobs_completed': 0,
                    'jobs_pending': 0,
                    'avg_time': 0
                }
            
            if job.get('status') == 'completed':
                technicians[tech_id]['jobs_completed'] += 1
            elif job.get('status') == 'pending':
                technicians[tech_id]['jobs_pending'] += 1
        
        return {'technicians': list(technicians.values())}
    except Exception as e:
        logger.error(f"Technicians performance error: {e}")
        return {
            'technicians': [
                {'technician_id': '1', 'name': 'Kumar S', 'branch': 'Branch 1', 'jobs_completed': 45, 'jobs_pending': 3, 'avg_time': 2.5},
                {'technician_id': '2', 'name': 'Vijay R', 'branch': 'Branch 2', 'jobs_completed': 52, 'jobs_pending': 2, 'avg_time': 2.2},
                {'technician_id': '3', 'name': 'Suresh M', 'branch': 'Branch 3', 'jobs_completed': 38, 'jobs_pending': 5, 'avg_time': 3.1}
            ],
            'demo_mode': True
        }

# ==================== AI CHAT ENDPOINT ====================

@api_router.post("/ai/chat", response_model=ChatResponse)
async def ai_chat(request: ChatRequest, user: User = Depends(get_current_user)):
    """AI chat interface for business queries"""
    try:
        session_id = request.session_id or f"user_{user.id}"
        
        # Fetch recent data for context
        sales_data = await sheets_service.get_sales_data()
        service_data = await sheets_service.get_service_data()
        finance_data = await sheets_service.get_finance_cases()
        
        # Build context
        context = f"""You are Dharani TVS Business AI Manager. You have access to live data from 5 branches.
        
Current Data Summary:
- Total Sales Records: {len(sales_data)}
- Total Service Jobs: {len(service_data)}
- Finance Cases: {len(finance_data)}

User Role: {user.role}
User Branch: {user.branch_id or 'All Branches'}

Provide concise, actionable insights based on the user's query."""
        
        # Initialize LLM chat
        llm_chat = LlmChat(
            api_key=os.getenv("EMERGENT_LLM_KEY"),
            session_id=session_id,
            system_message=context
        ).with_model("openai", "gpt-5.2")
        
        # Send message
        user_message = UserMessage(text=request.message)
        response = await llm_chat.send_message(user_message)
        
        # Save to chat history
        await db.chat_history.insert_one({
            "user_id": user.id,
            "session_id": session_id,
            "message": request.message,
            "response": response,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
        return ChatResponse(response=response, session_id=session_id)
    except Exception as e:
        logger.error(f"AI chat error: {e}")
        raise HTTPException(status_code=500, detail=f"AI chat failed: {str(e)}")

# ==================== COMMITMENTS ENDPOINTS ====================

@api_router.get("/commitments/today")
async def get_today_commitments(user: User = Depends(get_current_user)):
    """Get today's commitments"""
    try:
        sales_commitments = await sheets_service.get_daily_commitments_sales()
        service_commitments = await sheets_service.get_daily_commitments_service()
        
        return {
            'sales': sales_commitments,
            'service': service_commitments
        }
    except Exception as e:
        logger.error(f"Commitments error: {e}")
        return {'sales': [], 'service': [], 'demo_mode': True}

# ==================== PLANS ENDPOINTS ====================

@api_router.get("/plans/day")
async def get_day_plan(user: User = Depends(get_current_user)):
    """Get day plan vs actual"""
    try:
        day_plan = await sheets_service.get_day_plan()
        return {'plan': day_plan}
    except Exception as e:
        logger.error(f"Day plan error: {e}")
        return {'plan': [], 'demo_mode': True}

@api_router.get("/plans/week")
async def get_week_plan(user: User = Depends(get_current_user)):
    """Get week plan vs actual"""
    try:
        week_plan = await sheets_service.get_week_plan()
        return {'plan': week_plan}
    except Exception as e:
        logger.error(f"Week plan error: {e}")
        return {'plan': [], 'demo_mode': True}

@api_router.get("/plans/month")
async def get_month_plan(user: User = Depends(get_current_user)):
    """Get month plan vs actual"""
    try:
        month_plan = await sheets_service.get_month_plan()
        return {'plan': month_plan}
    except Exception as e:
        logger.error(f"Month plan error: {e}")
        return {'plan': [], 'demo_mode': True}

# ==================== ROOT ====================

@api_router.get("/")
async def root():
    return {"message": "Dharani TVS Business AI Manager API", "status": "active"}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    logger.info("Starting Dharani TVS Business AI Manager...")
    # Connect to Google Sheets
    await sheets_service.connect()
    
    # Start scheduler (commented for now - enable when Twilio is configured)
    # scheduler.start()

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
    # scheduler.shutdown()