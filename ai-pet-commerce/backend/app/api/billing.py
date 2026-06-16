from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..models.database import get_db, User
from ..api.auth import get_current_user
from ..services.subscription_service import upgrade_subscription, downgrade_subscription, PLANS
from ..schemas.schemas import SubscriptionRequest

router = APIRouter(prefix="/api/billing", tags=["billing"])

@router.get("/plans")
async def get_plans():
    return {"success": True, "data": PLANS}

@router.post("/subscribe")
async def subscribe(request: SubscriptionRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if request.plan not in PLANS:
        raise HTTPException(status_code=400, detail="无效的套餐")
    
    if request.plan == "free":
        downgrade_subscription(db, current_user.id)
        return {"success": True, "message": "已切换到免费版"}
    
    if request.plan in ["pro", "business"]:
        upgrade_subscription(db, current_user.id, request.plan)
        return {"success": True, "message": f"已升级到{PLANS[request.plan]['name']}"}
    
    return {"success": False, "message": "操作失败"}

@router.get("/status")
async def get_subscription_status(current_user: User = Depends(get_current_user)):
    return {
        "success": True,
        "data": {
            "plan": current_user.subscription_plan,
            "status": current_user.subscription_status,
            "details": PLANS.get(current_user.subscription_plan, PLANS["free"])
        }
    }