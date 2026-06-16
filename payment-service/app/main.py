from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import init_db, get_db
from payment import create_order, process_notify, get_order_status
from pydantic import BaseModel

app = FastAPI(title="SaaS支付模块", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

init_db()

class CreateOrderRequest(BaseModel):
    user_id: int
    plan: str
    pay_type: str = "alipay"

class OrderStatusRequest(BaseModel):
    order_no: str

@app.post("/api/order/create")
async def api_create_order(request: CreateOrderRequest, db: Session = Depends(get_db)):
    result = create_order(db, request.user_id, request.plan, request.pay_type)
    if result["success"]:
        return {
            "success": True,
            "order_no": result["order_no"],
            "pay_url": result["pay_url"],
            "amount": result["amount"],
            "plan": result["plan"]
        }
    else:
        return {"success": False, "error": result["error"]}, 400

@app.post("/api/payment/notify")
async def api_payment_notify(request: Request, db: Session = Depends(get_db)):
    form_data = await request.form()
    params = dict(form_data)
    
    result = process_notify(db, params)
    return result

@app.get("/api/order/status")
async def api_order_status(order_no: str, db: Session = Depends(get_db)):
    result = get_order_status(db, order_no)
    if result["success"]:
        return {
            "success": True,
            "order_no": result["order_no"],
            "status": result["status"],
            "plan": result["plan"],
            "amount": result["amount"]
        }
    else:
        return {"success": False, "error": result["error"]}, 404

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "service": "SaaS Payment Service"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)