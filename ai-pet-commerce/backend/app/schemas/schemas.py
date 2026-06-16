from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    email: str
    subscription_plan: str

class ProductSelectRequest(BaseModel):
    keyword: str
    count: Optional[int] = 10

class ProductAnalyzeRequest(BaseModel):
    product_name: str

class ProductGenerateRequest(BaseModel):
    product_name: str
    content_types: List[str] = ["title", "selling_points", "keywords", "video_script"]

class ProductUploadRequest(BaseModel):
    product_id: int
    platform: str

class SubscriptionRequest(BaseModel):
    plan: str

class ProductResponse(BaseModel):
    id: int
    product_name: str
    score: float
    decision: str
    reason: str
    title: str
    selling_points: List[str]
    keywords: List[str]
    video_script: str
    price_suggestion: float
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}

class DashboardStats(BaseModel):
    today_selections: int
    total_products: int
    approved_products: int
    pending_products: int
    avg_score: float

class AnalyticsResponse(BaseModel):
    conversion_rate: float
    success_rate: float
    avg_roi: float
    recommendations: List[str]