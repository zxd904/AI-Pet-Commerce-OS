import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRouter from './routes/api.js';
import agentRouter from './routes/agentRoutes.js';
import authRouter from './routes/auth.js';
import billingRouter from './routes/billing.js';
import { runSelection, generateAllContent, startCronJob } from './services/selectionEngine.js';
import { MODEL_CONFIG } from './config/model.js';
import { initDouyinService } from './services/douyinService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

if (process.env.DOUYIN_APP_ID && process.env.DOUYIN_APP_SECRET) {
  initDouyinService({
    appId: process.env.DOUYIN_APP_ID,
    appSecret: process.env.DOUYIN_APP_SECRET,
    shopId: process.env.DOUYIN_SHOP_ID
  });
  console.log('✅ 抖音小店API已配置');
} else {
  console.log('⚠️ 抖音小店API未配置，上架功能将使用模拟模式');
}

app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.use('/api/auth', authRouter);
app.use('/api/billing', billingRouter);
app.use('/api', apiRouter);
app.use('/agent', agentRouter);

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'AI宠物选品系统运行正常',
    aiProvider: MODEL_CONFIG.provider,
    aiModel: MODEL_CONFIG.model,
    features: ['auto-selection', 'auto-listing', 'tool-calling', 'user-auth', 'subscription']
  });
});

async function startServer() {
  app.listen(PORT, () => {
    console.log(`🚀 AI宠物选品系统运行在 http://localhost:${PORT}`);
    console.log(`🤖 AI引擎: ${MODEL_CONFIG.provider} (${MODEL_CONFIG.model})`);
    console.log(`📍 Ollama地址: ${MODEL_CONFIG.baseUrl}`);
    console.log(`🔧 功能模块: 用户认证 + 订阅付费 + 自动选品 + 自动上架 + Tool Calling`);
  });

  startCronJob();
  
  setTimeout(async () => {
    console.log('🔄 开始执行自动选品任务...');
    await runSelection();
    await generateAllContent();
    console.log('✅ 自动选品任务完成');
  }, 1000);
}

startServer();