import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import aiRouter from './routes/ai.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/ai', aiRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'AI Pet Products Selection API is running' });
});

app.listen(PORT, () => {
  console.log(`🚀 AI服务器运行在 http://localhost:${PORT}`);
  console.log(`📡 OpenAI API Key: ${process.env.OPENAI_API_KEY ? '已配置' : '未配置 - 请在 .env 文件中设置'}`);
});
