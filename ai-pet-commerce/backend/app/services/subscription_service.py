from sqlalchemy.orm import Session
from ..models.database import User, AnalyticsRecord
from datetime import datetime, timezone

PLANS = {
    "free": {
        "name": "免费版",
        "price": 0,
        "limits": {
            "daily_selections": 5,
            "max_products": 50,
            "ai_analysis": True,
            "auto_publish": False,
            "analytics": False
        }
    },
    "pro": {
        "name": "专业版",
        "price": 99,
        "limits": {
            "daily_selections": 50,
            "max_products": 500,
            "ai_analysis": True,
            "auto_publish": True,
            "analytics": True
        }
    },
    "business": {
        "name": "企业版",
        "price": 299,
        "limits": {
            "daily_selections": 200,
            "max_products": 5000,
            "ai_analysis": True,
            "auto_publish": True,
            "analytics": True
        }
    }
}

def get_plan_limits(plan: str):
    return PLANS.get(plan, PLANS["free"])

def upgrade_subscription(db: Session, user_id: int, plan: str) -> bool:
    if plan not in PLANS:
        return False
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return False
    
    user.subscription_plan = plan
    user.subscription_status = "active"
    user.updated_at = datetime.now(timezone.utc)
    
    db.commit()
    return True

def downgrade_subscription(db: Session, user_id: int) -> bool:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return False
    
    user.subscription_plan = "free"
    user.subscription_status = "inactive"
    user.stripe_subscription_id = None
    user.updated_at = datetime.now(timezone.utc)
    
    db.commit()
    return True

def check_limit(db: Session, user_id: int, limit_type: str) -> bool:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return False
    
    plan = get_plan_limits(user.subscription_plan)
    limits = plan["limits"]
    
    if limit_type == "selections":
        today = datetime.now(timezone.utc).date()
        today_selections = db.query(AnalyticsRecord)\
            .filter(AnalyticsRecord.user_id == user_id)\
            .filter(AnalyticsRecord.metric_type == "selection")\
            .filter(AnalyticsRecord.record_date >= datetime.combine(today, datetime.min.time()))\
            .count()
        return today_selections < limits["daily_selections"]
    
    elif limit_type == "products":
        product_count = db.query(User).filter(User.id == user_id).first().products.count()
        return product_count < limits["max_products"]
    
    return True

def record_analytics(db: Session, user_id: int, metric_type: str, value: float = 1.0):
    record = AnalyticsRecord(
        user_id=user_id,
        metric_type=metric_type,
        value=value,
        record_date=datetime.now(timezone.utc)
    )
    db.add(record)
    db.commit()