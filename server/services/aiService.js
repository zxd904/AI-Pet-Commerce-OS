import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

// DeepSeek API 配置
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = 'https://api.deepseek.com';

const deepseek = new OpenAI({
  apiKey: DEEPSEEK_API_KEY,
  baseURL: DEEPSEEK_API_URL
});

const SYSTEM_PROMPT = `你是"宠物智能用品电商选品AI系统"，一个专业的宠物用品电商选品专家。

你的职责：
1. 生成爆款宠物智能用品候选产品
2. 评估产品的爆款潜力（0-100分）
3. 输出结构化的JSON数据
4. 偏向抖音/小红书电商逻辑
5. 强调冲动消费 + 懒人经济 + 情绪价值

评分标准（总分100分）：
- 痛点强度：30%（目标用户痛点是否强烈）
- 冲动消费能力：20%（是否让人想立刻下单）
- 视频传播性：20%（是否适合短视频展示）
- 利润空间：15%（是否有足够利润空间）
- 竞争难度：15%（是否避免过度竞争）

推荐等级：
- 90-100分：强烈推荐
- 75-89分：推荐
- 60-74分：观察
- 60分以下：不推荐

请根据用户输入的关键词，生成5-8个爆款候选产品，每个产品包含：
1. product_name: 产品名称
2. core_pain_point: 核心痛点
3. selling_points: 3个爆款卖点（数组）
4. viral_score: 爆款评分（0-100整数）
5. target_users: 目标人群描述
6. recommendation: 推荐等级（强烈推荐/推荐/观察/不推荐）

同时输出TOP3排名，每项包含：
1. product_name: 产品名称
2. score: 评分
3. reason: 推荐理由

注意：所有输出必须是合法的JSON格式，不要包含任何非JSON内容。`;

export async function generateProducts(keyword) {
  const userPrompt = `请为"${keyword}"生成宠物智能用品爆款选品分析。`;

  // 如果没有配置DeepSeek API Key，使用模拟数据
  if (!DEEPSEEK_API_KEY) {
    return generateMockData(keyword);
  }

  try {
    const response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.8,
      max_tokens: 4000
    });

    const content = response.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return result;
    }

    throw new Error('无法解析AI返回的JSON数据');
  } catch (error) {
    console.error('DeepSeek API Error:', error.message);
    return generateMockData(keyword);
  }
}

export async function generateProductDetail(keyword, productName) {
  const userPrompt = `请为"${productName}"（搜索关键词：${keyword}）生成详细的电商内容，包括：
1. 抖音短视频脚本（15-30秒，3-5个镜头）
2. 小红书种草文案（种草风格，包含emoji）
3. 爆款标题3个
4. 推荐售价区间
5. 转化策略（情绪/痛点/懒人经济角度）

请以JSON格式输出，包含以下字段：
{
  "douyin_script": {
    "title": "视频标题",
    "scenes": ["镜头1描述", "镜头2描述", ...]
  },
  "xiaohongshu_content": "种草文案内容",
  "viral_titles": ["标题1", "标题2", "标题3"],
  "price_range": "价格区间",
  "conversion_strategy": {
    "emotion": "情绪价值策略",
    "pain_point": "痛点营销策略",
    "lazy_economy": "懒人经济策略"
  }
}`;

  if (!DEEPSEEK_API_KEY) {
    return generateMockDetail(productName);
  }

  try {
    const response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.8,
      max_tokens: 3000
    });

    const content = response.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    throw new Error('无法解析AI返回的JSON数据');
  } catch (error) {
    console.error('DeepSeek API Error:', error.message);
    return generateMockDetail(productName);
  }
}

