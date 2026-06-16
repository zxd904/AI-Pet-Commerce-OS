// AI Agent决策层 - 基于Qwen2.5-14B的Tool Calling系统
import { MODEL_CONFIG } from '../config/model.js';
import { ProductDataSource, calculateProfitMargin } from './dataSourceService.js';

// 工具定义
export interface Tool {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

export interface ToolCall {
  tool: string;
  arguments: Record<string, any>;
}

export interface ProductDecision {
  product_id: string;
  score: number;
  level: 'A' | 'B' | 'C';
  decision: 'LIST' | 'WATCH' | 'REJECT';
  reason: string;
  recommended_price: number;
  expected_profit_margin: number;
  scores: {
    market_heat: number;
    profit_space: number;
    competition: number;
    growth_trend: number;
    supply_stability: number;
  };
}

// 可用工具列表
export const AVAILABLE_TOOLS: Tool[] = [
  {
    name: 'create_product',
    description: '创建商品草稿，保存到数据库',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: '商品标题' },
        description: { type: 'string', description: '商品描述' },
        images: { type: 'array', items: { type: 'string' }, description: '图片URL列表' },
        price: { type: 'number', description: '售价' },
        cost: { type: 'number', description: '成本' },
        tags: { type: 'array', items: { type: 'string' }, description: '标签' }
      },
      required: ['title', 'price']
    }
  },
  {
    name: 'publish_shopify_product',
    description: '将商品上架到Shopify店铺',
    parameters: {
      type: 'object',
      properties: {
        product_id: { type: 'number', description: '商品ID' },
        shopify_store_id: { type: 'string', description: 'Shopify店铺ID' }
      },
      required: ['product_id']
    }
  },
  {
    name: 'fetch_supplier_data',
    description: '获取供应商/1688价格数据',
    parameters: {
      type: 'object',
      properties: {
        product_name: { type: 'string', description: '产品名称' }
      },
      required: ['product_name']
    }
  },
  {
    name: 'generate_marketing_content',
    description: '生成营销内容：TikTok文案、小红书文案、SEO标题',
    parameters: {
      type: 'object',
      properties: {
        product_name: { type: 'string', description: '产品名称' },
        platform: { type: 'string', enum: ['tiktok', 'xiaohongshu', 'seo'], description: '平台' }
      },
      required: ['product_name', 'platform']
    }
  },
  {
    name: 'update_product_price',
    description: '动态调整商品价格',
    parameters: {
      type: 'object',
      properties: {
        product_id: { type: 'number', description: '商品ID' },
        new_price: { type: 'number', description: '新价格' }
      },
      required: ['product_id', 'new_price']
    }
  }
];

// AI评分系统Prompt
const SCORING_SYSTEM_PROMPT = `你是一个专业的电商选品AI专家，专注于宠物智能用品领域。

你的任务是对商品进行综合评分，帮助决策是否上架。

评分维度与权重：
1. 市场热度（30%）- 销量、评分、评论数
2. 利润空间（25%）- 售价与成本差
3. 竞争程度（20%）- 评论数越少竞争越小
4. 增长趋势（15%）- 评分趋势
5. 供应链稳定性（10%）- 供应商可靠性

评分等级：
- A级（85-100分）：强烈推荐上架
- B级（70-84分）：观察，可考虑上架
- C级（<70分）：不推荐上架

决策规则：
- LIST: score >= 75 且 利润率 >= 20%
- WATCH: score >= 60 或 有潜力商品
- REJECT: score < 60 或 利润率 < 15%

你必须输出严格的JSON格式：
{
  "product_id": "唯一标识",
  "score": 0-100,
  "level": "A/B/C",
  "decision": "LIST/WATCH/REJECT",
  "reason": "简短理由",
  "recommended_price": 建议售价,
  "expected_profit_margin": 预期利润率,
  "scores": {
    "market_heat": 0-100,
    "profit_space": 0-100,
    "competition": 0-100,
    "growth_trend": 0-100,
    "supply_stability": 0-100
  }
}

禁止输出任何解释文本，只输出JSON。`;

// 调用Ollama API
async function callOllama(prompt: string, systemPrompt?: string): Promise<string> {
  const { baseUrl, model, timeout } = MODEL_CONFIG;

  const body = {
    model,
    prompt: systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt,
    stream: false,
    options: {
      num_ctx: 8192,
      num_predict: 2048,
      temperature: 0.3
    }
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const data = await response.json();
    return data.response.trim();
  } catch (error) {
    console.error('Ollama API调用失败:', error);
    throw error;
  }
}

