from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime, timezone

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    phone = Column(String)
    role = Column(String, default="user")
    subscription_plan = Column(String, default="free")
    subscription_status = Column(String, default="inactive")
    stripe_customer_id = Column(String)
    stripe_subscription_id = Column(String)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    products = relationship("Product", back_populates="owner")
    selections = relationship("SelectionTask", back_populates="user")

class Product(Base):
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"))
    product_name = Column(String, nullable=False)
    score = Column(Float, default=0.0)
    decision = Column(String, default="NO")
    reason = Column(Text)
    title = Column(String)
    selling_points = Column(JSON)
    keywords = Column(JSON)
    video_script = Column(Text)
    price_suggestion = Column(Float)
    source = Column(String)
    source_url = Column(String)
    status = Column(String, default="draft")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    owner = relationship("User", back_populates="products")
    uploads = relationship("ProductUpload", back_populates="product")

class ProductUpload(Base):
    __tablename__ = "product_uploads"
    
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    platform = Column(String, nullable=False)
    platform_product_id = Column(String)
    status = Column(String, default="pending")
    response_data = Column(JSON)
    uploaded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    product = relationship("Product", back_populates="uploads")

class SelectionTask(Base):
    __tablename__ = "selection_tasks"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    keyword = Column(String, nullable=False)
    status = Column(String, default="pending")
    total_count = Column(Integer, default=0)
    success_count = Column(Integer, default=0)
    failed_count = Column(Integer, default=0)
    result_data = Column(JSON)
    started_at = Column(DateTime)
    completed_at = Column(DateTime)
    
    user = relationship("User", back_populates="selections")

class AnalyticsRecord(Base):
    __tablename__ = "analytics"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    metric_type = Column(String, nullable=False)
    value = Column(Float)
    record_date = Column(DateTime, default=lambda: datetime.now(timezone.utc))

engine = None
SessionLocal = None

def init_db(database_url: str = "sqlite:///./test.db"):
    global engine, SessionLocal
    engine = create_engine(database_url, connect_args={"check_same_thread": False})
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)
    return engine, SessionLocal

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()