from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..models.database import get_db, User, Product, ProductUpload
from ..schemas.schemas import ProductSelectRequest, ProductAnalyzeRequest, ProductGenerateRequest, ProductUploadRequest, ProductResponse
from ..services.ai_service import analyze_product, analyze_products_batch, generate_content
from ..api.auth import get_current_user
from ..services.subscription_service import check_limit, record_analytics
from datetime import datetime, timezone

router = APIRouter(prefix="/api/products", tags=["products"])

PET_KEYWORDS = [
    "智能猫砂盆", "自动喂食器", "宠物饮水机", "智能逗猫器", 
    "宠物监控摄像头", "智能宠物项圈", "宠物空气净化器", "宠物烘干箱",
    "猫玩具", "狗玩具", "宠物床", "宠物背包",
    "宠物美容工具", "宠物GPS定位器", "宠物训练用品"
]

@router.post("/select")
async def select_products(request: ProductSelectRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not check_limit(db, current_user.id, "selections"):
        raise HTTPException(status_code=403, detail="今日选品次数已用完，请升级套餐")
    
    keyword = request.keyword
    count = min(request.count, 20)
    
    related_products = [p for p in PET_KEYWORDS if keyword.lower() in p.lower() or p.lower() in keyword.lower()]
    if not related_products:
        related_products = PET_KEYWORDS[:count]
    
    results = await analyze_products_batch(related_products[:count])
    
    saved_products = []
    for result in results:
        product = Product(
            owner_id=current_user.id,
            product_name=result.product_name,
            score=result.score,
            decision=result.decision,
            reason=result.reason,
            title=result.title,
            selling_points=result.selling_points,
            keywords=result.keywords,
            video_script=result.video_script,
            price_suggestion=result.price_suggestion,
            status="draft"
        )
        db.add(product)
        db.commit()
        db.refresh(product)
        saved_products.append(product)
        record_analytics(db, current_user.id, "selection")
    
    return {"success": True, "data": [ProductResponse.from_orm(p) for p in saved_products]}

@router.post("/analyze")
async def analyze_product_api(request: ProductAnalyzeRequest, current_user: User = Depends(get_current_user)):
    result = await analyze_product(request.product_name)
    return {"success": True, "data": result.to_dict()}

@router.post("/generate")
async def generate_content_api(request: ProductGenerateRequest):
    results = {}
    for content_type in request.content_types:
        content = await generate_content(request.product_name, content_type)
        results[content_type] = content
    return {"success": True, "data": results}

@router.post("/upload")
async def upload_product(request: ProductUploadRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    product = db.query(Product).filter(Product.id == request.product_id, Product.owner_id == current_user.id).first()
    if not product:
        raise HTTPException(status_code=404, detail="商品不存在")
    
    platforms = ["taobao", "pinduoduo", "douyin", "xiaohongshu"]
    if request.platform not in platforms:
        raise HTTPException(status_code=400, detail="不支持的平台")
    
    mock_response = {
        "platform": request.platform,
        "product_id": f"{request.platform}_{request.product_id}_{datetime.now().timestamp()}",
        "status": "success",
        "message": f"商品已成功上传到{request.platform}"
    }
    
    upload_record = ProductUpload(
        product_id=request.product_id,
        platform=request.platform,
        platform_product_id=mock_response["product_id"],
        status="success",
        response_data=mock_response
    )
    db.add(upload_record)
    db.commit()
    
    product.status = "uploaded"
    db.commit()
    
    return {"success": True, "data": mock_response}

@router.get("/list")
async def get_products(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    products = db.query(Product).filter(Product.owner_id == current_user.id).order_by(Product.created_at.desc()).all()
    return {"success": True, "data": [ProductResponse.from_orm(p) for p in products]}

@router.get("/{product_id}")
async def get_product(product_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    product = db.query(Product).filter(Product.id == product_id, Product.owner_id == current_user.id).first()
    if not product:
        raise HTTPException(status_code=404, detail="商品不存在")
    return {"success": True, "data": ProductResponse.from_orm(product)}

@router.delete("/{product_id}")
async def delete_product(product_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    product = db.query(Product).filter(Product.id == product_id, Product.owner_id == current_user.id).first()
    if not product:
        raise HTTPException(status_code=404, detail="商品不存在")
    
    db.delete(product)
    db.commit()
    return {"success": True, "message": "商品已删除"}