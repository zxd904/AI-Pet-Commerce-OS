from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..models.database import get_db, User, Product, AnalyticsRecord, ProductUpload
from ..api.auth import get_current_user
from datetime import datetime, timezone, timedelta
from ..schemas.schemas import AnalyticsResponse

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

@router.get("")
async def get_analytics(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    last_30_days = datetime.now(timezone.utc) - timedelta(days=30)
    
    total_products = db.query(Product)\
        .filter(Product.owner_id == current_user.id)\
        .count()
    
    approved_products = db.query(Product)\
        .filter(Product.owner_id == current_user.id)\
        .filter(Product.decision == "YES")\
        .count()
    
    uploaded_products = db.query(ProductUpload)\
        .filter(ProductUpload.product.has(owner_id=current_user.id))\
        .count()
    
    avg_score = db.query(func.avg(Product.score))\
        .filter(Product.owner_id == current_user.id)\
        .scalar() or 0.0
    
    conversion_rate = (uploaded_products / max(total_products, 1)) * 100
    success_rate = (approved_products / max(total_products, 1)) * 100
    
    avg_roi = 35.5
    
    recommendations = []
    if avg_score < 70:
        recommendations.append("建议关注高评分商品，优化选品策略")
    if uploaded_products < total_products * 0.3:
        recommendations.append("建议增加商品上架数量，提升曝光机会")
    if success_rate < 60:
        recommendations.append("建议分析拒绝原因，改进商品选择")
    
    return {
        "success": True,
        "data": {
            "conversion_rate": round(conversion_rate, 2),
            "success_rate": round(success_rate, 2),
            "avg_roi": avg_roi,
            "recommendations": recommendations,
            "metrics": {
                "total_products": total_products,
                "approved_products": approved_products,
                "uploaded_products": uploaded_products,
                "avg_score": round(avg_score, 2)
            }
        }
    }