from fastapi import FastAPI, APIRouter, HTTPException, Depends, Query
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
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional
from collections import defaultdict

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Import sheets_service AFTER loading environment
from sheets_service import sheets_service

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Twilio client
twilio_client = None
try:
    if os.getenv("TWILIO_ACCOUNT_SID") and os.getenv("TWILIO_AUTH_TOKEN"):
        twilio_client = Client(os.getenv("TWILIO_ACCOUNT_SID"), os.getenv("TWILIO_AUTH_TOKEN"))
except Exception as e:
    logging.warning(f"Twilio not configured: {e}")

# ==================== AUTH ENDPOINTS ====================

@api_router.post("/auth/send-otp")
async def send_otp(request: PhoneRequest):
    if not twilio_client:
        return {"status": "pending", "message": "Demo mode: Use any 6-digit code"}
    try:
        verification = twilio_client.verify.services(
            os.getenv("TWILIO_VERIFY_SERVICE")
        ).verifications.create(to=request.phone, channel="sms")
        return {"status": verification.status}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.post("/auth/verify-otp", response_model=TokenResponse)
async def verify_otp(request: VerifyOTPRequest):
    is_valid = False
    if not twilio_client:
        is_valid = len(request.code) == 6 and request.code.isdigit()
    else:
        try:
            check = twilio_client.verify.services(
                os.getenv("TWILIO_VERIFY_SERVICE")
            ).verification_checks.create(to=request.phone, code=request.code)
            is_valid = check.status == "approved"
        except:
            is_valid = False
    
    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    user_doc = await db.users.find_one({"phone": request.phone}, {"_id": 0})
    if not user_doc:
        new_user = User(
            phone=request.phone,
            name=request.name or "User",
            role=request.role or "admin",
            branch_id=request.branch_id
        )
        user_dict = new_user.model_dump()
        user_dict['created_at'] = user_dict['created_at'].isoformat()
        await db.users.insert_one(user_dict)
        user = new_user
    else:
        user = User(**user_doc)
    
    access_token = create_access_token(data={"sub": user.id, "role": user.role})
    return TokenResponse(access_token=access_token, user=user.model_dump())

@api_router.get("/auth/me")
async def get_me(user: User = Depends(get_current_user)):
    return user

# ==================== DASHBOARD ENDPOINTS ====================

@api_router.get("/dashboard/kpis")
async def get_dashboard_kpis(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    branch_id: Optional[str] = Query(None),
    executive_id: Optional[str] = Query(None),
    user: User = Depends(get_current_user)
):
    """Get top KPI cards for dashboard"""
    try:
        # Build query filters
        query = {}
        if start_date and end_date:
            date_filter = {"$gte": start_date, "$lte": end_date}
        else:
            date_filter = None
        
        if branch_id:
            query["branch_id"] = branch_id
        if executive_id:
            query["executive_id"] = executive_id
        
        # Count enquiries
        enquiry_query = query.copy()
        if date_filter:
            enquiry_query["enquiry_date"] = date_filter
        total_enquiries = await db.enquiries.count_documents(enquiry_query)
        
        # Count bookings
        booking_query = query.copy()
        if date_filter:
            booking_query["booking_date"] = date_filter
        total_bookings = await db.bookings.count_documents(booking_query)
        
        # Count sales
        sales_query = query.copy()
        if date_filter:
            sales_query["sale_date"] = date_filter
        total_sales = await db.sales.count_documents(sales_query)
        
        # Calculate conversions
        enquiry_to_booking = round((total_bookings / total_enquiries * 100), 2) if total_enquiries > 0 else 0
        booking_to_sales = round((total_sales / total_bookings * 100), 2) if total_bookings > 0 else 0
        
        return {
            "total_enquiries": total_enquiries,
            "total_bookings": total_bookings,
            "total_sales": total_sales,
            "enquiry_to_booking_conversion": enquiry_to_booking,
            "booking_to_sales_conversion": booking_to_sales
        }
    except Exception as e:
        logger.error(f"KPIs error: {e}")
        return {
            "total_enquiries": 0,
            "total_bookings": 0,
            "total_sales": 0,
            "enquiry_to_booking_conversion": 0,
            "booking_to_sales_conversion": 0
        }

@api_router.get("/dashboard/funnel")
async def get_funnel_data(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    branch_id: Optional[str] = Query(None),
    user: User = Depends(get_current_user)
):
    """Get funnel chart data: Enquiry → Booking → Sales"""
    kpis = await get_dashboard_kpis(start_date, end_date, branch_id, None, user)
    return {
        "funnel": [
            {"stage": "Enquiry", "value": kpis["total_enquiries"]},
            {"stage": "Booking", "value": kpis["total_bookings"]},
            {"stage": "Sales", "value": kpis["total_sales"]}
        ]
    }