// AI评分函数
export async function scoreProduct(product: ProductDataSource): Promise<ProductDecision> {
  const prompt = `请对以下商品进行评分分析：

商品信息：
- 标题: ${product.title}
- 售价: $${product.price}
- 成本: $${product.supplier_price}
- 运费: $${product.shipping_cost}
- 销量: ${product.sales_volume}
- 评分: ${product.rating}
- 评论数: ${product.review_count}
- 分类: ${product.category}
- 来源: ${product.source}

请输出评分JSON。`;

  try {
    const response = await callOllama(prompt, SCORING_SYSTEM_PROMPT);
    const jsonMatch = response.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const decision = JSON.parse(jsonMatch[0]) as ProductDecision;
      console.log(`✅ AI评分完成: ${product.title.substring(0, 30)}... 得分: ${decision.score}`);
      return decision;
    }

    throw new Error('无法解析AI响应');
  } catch (error) {
    console.error(`❌ AI评分失败: ${product.title}`);
    // 返回默认评分
    return generateFallbackDecision(product);
  }
}

// 批量评分
export async function scoreProductsBatch(products: ProductDataSource[]): Promise<ProductDecision[]> {
  console.log(`🔄 开始对 ${products.length} 个商品进行AI评分...`);
  const decisions: ProductDecision[] = [];

  for (const product of products) {
    const decision = await scoreProduct(product);
    decisions.push(decision);
  }

  console.log(`✅ 完成评分，共 ${decisions.length} 个商品`);
  return decisions;
}

// Tool Calling - 解析AI工具调用意图
export async function parseToolCall(userIntent: string): Promise<ToolCall | null> {
  const toolPrompt = `用户意图: ${userIntent}

可用工具:
${AVAILABLE_TOOLS.map(t => `- ${t.name}: ${t.description}`).join('\n')}

请分析用户意图，选择合适的工具并提取参数。输出JSON格式：
{
  "tool": "工具名称",
  "arguments": { 参数对象 }
}

如果不需要调用工具，输出: { "tool": "none" }`;

  try {
    const response = await callOllama(toolPrompt);
    const jsonMatch = response.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const toolCall = JSON.parse(jsonMatch[0]) as ToolCall;
      if (toolCall.tool === 'none') return null;
      return toolCall;
    }

    return null;
  } catch (error) {
    console.error('工具调用解析失败:', error);
    return null;
  }
}

// 生成营销内容
export async function generateMarketingContent(
  productName: string,
  platform: 'tiktok' | 'xiaohongshu' | 'seo'
): Promise<string> {
  const platformPrompts = {
    tiktok: '生成一个15-30秒的TikTok短视频脚本，包含镜头描述和台词，要有病毒传播潜力。',
    xiaohongshu: '生成小红书种草文案，使用emoji，口语化风格，要有种草感和购买冲动。',
    seo: '生成3个SEO优化的商品标题，包含高搜索量关键词，适合电商搜索排名。'
  };

  const prompt = `产品: ${productName}

${platformPrompts[platform]}`;

  try {
    const response = await callOllama(prompt);
    console.log(`✅ 生成${platform}营销内容: ${productName}`);
    return response;
  } catch (error) {
    console.error('营销内容生成失败:', error);
    return '';
  }
}

// 生成商品描述
export async function generateProductDescription(product: ProductDataSource): Promise<string> {
  const prompt = `为以下宠物用品生成专业的电商商品描述：

产品: ${product.title}
分类: ${product.category}
价格: $${product.price}

要求：
1. 突出产品核心卖点
2. 解决用户痛点
3. 包含使用场景
4. SEO友好
5. 200-300字`;

  try {
    const response = await callOllama(prompt);
    return response;
  } catch (error) {
    console.error('商品描述生成失败:', error);
    return product.title;
  }
}

// Fallback决策（当AI不可用时）
function generateFallbackDecision(product: ProductDataSource): ProductDecision {
  const profitMargin = calculateProfitMargin(
    product.price,
    product.supplier_price,
    product.shipping_cost
  );

  // 简单评分逻辑
  let score = 50;
  score += product.rating >= 4.5 ? 15 : product.rating >= 4.0 ? 10 : 0;
  score += profitMargin >= 30 ? 15 : profitMargin >= 20 ? 10 : 0;
  score += product.sales_volume >= 10000 ? 10 : product.sales_volume >= 5000 ? 5 : 0;
  score += product.review_count < 5000 ? 10 : product.review_count < 10000 ? 5 : 0;

  const level = score >= 85 ? 'A' : score >= 70 ? 'B' : 'C';
  const decision = score >= 75 && profitMargin >= 20 ? 'LIST' : score >= 60 ? 'WATCH' : 'REJECT';

  return {
    product_id: `prod_${Date.now()}`,
    score,
    level,
    decision,
    reason: `基于规则评分：评分${product.rating}，利润率${profitMargin}%，销量${product.sales_volume}`,
    recommended_price: product.price,
    expected_profit_margin: profitMargin,
    scores: {
      market_heat: product.sales_volume >= 10000 ? 80 : 60,
      profit_space: profitMargin >= 30 ? 85 : profitMargin >= 20 ? 70 : 50,
      competition: product.review_count < 5000 ? 80 : 60,
      growth_trend: 70,
      supply_stability: 65
    }
  };
}
