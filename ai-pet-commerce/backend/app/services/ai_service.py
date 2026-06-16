import json
import re
import httpx
from typing import Dict, Any, List
from ..config.settings import get_settings

settings = get_settings()

class ProductAnalysisResult:
    product_name: str
    score: float
    decision: str
    reason: str
    title: str
    selling_points: List[str]
    keywords: List[str]
    video_script: str
    price_suggestion: float

    def __init__(self, data: Dict[str, Any]):
        self.product_name = data.get("product_name", "")
        self.score = data.get("score", 0.0)
        self.decision = data.get("decision", "NO")
        self.reason = data.get("reason", "")
        self.title = data.get("title", "")
        self.selling_points = data.get("selling_points", [])
        self.keywords = data.get("keywords", [])
        self.video_script = data.get("video_script", "")
        self.price_suggestion = data.get("price_suggestion", 0.0)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "product_name": self.product_name,
            "score": self.score,
            "decision": self.decision,
            "reason": self.reason,
            "title": self.title,
            "selling_points": self.selling_points,
            "keywords": self.keywords,
            "video_script": self.video_script,
            "price_suggestion": self.price_suggestion
        }

SELECTION_PROMPT = """
你是一个专业的电商选品AI专家，专注于宠物用品领域。

请对商品进行综合评分分析，输出严格的JSON格式：

评分规则（0-100分）：
1. 市场热度（30%）：销量、评价数量、趋势增长
2. 利润空间（25%）：价格与成本的差距
3. 竞争程度（20%）：同类商品数量、头部品牌集中度
4. 产品质量（15%）：用户评价、差评率
5. 合规风险（10%）：资质要求、侵权风险

决策规则：
- score >= 75: YES（强烈推荐上架）
- 60 <= score < 75: YES（可以上架，需优化）
- score < 60: NO（不推荐上架）

输出JSON格式：
{
  "product_name": "商品名称",
  "score": 85,
  "decision": "YES/NO",
  "reason": "评分理由",
  "title": "优化后的商品标题",
  "selling_points": ["卖点1", "卖点2", "卖点3"],
  "keywords": ["关键词1", "关键词2", "关键词3"],
  "video_script": "30秒短视频脚本",
  "price_suggestion": 99.99
}

禁止输出任何额外解释文本，只输出JSON。
"""

async def analyze_product(product_name: str) -> ProductAnalysisResult:
    prompt = f"{SELECTION_PROMPT}\n\n请分析商品：{product_name}"
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{settings.OLLAMA_BASE_URL}/api/generate",
                json={
                    "model": settings.OLLAMA_MODEL,
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "num_ctx": 4096,
                        "temperature": 0.3,
                        "num_predict": 2048
                    }
                },
                timeout=120
            )
            
            if response.status_code == 200:
                data = response.json()
                response_text = data.get("response", "")
                
                json_match = re.search(r"\{[\s\S]*\}", response_text)
                if json_match:
                    try:
                        result = json.loads(json_match.group())
                        return ProductAnalysisResult(result)
                    except json.JSONDecodeError:
                        pass
    except Exception as e:
        print(f"Ollama API调用失败: {e}")
    
    return generate_fallback_result(product_name)

async def analyze_products_batch(product_names: List[str]) -> List[ProductAnalysisResult]:
    results = []
    for name in product_names:
        result = await analyze_product(name)
        results.append(result)
    return results

def generate_fallback_result(product_name: str) -> ProductAnalysisResult:
    base_score = 70
    selling_points = [
        f"{product_name}，品质保证",
        "热销爆款，口碑之选",
        "宠物用品精选推荐",
        "安全材质，放心使用",
        "高性价比之选"
    ]
    
    keywords = [
        product_name,
        "宠物用品",
        "爆款推荐",
        "热销",
        "精选"
    ]
    
    video_script = f"""【开头3秒】展示{product_name}产品特写
【痛点引入】宠物主人的烦恼场景
【产品展示】{product_name}核心功能演示
【卖点强调】安全、方便、实用
【行动号召】立即购买，限时优惠"""
    
    return ProductAnalysisResult({
        "product_name": product_name,
        "score": base_score,
        "decision": "YES" if base_score >= 60 else "NO",
        "reason": "使用默认评分规则",
        "title": f"爆款{product_name} 宠物用品精选推荐",
        "selling_points": selling_points,
        "keywords": keywords,
        "video_script": video_script,
        "price_suggestion": 49.99
    })

async def generate_content(product_name: str, content_type: str) -> str:
    prompts = {
        "title": f"为商品'{product_name}'生成10个电商标题，包含热门关键词",
        "selling_points": f"为商品'{product_name}'生成5条核心卖点",
        "keywords": f"为商品'{product_name}'生成20个SEO关键词",
        "video_script": f"为商品'{product_name}'生成30秒抖音短视频脚本",
        "description": f"为商品'{product_name}'生成详细的商品描述（300字左右）"
    }
    
    prompt = prompts.get(content_type, f"为商品'{product_name}'生成{content_type}")
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{settings.OLLAMA_BASE_URL}/api/generate",
                json={
                    "model": settings.OLLAMA_MODEL,
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "num_ctx": 4096,
                        "temperature": 0.7
                    }
                },
                timeout=120
            )
            
            if response.status_code == 200:
                data = response.json()
                return data.get("response", "").strip()
    except Exception as e:
        print(f"内容生成失败: {e}")
    
    return f"为{product_name}生成的{content_type}内容"