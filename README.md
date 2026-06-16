# AI宠物智能用品自动选品系统

一个可直接部署运行的Web SaaS系统，能够自动发现、分析、评分并推荐宠物智能用品爆款产品。

- 🤖 AI自动选品 - 根据销量/价格/评价/趋势打分（0-100分）
- 📝 内容生成 - 自动生成商品标题、卖点、关键词、短视频脚本

## 功能模块

| 模块 | 描述 |
|------|------|
| **仪表盘** | 今日爆款数量、TOP1推荐、评分趋势图 |
| **自动选品引擎** | 每6小时自动分析8个品类，AI评分并保存数据库 |
| **产品列表** | 展示所有产品，支持排序、搜索、筛选、分页 |
| **产品详情页** | 产品分析、爆款原因、抖音脚本、小红书文案、直播话术 |
| **排行榜** | TOP1/3/10排名，支持24h/7天/30天 |
| **AI内容生成器** | 输入产品名称，自动生成带货内容 |

## 技术栈

- **前端**: React 18 + TypeScript + Vite
- **样式**: TailwindCSS 3 + shadcn/ui
- **图表**: Recharts
- **后端**: Node.js + Express + TypeScript
- **数据库**: SQLite + Prisma ORM
- **AI**: OpenAI API (gpt-4o-mini)
- **定时任务**: node-cron

## 项目结构

```
ai-pet-products-saas/
├── client/                    # React前端
│   ├── src/
│   │   ├── components/       # 通用组件
│   │   ├── pages/            # 页面组件
│   │   ├── services/         # API服务
│   │   ├── lib/              # 工具函数
│   │   ├── App.tsx           # 主应用
│   │   ├── main.tsx          # 入口文件
│   │   └── index.css         # 全局样式
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── tsconfig.json
├── server/                   # Express后端
│   ├── src/
│   │   ├── routes/           # API路由
│   │   ├── services/         # 业务服务
│   │   ├── lib/              # 工具库
│   │   └── index.ts          # 服务入口
│   ├── prisma/               # Prisma配置
│   ├── package.json
│   ├── tsconfig.json
│   └── .env                  # 环境变量
├── package.json              # 根目录配置
└── README.md
```

## 快速开始

### 1. 安装依赖

```bash
# 安装所有依赖
npm run install:all
```

### 2. 配置环境变量

编辑 `server/.env` 文件：

```env
OPENAI_API_KEY=your_openai_api_key_here
DATABASE_URL="file:./dev.db"
PORT=3001
CRON_SCHEDULE="0 */6 * * *"
```

### 3. 初始化数据库

```bash
cd server
npx prisma migrate dev --name init
```

### 4. 启动项目

```bash
# 同时启动前端和后端
npm run dev
```

### 5. 访问地址

- 前端应用: http://localhost:5173
- 后端API: http://localhost:3001

## API接口

| 接口 | 方法 | 描述 |
|------|------|------|
| `/api/dashboard` | GET | 获取仪表盘数据 |
| `/api/products` | GET | 获取产品列表 |
| `/api/products/:id` | GET | 获取产品详情 |
| `/api/rankings` | GET | 获取排行榜 |
| `/api/run-selection` | POST | 立即执行选品 |
| `/api/generate-content` | POST | 生成内容 |

## 自动任务

系统启动后会自动执行：
- **首次启动**: 立即执行选品和内容生成
- **定时任务**: 每6小时自动执行（可在 `.env` 配置 `CRON_SCHEDULE`）

## 评分算法

| 维度 | 权重 |
|------|------|
| 痛点强度 | 30% |
| 冲动消费 | 20% |
| 传播能力 | 20% |
| 利润空间 | 15% |
| 竞争难度 | 15% |

## 推荐等级

- **90-100分**: 强烈推荐
- **75-89分**: 推荐
- **60-74分**: 观察
- **60分以下**: 不推荐

## 支持的产品品类

1. 自动猫砂盆
2. 智能喂食器
3. 宠物饮水机
4. 智能逗猫器
5. 宠物监控摄像头
6. 智能宠物项圈
7. 宠物空气净化器
8. 宠物烘干箱

## 注意事项

- 如果未配置OpenAI API Key，系统会使用模拟数据运行
- 数据库使用SQLite，数据存储在 `server/prisma/dev.db`
- 前端开发服务器自动代理API请求到后端

## License

MIT