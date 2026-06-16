import { MODEL_CONFIG } from '../config/model.js';

export interface OllamaResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

export interface ProductAnalysis {
  product_name: string;
  pain_point: string;
  selling_points: string[];
  viral_score: number;
  target_users: string;
  recommendation: string;
}

export interface ContentGeneration {
  douyin_script: string;
  xiaohongshu_post: string;
  live_script: string;
  ad_titles: string[];
}

const SYSTEM_PROMPT = `你是一个电商选品AI专家，专注宠物智能用品。

你必须基于真实逻辑分析：
- 用户痛点强度（30%权重）
- 冲动消费能力（20%权重）
- 视频传播能力（20%权重）
- 利润空间（15%权重）
- 竞争难度（15%权重）

评分规则：
- 90-100分：强烈推荐
- 75-89分：推荐
- 60-74分：观察
- 60分以下：不推荐

输出必须为严格JSON格式，禁止输出任何解释文本：
{
  "product_name": "",
  "pain_point": "",
  "selling_points": ["卖点1", "卖点2", "卖点3"],
  "viral_score": 95,
  "target_users": "",
  "recommendation": "推荐"
}`;

const CONTENT_PROMPT = `你是一名宠物智能用品电商内容创作专家。

请为产品生成以下电商内容，输出严格JSON格式：
{
  "douyin_script": "15-30秒抖音脚本，包含镜头描述和台词",
  "xiaohongshu_post": "小红书种草文案，使用emoji，口语化风格",
  "live_script": "60秒直播话术",
  "ad_titles": ["广告标题1", "广告标题2", "广告标题3"]
}`;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  const timeoutPromise = new Promise<T>((_, reject) => {
    setTimeout(() => reject(new Error(`请求超时 (${ms}ms)`)), ms);
  });
  return Promise.race([promise, timeoutPromise]);
}

export async function generateAIResponse(prompt: string, systemPrompt?: string): Promise<string> {
  const { baseUrl, model, timeout } = MODEL_CONFIG;
  
  const body = {
    model,
    prompt: systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt,
    stream: false,
    options: {
      num_ctx: 4096,
      num_predict: 2048,
      temperature: 0.7,
      timeout: timeout / 1000
    }
  };

  try {
    const response = await withTimeout(fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    }), timeout);

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const data: OllamaResponse = await response.json();
    return data.response.trim();
  } catch (error) {
    console.error('Ollama API调用失败:', error);
    throw error;
  }
}

export async function analyzeProduct(productName: string): Promise<ProductAnalysis> {
  try {
    const prompt = `请分析产品：${productName}`;
    const response = await generateAIResponse(prompt, SYSTEM_PROMPT);
    
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      console.log(`✅ Ollama分析成功: ${productName} (得分: ${result.viral_score})`);
      return result;
    }
    
    throw new Error('无法解析JSON响应');
  } catch (error) {
    console.error(`❌ Ollama分析失败，使用fallback数据: ${productName}`);
    return generateFallbackAnalysis(productName);
  }
}

export async function generateContent(productName: string): Promise<ContentGeneration> {
  try {
    const prompt = `请为产品"${productName}"生成电商内容`;
    const response = await generateAIResponse(prompt, CONTENT_PROMPT);
    
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      console.log(`✅ Ollama内容生成成功: ${productName}`);
      return result;
    }
    
    throw new Error('无法解析JSON响应');
  } catch (error) {
    console.error(`❌ Ollama内容生成失败，使用fallback数据: ${productName}`);
    return generateFallbackContent(productName);
  }
}

export async function analyzeProductsBatch(productNames: string[]): Promise<ProductAnalysis[]> {
  const results: ProductAnalysis[] = [];
  for (const name of productNames) {
    try {
      const result = await analyzeProduct(name);
      results.push(result);
    } catch (error) {
      console.error(`❌ 分析产品失败 ${name}:`, error);
      results.push(generateFallbackAnalysis(name));
    }
  }
  return results;
}

export async function isOllamaAvailable(): Promise<boolean> {
  try {
    const response = await fetch(`${MODEL_CONFIG.baseUrl}/api/tags`, {
      method: 'GET'
    });
    return response.ok;
  } catch {
    return false;
  }
}

function generateFallbackAnalysis(productName: string): ProductAnalysis {
  const viralScore = Math.floor(Math.random() * 30) + 70;
  const recommendations = ['强烈推荐', '推荐', '观察'];
  const recommendation = viralScore >= 90 ? recommendations[0] : viralScore >= 75 ? recommendations[1] : recommendations[2];
  
  return {
    product_name: productName,
    pain_point: `解决${productName}的核心痛点，提升宠物生活品质`,
    selling_points: [
      '智能控制，一键操作',
      '高品质材料，安全可靠',
      '宠物喜爱，主人省心'
    ],
    viral_score: viralScore,
    target_users: '养宠家庭，宠物爱好者',
    recommendation
  };
}

function generateFallbackContent(productName: string): ContentGeneration {
  return {
    douyin_script: `【镜头1】展示${productName}外观\n【镜头2】演示使用方法\n【镜头3】宠物使用场景\n【台词】家人们，这个${productName}真的太好用了！`,
    xiaohongshu_post: `谁懂啊！这个${productName}真的绝了✨\n\n养宠家庭必备神器！\n一键开启智能养宠模式\n再也不用担心宠物没人照顾啦~\n\n#宠物用品 #智能养宠 #萌宠好物`,
    live_script: `宝宝们！今天给大家带来这款超级好用的${productName}！\n大家看，它的设计非常精美，功能也很强大...`,
    ad_titles: [
      `${productName} - 宠物的智能伙伴`,
      `告别传统！${productName}全新体验`,
      `${productName} - 养宠必备神器`
    ]
  };
}