// Agent系统API路由
import express from 'express';
import { prisma } from '../lib/prisma.js';
import { fetchAllSources, fetchAmazonBestSellers, fetchAliExpressHot, fetch1688Supply, fetchTikTokShopTrending } from '../services/dataSourceService.js';
import { scoreProduct, scoreProductsBatch, generateMarketingContent } from '../services/agentService.js';
import { 
  createProduct, 
  publishShopifyProduct, 
  runAutoSelection, 
  rollbackProduct,
  generateMarketing,
  updateProductPrice,
  fetchSupplierData,
  publishToDouyin,
  delistFromDouyin
} from '../services/toolsService.js';
import { authenticate, requirePlan, AuthenticatedRequest } from '../middleware/auth.js';

const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'AI Agent 系统 API',
    endpoints: {
      scan: {
        '/agent/run-scan': 'POST - 扫描所有数据源',
        '/agent/scan/:source': 'POST - 扫描单个数据源'
      },
      ai: {
        '/agent/run-score': 'POST - 对单个商品评分',
        '/agent/run-score-batch': 'POST - 批量评分'
      },
      listing: {
        '/agent/auto-list': 'POST - 执行自动选品流程',
        '/agent/publish-product': 'POST - 发布商品（专业版）',
        '/agent/publish-douyin': 'POST - 发布到抖音（专业版）',
        '/agent/delist-douyin': 'POST - 从抖音下架（专业版）',
        '/agent/rollback-product': 'POST - 回滚商品（专业版）'
      },
      products: {
        '/agent/products': 'GET - 获取商品列表',
        '/agent/products/top': 'GET - 获取TOP商品',
        '/agent/products/:id': 'GET - 获取商品详情',
        '/agent/products/:id/price': 'PUT - 更新商品价格'
      },
      logs: {
        '/agent/logs': 'GET - 获取操作日志'
      },
      marketing: {
        '/agent/generate-content': 'POST - 生成营销内容'
      },
      supplier: {
        '/agent/fetch-supplier': 'POST - 获取供应商数据'
      },
      tasks: {
        '/agent/tasks': 'GET - 获取任务列表',
        '/agent/tasks/current': 'GET - 获取当前任务'
      },
      dashboard: {
        '/agent/dashboard': 'GET - 获取仪表盘统计'
      }
    }
  });
});

// ==================== 数据扫描接口 ====================