@api_router.get("/dashboard/trends")
async def get_trends(
    period: str = Query("daily"),  # daily or monthly
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    user: User = Depends(get_current_user)
):
    """Get daily/monthly trend for Enquiries, Bookings, Sales"""
    try:
        # This would aggregate by date - simplified version returns sample data
        return {
            "trends": [
                {"date": "2025-01-01", "enquiries": 15, "bookings": 12, "sales": 8},
                {"date": "2025-01-02", "enquiries": 18, "bookings": 14, "sales": 10},
                {"date": "2025-01-03", "enquiries": 20, "bookings": 16, "sales": 12}
            ]
        }
    except Exception as e:
        logger.error(f"Trends error: {e}")
        return {"trends": []}

@api_router.get("/dashboard/branch-performance")
async def get_branch_performance(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    user: User = Depends(get_current_user)
):
    """Get branch-wise Enquiry, Booking, Sales for grouped bar chart"""
    try:
        branches = await db.branches.find({}, {"_id": 0}).to_list(None)
        performance = []
        
        for branch in branches:
            enquiries = await db.enquiries.count_documents({"branch_id": branch["id"]})
            bookings = await db.bookings.count_documents({"branch_id": branch["id"]})
            sales = await db.sales.count_documents({"branch_id": branch["id"]})
            
            performance.append({
                "branch": branch["name"],
                "enquiries": enquiries,
                "bookings": bookings,
                "sales": sales
            })
        
        return {"performance": performance}
    except Exception as e:
        logger.error(f"Branch performance error: {e}")
        return {"performance": []}

@api_router.get("/dashboard/executive-ranking")
async def get_executive_ranking(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    branch_id: Optional[str] = Query(None),
    user: User = Depends(get_current_user)
):
    """Get executive-wise performance ranking"""
    try:
        query = {}
        if branch_id:
            query["branch_id"] = branch_id
        
        executives = await db.executives.find(query, {"_id": 0}).to_list(None)
        ranking = []
        
        for exec in executives:
            sales_count = await db.sales.count_documents({"executive_id": exec["id"]})
            bookings_count = await db.bookings.count_documents({"executive_id": exec["id"]})
            enquiries_count = await db.enquiries.count_documents({"executive_id": exec["id"]})
            
            ranking.append({
                "executive": exec["name"],
                "sales": sales_count,
                "bookings": bookings_count,
                "enquiries": enquiries_count,
                "score": sales_count * 3 + bookings_count * 2 + enquiries_count
            })
        
        ranking.sort(key=lambda x: x["score"], reverse=True)
        return {"ranking": ranking[:10]}  # Top 10
    except Exception as e:
        logger.error(f"Executive ranking error: {e}")
        return {"ranking": []}

# ==================== ENQUIRIES CRUD ====================

@api_router.get("/enquiries")
async def list_enquiries(
    branch_id: Optional[str] = Query(None),
    executive_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    user: User = Depends(get_current_user)
):
    query = {}
    if branch_id:
        query["branch_id"] = branch_id
    if executive_id:
        query["executive_id"] = executive_id
    if status:
        query["status"] = status
    
    enquiries = await db.enquiries.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"enquiries": enquiries}

@api_router.post("/enquiries")
async def create_enquiry(enquiry: EnquiryCreate, user: User = Depends(get_current_user)):
    # Enrich with names
    branch = await db.branches.find_one({"id": enquiry.branch_id}, {"_id": 0})
    executive = await db.executives.find_one({"id": enquiry.executive_id}, {"_id": 0})
    model = await db.models.find_one({"id": enquiry.model_id}, {"_id": 0})
    
    new_enquiry = Enquiry(
        **enquiry.model_dump(),
        branch_name=branch["name"] if branch else None,
        executive_name=executive["name"] if executive else None,
        model_name=model["name"] if model else None
    )
    
    enquiry_dict = new_enquiry.model_dump()
    enquiry_dict['created_at'] = enquiry_dict['created_at'].isoformat()
    await db.enquiries.insert_one(enquiry_dict)
    
    return {"message": "Enquiry created", "id": new_enquiry.id}

@api_router.put("/enquiries/{enquiry_id}")
async def update_enquiry(enquiry_id: str, updates: dict, user: User = Depends(get_current_user)):
    await db.enquiries.update_one({"id": enquiry_id}, {"$set": updates})
    return {"message": "Enquiry updated"}

@api_router.delete("/enquiries/{enquiry_id}")
async def delete_enquiry(enquiry_id: str, user: User = Depends(get_current_user)):
    await db.enquiries.delete_one({"id": enquiry_id})
    return {"message": "Enquiry deleted"}

# ==================== BOOKINGS CRUD ====================

@api_router.get("/bookings")
async def list_bookings(user: User = Depends(get_current_user)):
    bookings = await db.bookings.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"bookings": bookings}

