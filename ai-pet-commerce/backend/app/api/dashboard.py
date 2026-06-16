from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..models.database import get_db, User, Product, AnalyticsRecord
from ..api.auth import get_current_user
from datetime import datetime, timezone, date
from ..schemas.schemas import DashboardStats

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

@router.get("")
async def get_dashboard(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    today = date.today()
    today_start = datetime.combine(today, datetime.min.time()).replace(tzinfo=timezone.utc)
    
    today_selections = db.query(AnalyticsRecord)\
        .filter(AnalyticsRecord.user_id == current_user.id)\
        .filter(AnalyticsRecord.metric_type == "selection")\
        .filter(AnalyticsRecord.record_date >= today_start)\
        .count()
    
    total_products = db.query(Product)\
        .filter(Product.owner_id == current_user.id)\
        .count()
    
    approved_products = db.query(Product)\
        .filter(Product.owner_id == current_user.id)\
        .filter(Product.decision == "YES")\
        .count()
    
    pending_products = db.query(Product)\
        .filter(Product.owner_id == current_user.id)\
        .filter(Product.status == "draft")\
        .count()
    
    avg_score = db.query(func.avg(Product.score))\
        .filter(Product.owner_id == current_user.id)\
        .scalar() or 0.0
    
    top_products = db.query(Product)\
        .filter(Product.owner_id == current_user.id)\
        .order_by(Product.score.desc())\
        .limit(5)\
        .all()
    
    return {
        "success": True,
        "data": {
            "stats": {
                "today_selections": today_selections,
                "total_products": total_products,
                "approved_products": approved_products,
                "pending_products": pending_products,
                "avg_score": round(avg_score, 2)
            },
            "top_products": [
                {
                    "id": p.id,
                    "product_name": p.product_name,
                    "score": p.score,
                    "decision": p.decision
                } for p in top_products
            ],
            "user_info": {
                "email": current_user.email,
                "subscription_plan": current_user.subscription_plan,
                "subscription_status": current_user.subscription_status
            }
        }
    }