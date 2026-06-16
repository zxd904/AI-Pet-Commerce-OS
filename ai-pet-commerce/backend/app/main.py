from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .api.auth import router as auth_router
from .api.products import router as products_router
from .api.dashboard import router as dashboard_router
from .api.analytics import router as analytics_router
from .api.billing import router as billing_router
from .models.database import init_db
from .config.settings import get_settings

settings = get_settings()
init_db(settings.DATABASE_URL)

app = FastAPI(title="AI Pet Commerce OS", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(products_router)
app.include_router(dashboard_router)
app.include_router(analytics_router)
app.include_router(billing_router)

@app.get("/")
async def root():
    return {"message": "Welcome to AI Pet Commerce OS"}

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "AI Pet Commerce OS"}