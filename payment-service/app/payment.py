import time
import random
from sqlalchemy.orm import Session
from models import Order, User
from epay import EpayClient
from config import settings

client = EpayClient(
    pid=settings.EPAY_PID,
    key=settings.EPAY_KEY,
    api_url=settings.EPAY_API_URL
)

PLAN_NAMES = {
    "pro": "专业版会员",
    "enterprise": "企业版会员"
}

def generate_order_no(user_id: int) -> str:
    timestamp = int(time.time())
    rand_str = ''.join(random.choices('0123456789ABCDEF', k=8))
    return f"ORD{user_id}{timestamp}{rand_str}"

def create_order(db: Session, user_id: int, plan: str, pay_type: str = "alipay") -> dict:
    if plan not in settings.PLAN_PRICES:
        return {"success": False, "error": "无效的套餐"}
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return {"success": False, "error": "用户不存在"}
    
    order_no = generate_order_no(user_id)
    amount = settings.PLAN_PRICES[plan]
    plan_name = PLAN_NAMES.get(plan, plan)
    
    new_order = Order(
        user_id=user_id,
        order_no=order_no,
        plan=plan,
        amount=amount,
        pay_type=pay_type,
        status="pending"
    )
    db.add(new_order)
    db.commit()
    db.refresh(new_order)
    
    notify_url = f"{settings.NOTIFY_URL}?order_no={order_no}"
    
    result = client.create_order(
        out_trade_no=order_no,
        money=amount,
        name=plan_name,
        notify_url=notify_url,
        return_url=settings.RETURN_URL,
        pay_type=pay_type
    )
    
    if result["success"]:
        return {
            "success": True,
            "order_no": order_no,
            "pay_url": result["data"],
            "amount": amount,
            "plan": plan
        }
    else:
        return {"success": False, "error": result["error"]}

def process_notify(db: Session, params: dict) -> str:
    if not client.verify_notify(params):
        return "fail"
    
    out_trade_no = params.get("out_trade_no")
    if not out_trade_no:
        return "fail"
    
    order = db.query(Order).filter(Order.order_no == out_trade_no).first()
    if not order:
        return "fail"
    
    if order.status == "paid":
        return "success"
    
    if order.notify_times >= 3:
        return "fail"
    
    trade_status = params.get("trade_status", "").lower()
    if trade_status != "success":
        order.status = "failed"
        order.notify_times += 1
        db.commit()
        return "fail"
    
    order.status = "paid"
    order.notify_times += 1
    order.paid_at = time.strftime("%Y-%m-%d %H:%M:%S")
    db.commit()
    
    upgrade_user_plan(db, order.user_id, order.plan)
    
    return "success"

def upgrade_user_plan(db: Session, user_id: int, plan: str):
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        user.plan = plan
        db.commit()

def get_order_status(db: Session, order_no: str) -> dict:
    order = db.query(Order).filter(Order.order_no == order_no).first()
    if not order:
        return {"success": False, "error": "订单不存在"}
    
    return {
        "success": True,
        "order_no": order.order_no,
        "status": order.status,
        "plan": order.plan,
        "amount": order.amount,
        "created_at": order.created_at.isoformat() if order.created_at else None
    }