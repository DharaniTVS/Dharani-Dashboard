from fastapi import HTTPException, Depends, Header
from typing import Optional
import jwt
from datetime import datetime, timedelta, timezone
import os
from models import User
from motor.motor_asyncio import AsyncIOMotorClient

JWT_SECRET = os.getenv("JWT_SECRET", "dharani-tvs-secret-key-2025")
JWT_ALGORITHM = "HS256"

# Get db from main app
from server import db

def create_access_token(data: dict, expires_delta: timedelta = timedelta(days=30)):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + expires_delta
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

async def get_current_user(authorization: Optional[str] = Header(None)) -> User:
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        token = authorization.replace("Bearer ", "")
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user_doc = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user_doc:
            raise HTTPException(status_code=401, detail="User not found")
        
        return User(**user_doc)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid token")

async def require_role(user: User = Depends(get_current_user), allowed_roles: list = None) -> User:
    if allowed_roles and user.role not in allowed_roles:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    return user