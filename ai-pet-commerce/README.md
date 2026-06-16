# AI Pet Commerce OS

AI驱动的智能宠物电商选品SaaS系统

## 功能特性

- 🤖 **AI智能选品** - 基于本地大模型(Qwen2.5)的智能商品分析和评分
- 📊 **爆款评分系统** - 0-100分综合评分，自动决策上架建议
- ✍️ **内容生成** - 自动生成商品标题、卖点、关键词、短视频脚本
- 🚀 **一键上架** - 支持淘宝、拼多多、抖音多平台上架
- 📈 **数据分析** - 转化率、ROI分析、优化建议
- 💰 **订阅系统** - Free/Pro/Business三档套餐

## 技术架构

### 前端
- React 18 + TypeScript
- TailwindCSS 3
- Lucide React Icons
- Vite

### 后端
- FastAPI
- PostgreSQL + SQLAlchemy
- Redis
- Ollama (Qwen2.5:14b)

## 快速开始

### 环境要求
- Docker + Docker Compose

### 启动命令

```bash
cd ai-pet-commerce

# 启动所有服务
docker-compose up --build

# 首次启动需要下载Qwen2.5模型，可能需要几分钟
```

### 访问地址
- 前端: http://localhost:3000
- 后端API: http://localhost:8000
- Ollama: http://localhost:11434

### 初始账号
注册即可使用，默认免费版

## 项目结构

```
ai-pet-commerce/
├── backend/                    # 后端服务
│   ├── app/
│   │   ├── api/                # API路由
│   │   ├── models/             # 数据库模型
│   │   ├── services/           # 业务逻辑服务
│   │   ├── schemas/            # Pydantic schemas
│   │   ├── config/             # 配置文件
│   │   └── utils/              # 工具函数
│   ├── requirements.txt        # Python依赖
│   └── Dockerfile
├── frontend/                   # 前端应用
│   ├── src/
│   │   ├── pages/              # 页面组件
│   │   ├── components/         # 通用组件
│   │   ├── services/           # API服务
│   │   └── hooks/              # 自定义hooks
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml          # Docker配置
├── nginx.conf                  # Nginx配置
└── README.md
```

## API接口

### 认证
- POST /api/auth/login - 登录
- POST /api/auth/register - 注册

### 商品
- POST /api/products/select - AI选品
- POST /api/products/analyze - 商品分析
- POST /api/products/generate - 内容生成
- POST /api/products/upload - 一键上架
- GET /api/products/list - 获取商品列表

### 仪表盘
- GET /api/dashboard - 获取统计数据

### 数据分析
- GET /api/analytics - 获取分析报告

### 订阅
- GET /api/billing/plans - 获取套餐列表
- POST /api/billing/subscribe - 订阅套餐

## 配置说明

后端配置文件: `backend/.env`

```env
DATABASE_URL=postgresql://postgres:password@db:5432/aipetcommerce
REDIS_URL=redis://redis:6379/0
OLLAMA_BASE_URL=http://ollama:11434
OLLAMA_MODEL=qwen2.5:14b
SECRET_KEY=your-secret-key-here-change-in-production
```

## License

MIT