// 扫描所有数据源
router.post('/run-scan', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    console.log('🔄 开始扫描数据源...');
    const products = await fetchAllSources();
    
    res.json({
      success: true,
      message: `扫描完成，获取 ${products.length} 个商品`,
      data: {
        total: products.length,
        sources: {
          amazon: products.filter(p => p.source === 'amazon').length,
          aliexpress: products.filter(p => p.source === 'aliexpress').length,
          '1688': products.filter(p => p.source === '1688').length,
          tiktok: products.filter(p => p.source === 'tiktok').length
        },
        products: products.map(p => ({ ...p, dataSource: 'mock' }))
      }
    });
  } catch (error: any) {
    console.error('扫描失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 扫描单个数据源
router.post('/scan/:source', async (req, res) => {
  try {
    const { source } = req.params;
    let products;

    switch (source) {
      case 'amazon':
        products = await fetchAmazonBestSellers();
        break;
      case 'aliexpress':
        products = await fetchAliExpressHot();
        break;
      case '1688':
        products = await fetch1688Supply();
        break;
      case 'tiktok':
        products = await fetchTikTokShopTrending();
        break;
      default:
        return res.status(400).json({ success: false, message: '未知数据源' });
    }

    res.json({
      success: true,
      message: `${source} 扫描完成`,
      data: products
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== AI评分接口 ====================

// 对单个商品评分
router.post('/run-score', async (req, res) => {
  try {
    const { product } = req.body;
    
    if (!product) {
      return res.status(400).json({ success: false, message: '缺少商品数据' });
    }

    const decision = await scoreProduct(product);
    
    res.json({
      success: true,
      data: decision
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 批量评分
router.post('/run-score-batch', async (req, res) => {
  try {
    const { products } = req.body;
    
    if (!products || !Array.isArray(products)) {
      return res.status(400).json({ success: false, message: '缺少商品数据' });
    }

    const decisions = await scoreProductsBatch(products);
    
    res.json({
      success: true,
      message: `完成 ${decisions.length} 个商品评分`,
      data: decisions
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== 自动上架接口 ====================

// 执行自动选品流程
router.post('/auto-list', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    console.log('🚀 开始自动选品...');
    
    if (!req.user) {
      return res.status(401).json({ success: false, message: '未授权访问' });
    }
    
    const result = await runAutoSelection();
    
    res.json({
      success: true,
      message: '自动选品完成',
      data: result
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 发布单个商品（专业版及以上）
router.post('/publish-product', authenticate, (req: AuthenticatedRequest, res) => {
  requirePlan(req, res, async () => {
    try {
      const { productId } = req.body;
      
      if (!productId) {
        return res.status(400).json({ success: false, message: '缺少商品ID' });
      }

      const result = await publishShopifyProduct(productId);
      
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }, 'pro');
});

// 发布到抖音小店（专业版及以上）
router.post('/publish-douyin', authenticate, (req: AuthenticatedRequest, res) => {
  requirePlan(req, res, async () => {
    try {
      const { productId } = req.body;
      
      if (!productId) {
        return res.status(400).json({ success: false, message: '缺少商品ID' });
      }

      const result = await publishToDouyin(productId);
      
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }, 'pro');
});

// 从抖音小店下架（专业版及以上）
router.post('/delist-douyin', authenticate, (req: AuthenticatedRequest, res) => {
  requirePlan(req, res, async () => {
    try {
      const { productId } = req.body;
      
      if (!productId) {
        return res.status(400).json({ success: false, message: '缺少商品ID' });
      }

      const result = await delistFromDouyin(productId);
      
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }, 'pro');
});

// 回滚商品（专业版及以上）
router.post('/rollback-product', authenticate, (req: AuthenticatedRequest, res) => {
  requirePlan(req, res, async () => {
    try {
      const { productId } = req.body;
      
      if (!productId) {
        return res.status(400).json({ success: false, message: '缺少商品ID' });
      }

      const result = await rollbackProduct(productId);
      
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }, 'pro');
});

// ==================== 商品管理接口 ====================

// 获取TOP商品
router.get('/products/top', async (req, res) => {
  try {
    const { limit = 20, minScore = 75 } = req.query;
    
    const products = await prisma.productItem.findMany({
      where: {
        score: { gte: Number(minScore) }
      },
      orderBy: { score: 'desc' },
      take: Number(limit),
      include: { logs: { take: 5, orderBy: { createdAt: 'desc' } } }
    });

    res.json({
      success: true,
      data: products
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 获取商品列表
router.get('/products', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      minScore, 
      source,
      sortBy = 'score',
      sortOrder = 'desc'
    } = req.query;

    const where: any = {};
    if (status) where.status = status;
    if (minScore) where.score = { gte: Number(minScore) };
    if (source) where.source = source;

    const products = await prisma.productItem.findMany({
      where,
      orderBy: { [sortBy as string]: sortOrder as 'asc' | 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit)
    });

    const total = await prisma.productItem.count({ where });

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 获取商品详情
router.get('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const product = await prisma.productItem.findUnique({
      where: { id: Number(id) },
      include: { logs: { orderBy: { createdAt: 'desc' } } }
    });

    if (!product) {
      return res.status(404).json({ success: false, message: '商品不存在' });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 更新商品价格
router.put('/products/:id/price', async (req, res) => {
  try {
    const { id } = req.params;
    const { price } = req.body;
    
    const result = await updateProductPrice(Number(id), price);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== 日志接口 ====================

// 获取操作日志
router.get('/logs', async (req, res) => {
  try {
    const { page = 1, limit = 50, action, productId } = req.query;

    const where: any = {};
    if (action) where.action = action;
    if (productId) where.productId = Number(productId);

    const logs = await prisma.log.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      include: { product: { select: { title: true } } }
    });

    const total = await prisma.log.count({ where });

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== 营销内容接口 ====================

// 生成营销内容
router.post('/generate-content', async (req, res) => {
  try {
    const { productId, platform } = req.body;
    
    if (!productId || !platform) {
      return res.status(400).json({ success: false, message: '缺少参数' });
    }

    const result = await generateMarketing(productId, platform);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== 供应商接口 ====================

// 获取供应商数据
router.post('/fetch-supplier', async (req, res) => {
  try {
    const { productName } = req.body;
    
    if (!productName) {
      return res.status(400).json({ success: false, message: '缺少产品名称' });
    }

    const result = await fetchSupplierData(productName);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== 任务状态接口 ====================

// 获取任务状态
router.get('/tasks', async (req, res) => {
  try {
    const tasks = await prisma.selectionTask.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    res.json({
      success: true,
      data: tasks
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 获取当前运行任务
router.get('/tasks/current', async (req, res) => {
  try {
    const task = await prisma.selectionTask.findFirst({
      where: { status: 'running' },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: task
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== 统计接口 ====================

// 获取仪表盘统计
router.get('/dashboard', async (req, res) => {
  try {
    const totalProducts = await prisma.productItem.count();
    const listedProducts = await prisma.productItem.count({ where: { status: 'listed' } });
    const draftProducts = await prisma.productItem.count({ where: { status: 'draft' } });
    const rejectedProducts = await prisma.productItem.count({ where: { status: 'rejected' } });
    
    const avgScore = await prisma.productItem.aggregate({
      _avg: { score: true }
    });

    const topProducts = await prisma.productItem.findMany({
      orderBy: { score: 'desc' },
      take: 5
    });

    const recentLogs = await prisma.log.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { product: { select: { title: true } } }
    });

    res.json({
      success: true,
      data: {
        stats: {
          total: totalProducts,
          listed: listedProducts,
          draft: draftProducts,
          rejected: rejectedProducts,
          avgScore: avgScore._avg.score || 0
        },
        topProducts,
        recentLogs
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
