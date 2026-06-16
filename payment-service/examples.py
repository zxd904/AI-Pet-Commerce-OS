import requests

BASE_URL = "http://localhost:8000"

def create_order_example():
    payload = {
        "user_id": 1,
        "plan": "pro",
        "pay_type": "alipay"
    }
    
    response = requests.post(f"{BASE_URL}/api/order/create", json=payload)
    print("创建订单响应:", response.json())

def get_order_status_example(order_no):
    response = requests.get(f"{BASE_URL}/api/order/status", params={"order_no": order_no})
    print("查询订单状态:", response.json())

def simulate_notify_example(order_no):
    notify_params = {
        "out_trade_no": order_no,
        "trade_status": "SUCCESS",
        "sign": "模拟签名",
        "sign_type": "MD5"
    }
    
    response = requests.post(f"{BASE_URL}/api/payment/notify", data=notify_params)
    print("支付回调响应:", response.text)

if __name__ == "__main__":
    print("=== 创建订单示例 ===")
    create_order_example()
    
    print("\n=== 查询订单状态示例 ===")
    get_order_status_example("ORD1123456789ABCDEF")
    
    print("\n=== 模拟支付回调示例 ===")
    simulate_notify_example("ORD1123456789ABCDEF")