function generateMockData(keyword) {
  const mockProducts = {
    '自动猫砂盆': [
      {
        product_name: '全自动智能猫砂盆Pro',
        core_pain_point: '每天清理猫砂又脏又累，异味难忍',
        selling_points: ['APP实时监测如厕数据，猫咪健康一目了然', '自动打包除臭，7天不用倒垃圾', '多猫识别技术，精准记录每只猫数据'],
        viral_score: 95,
        target_users: '都市白领、经常出差的爱猫人士',
        recommendation: '强烈推荐'
      },
      {
        product_name: '便携式自动铲屎机',
        core_pain_point: '出差旅游猫咪独自在家，猫砂盆太脏',
        selling_points: ['超长续航，充一次电用30天', '折叠便携设计，旅行携带方便', '静音设计，不打扰邻里'],
        viral_score: 88,
        target_users: '爱旅游的猫主人、经常出差人群',
        recommendation: '推荐'
      },
      {
        product_name: '抗菌除臭智能猫厕所',
        core_pain_point: '普通猫砂盆细菌滋生，影响猫咪健康',
        selling_points: ['UVC紫外线杀菌，除菌率99.9%', '智能通风系统，彻底除臭', '一键清仓，清洁无忧'],
        viral_score: 82,
        target_users: '注重猫咪健康的精致养猫人',
        recommendation: '推荐'
      },
      {
        product_name: 'AI语音互动猫砂盆',
        core_pain_point: '猫咪独自在家太孤单，想要互动',
        selling_points: ['AI语音陪聊，猫咪不孤单', '自动记录如厕时间，异常提醒', '时尚外观设计，家居百搭'],
        viral_score: 76,
        target_users: '单身独居人群、情感需求强的铲屎官',
        recommendation: '观察'
      },
      {
        product_name: '入门级自动猫砂盆',
        core_pain_point: '想入手自动猫砂盆但价格太贵',
        selling_points: ['性价比之王，功能齐全', '简单易操作，老人家也能用', '体积小巧，适合小户型'],
        viral_score: 72,
        target_users: '预算有限的养猫新手、小户型家庭',
        recommendation: '观察'
      }
    ],
    '宠物喂食器': [
      {
        product_name: 'AI智能定量喂食器',
        core_pain_point: '不知道每次该喂多少，容易过度喂养',
        selling_points: ['AI算法自动计算食量，科学喂养', 'APP远程投喂，随时随地互动', '双摄像头设计，实时查看进食'],
        viral_score: 93,
        target_users: '新手铲屎官、注重科学喂养的人群',
        recommendation: '强烈推荐'
      },
      {
        product_name: '冻干自动投放机',
        core_pain_point: '普通猫粮没营养，冻干喂养太麻烦',
        selling_points: ['冻干仓独立存储，保持新鲜', '定时定量投放，懒人必备', '支持多种冻干尺寸'],
        viral_score: 89,
        target_users: '追求高品质喂养的精致铲屎官',
        recommendation: '推荐'
      },
      {
        product_name: '饮水喂食一体机',
        core_pain_point: '猫咪不爱喝水，泌尿问题频发',
        selling_points: ['流动活水设计，猫咪更爱喝', '净水过滤系统，保证饮水健康', '容量大，满足多猫家庭'],
        viral_score: 86,
        target_users: '有饮水问题的猫咪主人、多猫家庭',
        recommendation: '推荐'
      },
      {
        product_name: '智能分量喂食碗',
        core_pain_point: '猫咪抢食导致部分猫咪吃不饱',
        selling_points: ['分量控制，避免抢食', '每只猫独立碗，公平喂养', '剩余量检测，提醒添粮'],
        viral_score: 78,
        target_users: '多猫家庭、争抢食物的猫咪主人',
        recommendation: '观察'
      },
      {
        product_name: '定时自动投喂器',
        core_pain_point: '上班忙，无法准时给猫咪喂饭',
        selling_points: ['定时投喂，规律饮食', '简单的旋钮操作', '价格实惠入门级'],
        viral_score: 70,
        target_users: '上班族、预算有限的人群',
        recommendation: '观察'
      }
    ]
  };

  const products = mockProducts[keyword] || mockProducts['自动猫砂盆'];

  return {
    products: products,
    ranking: products.slice(0, 3).map((p, i) => ({
      product_name: p.product_name,
      score: p.viral_score,
      reason: `TOP${i + 1}推荐：${p.core_pain_point}，${p.selling_points[0]}`
    }))
  };
}

function generateMockDetail(productName) {
  return {
    douyin_script: {
      title: `救命！这个${productName}也太好用了吧！`,
      scenes: [
        '开场：展示猫咪可爱的样子，配文"每天被猫叫醒？比你闹钟还准⏰"',
        '痛点引入：展示传统方式的麻烦，"以前每次出差都要担心它在家吃不好..."',
        '产品展示：炫酷的产品外观，"自从用了这个神器！彻底解放双手✨"',
        '功能演示：快速展示核心功能镜头',
        '结尾：猫咪满足的表情，"主子开心，我也开心～"'
      ]
    },
    xiaohongshu_content: `🐱养猫5年！用过最好用的神器就是它！！

作为资深铲屎官🙋‍♀️
之前每次出差都要担心毛孩子在家吃不好喝不好
直到我发现了这个宝藏产品！！

✅彻底解放双手
✅APP实时监测
✅主子比我还喜欢

真的后悔没有早点入手😭
现在每天上班完全不用操心
室友都说我养猫后整个人轻松多了哈哈

📦已购入的姐妹快来评论区集合！
还有什么神器推荐吗🥺

#养猫好物 #智能养猫 #猫奴必备 #宠物神器 #懒人养猫`,
    viral_titles: [
      `救！😭我怎么没早点发现这个养猫神器！`,
      `室友以为我偷偷请了保姆！其实是因为它...`,
      `猫咪比我还喜欢！用了再也回不去了😭`
    ],
    price_range: '299-599元',
    conversion_strategy: {
      emotion: '通过展示"猫咪享受+主人省心"的画面，激发用户的情感共鸣和分享欲',
      pain_point: '针对"工作忙/经常出差/多猫家庭"的场景痛点，强调"不再担心"的解决方案',
      lazy_economy: '突出"一次投资，长期省心"的价值主张，符合懒人经济趋势'
    }
  };
}