@api_router.post("/bookings")
async def create_booking(booking: BookingCreate, user: User = Depends(get_current_user)):
    # Enrich with names
    branch = await db.branches.find_one({"id": booking.branch_id}, {"_id": 0})
    executive = await db.executives.find_one({"id": booking.executive_id}, {"_id": 0})
    model = await db.models.find_one({"id": booking.model_id}, {"_id": 0})
    
    new_booking = Booking(
        **booking.model_dump(),
        branch_name=branch["name"] if branch else None,
        executive_name=executive["name"] if executive else None,
        model_name=model["name"] if model else None
    )
    
    booking_dict = new_booking.model_dump()
    booking_dict['created_at'] = booking_dict['created_at'].isoformat()
    await db.bookings.insert_one(booking_dict)
    
    # Update enquiry status if linked
    if booking.enquiry_id:
        await db.enquiries.update_one({"id": booking.enquiry_id}, {"$set": {"status": "converted"}})
    
    return {"message": "Booking created", "id": new_booking.id}

# ==================== SALES CRUD ====================

@api_router.get("/sales")
async def list_sales(user: User = Depends(get_current_user)):
    sales = await db.sales.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"sales": sales}

@api_router.post("/sales")
async def create_sale(sale: SaleCreate, user: User = Depends(get_current_user)):
    # Enrich with names
    branch = await db.branches.find_one({"id": sale.branch_id}, {"_id": 0})
    executive = await db.executives.find_one({"id": sale.executive_id}, {"_id": 0})
    model = await db.models.find_one({"id": sale.model_id}, {"_id": 0})
    
    new_sale = Sale(
        **sale.model_dump(),
        branch_name=branch["name"] if branch else None,
        executive_name=executive["name"] if executive else None,
        model_name=model["name"] if model else None
    )
    
    sale_dict = new_sale.model_dump()
    sale_dict['created_at'] = sale_dict['created_at'].isoformat()
    await db.sales.insert_one(sale_dict)
    
    # Update booking status if linked
    if sale.booking_id:
        await db.bookings.update_one({"id": sale.booking_id}, {"$set": {"status": "delivered"}})
    
    return {"message": "Sale created", "id": new_sale.id}

# ==================== MASTER DATA CRUD ====================

@api_router.get("/branches")
async def list_branches(user: User = Depends(get_current_user)):
    branches = await db.branches.find({}, {"_id": 0}).to_list(None)
    return {"branches": branches}

@api_router.post("/branches")
async def create_branch(branch: Branch, user: User = Depends(get_current_user)):
    branch_dict = branch.model_dump()
    branch_dict['created_at'] = branch_dict['created_at'].isoformat()
    await db.branches.insert_one(branch_dict)
    return {"message": "Branch created", "id": branch.id}

@api_router.get("/executives")
async def list_executives(user: User = Depends(get_current_user)):
    executives = await db.executives.find({}, {"_id": 0}).to_list(None)
    return {"executives": executives}

@api_router.post("/executives")
async def create_executive(executive: Executive, user: User = Depends(get_current_user)):
    branch = await db.branches.find_one({"id": executive.branch_id}, {"_id": 0})
    executive.branch_name = branch["name"] if branch else None
    
    exec_dict = executive.model_dump()
    exec_dict['created_at'] = exec_dict['created_at'].isoformat()
    await db.executives.insert_one(exec_dict)
    return {"message": "Executive created", "id": executive.id}

@api_router.get("/models")
async def list_models(user: User = Depends(get_current_user)):
    models = await db.models.find({}, {"_id": 0}).to_list(None)
    return {"models": models}

@api_router.post("/models")
async def create_model(model: VehicleModel, user: User = Depends(get_current_user)):
    model_dict = model.model_dump()
    model_dict['created_at'] = model_dict['created_at'].isoformat()
    await db.models.insert_one(model_dict)
    return {"message": "Model created", "id": model.id}

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
        sales_data = await sheets_service.get_sales_data()
        
        # Apply filters
        filtered_data = []
        for record in sales_data:
            # Search filter (search in customer name, phone, model)
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
            
            # Branch filter
            if branch and record.get('Location', '') != branch:
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

@api_router.get("/sheets/branches")
async def get_sheets_branches(user: User = Depends(get_current_user)):
    """Get unique branches from Google Sheets"""
    try:
        sales_data = await sheets_service.get_sales_data()
        branches = list(set([record.get('Location', '') for record in sales_data if record.get('Location')]))
        return {"branches": sorted(branches)}
    except Exception as e:
        logger.error(f"Sheets branches error: {e}")
        return {"branches": []}

@api_router.get("/sheets/executives")
async def get_sheets_executives(user: User = Depends(get_current_user)):
    """Get unique executives from Google Sheets"""
    try:
        sales_data = await sheets_service.get_sales_data()
        executives = list(set([record.get('Executive Name', '') for record in sales_data if record.get('Executive Name')]))
        return {"executives": sorted(executives)}
    except Exception as e:
        logger.error(f"Sheets executives error: {e}")
        return {"executives": []}

@api_router.get("/")
async def root():
    return {"message": "Dealership SaaS API", "status": "active"}

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
    logger.info("Starting Dealership SaaS API...")
    await sheets_service.connect()

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
