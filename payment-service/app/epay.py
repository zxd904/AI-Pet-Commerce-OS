import requests
import hashlib
import time
import random
from typing import Optional

class EpayClient:
    def __init__(self, pid: str, key: str, api_url: str = "https://pay.epay.com/mapi.php"):
        self.pid = pid
        self.key = key
        self.api_url = api_url

    def generate_sign(self, params: dict) -> str:
        sorted_params = sorted(params.items())
        sign_str = "&".join(f"{k}={v}" for k, v in sorted_params)
        sign_str += f"&key={self.key}"
        return hashlib.md5(sign_str.encode()).hexdigest().upper()

    def create_order(self, out_trade_no: str, money: float, name: str, notify_url: str, 
                     return_url: Optional[str] = None, pay_type: str = "alipay") -> dict:
        params = {
            "pid": self.pid,
            "type": pay_type,
            "out_trade_no": out_trade_no,
            "notify_url": notify_url,
            "return_url": return_url or notify_url,
            "name": name,
            "money": str(money)
        }
        params["sign"] = self.generate_sign(params)
        params["sign_type"] = "MD5"

        try:
            response = requests.post(self.api_url, data=params, timeout=30)
            response.raise_for_status()
            return {"success": True, "data": response.text}
        except requests.exceptions.RequestException as e:
            return {"success": False, "error": str(e)}

    def verify_notify(self, params: dict) -> bool:
        if "sign" not in params:
            return False
        
        sign = params.pop("sign")
        sign_type = params.pop("sign_type", None)
        
        calculated_sign = self.generate_sign(params)
        params["sign"] = sign
        if sign_type:
            params["sign_type"] = sign_type
        
        return calculated_sign == sign

    def query_order(self, out_trade_no: str) -> dict:
        params = {
            "pid": self.pid,
            "out_trade_no": out_trade_no,
            "act": "query"
        }
        params["sign"] = self.generate_sign(params)
        
        try:
            response = requests.post(self.api_url, data=params, timeout=30)
            response.raise_for_status()
            result = response.text
            
            if "success" in result.lower():
                return {"success": True, "status": "paid"}
            elif "fail" in result.lower():
                return {"success": True, "status": "failed"}
            else:
                return {"success": True, "status": "pending"}
        except requests.exceptions.RequestException as e:
            return {"success": False, "error": str(e)}