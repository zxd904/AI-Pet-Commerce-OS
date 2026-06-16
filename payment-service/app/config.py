import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    EPAY_PID = os.getenv("EPAY_PID", "your_epay_pid")
    EPAY_KEY = os.getenv("EPAY_KEY", "your_epay_key")
    EPAY_API_URL = os.getenv("EPAY_API_URL", "https://pay.epay.com/mapi.php")
    NOTIFY_URL = os.getenv("NOTIFY_URL", "https://your-domain.com/api/payment/notify")
    RETURN_URL = os.getenv("RETURN_URL", "https://your-domain.com/payment/return")
    
    PLAN_PRICES = {
        "pro": 99.00,
        "enterprise": 299.00
    }

settings = Settings()