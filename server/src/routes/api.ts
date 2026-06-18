import express from 'express';
import { prisma } from '../lib/prisma.js';
import { runSelection, generateAllContent } from '../services/selectionEngine.js';
import { generateContent } from '../services/llmService.js';
import { authenticate, requirePlan, AuthenticatedRequest } from '../middleware/auth.js';
import { checkDailyLimit, recordAnalytics, getDailyUsage } from '../services/subscriptionService.js';

const router = express.Router();

router.get('/products', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { page = '1', limit = '10', search = '', sortBy = 'viralScore', sortOrder = 'desc', recommendation = '' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    let query = prisma.product.findMany({
      skip: offset,
      take: limitNum,
      orderBy: {
        [sortBy as string]: sortOrder as 'asc' | 'desc'
      },
      include: { content: true }
    });

    if (search) {
      query = prisma.product.findMany({
        where: {
          productName: { contains: search as string }
        },
        skip: offset,
        take: limitNum,
        orderBy: {
          [sortBy as string]: sortOrder as 'asc' | 'desc'
        },
        include: { content: true }
      });
    }

    if (recommendation && recommendation !== 'all') {
      query = prisma.product.findMany({
        where: {
          recommendation: recommendation as string
        },
        skip: offset,
        take: limitNum,
        orderBy: {
          [sortBy as string]: sortOrder as 'asc' | 'desc'
        },
        include: { content: true }
      });
    }

    const products = await query;
    const total = await prisma.product.count({
      where: {
        ...(search ? { productName: { contains: search as string } } : {}),
        ...(recommendation && recommendation !== 'all' ? { recommendation: recommendation as string } : {})
      }
    });

    res.json({
      success: true,
      data: products.map(p => ({
        ...p,
        sellingPoints: JSON.parse(p.sellingPoints),
        content: p.content ? {
          ...p.content,
          adTitles: JSON.parse(p.content.adTitles)
        } : null,
        dataSource: 'database'
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  }
  catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.get('/products/:id', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) },
      include: { content: true }
    });

    if (!product) {
      return res.status(404).json({ success: false, error: '产品未找到' });
    }

    res.json({
      success: true,
      data: {
        ...product,
        sellingPoints: JSON.parse(product.sellingPoints),
        content: product.content ? {
          ...product.content,
          adTitles: JSON.parse(product.content.adTitles)
        } : null,
        dataSource: 'database'
      }
    });
  }
  catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.get('/rankings', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: { viralScore: 'desc' },
      take: 20,
      include: { content: true }
    });

    res.json({
      success: true,
      data: products.map(p => ({
        ...p,
        sellingPoints: JSON.parse(p.sellingPoints),
        content: p.content ? {
          ...p.content,
          adTitles: JSON.parse(p.content.adTitles)
        } : null,
        dataSource: 'database'
      }))
    });
  }
  catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.get('/dashboard', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayProducts = await prisma.product.count({
      where: {
        updatedAt: { gte: today }
      }
    });

    const topProduct = await prisma.product.findFirst({
      orderBy: { viralScore: 'desc' },
      include: { content: true }
    });

    const recentProducts = await prisma.product.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 7,
      select: { viralScore: true, updatedAt: true }
    });

    const scoreTrend = recentProducts.map(p => ({
      date: p.updatedAt.toISOString().split('T')[0],
      score: p.viralScore
    }));

    res.json({
      success: true,
      data: {
        todayCount: todayProducts,
        topProduct: topProduct ? {
          ...topProduct,
          sellingPoints: JSON.parse(topProduct.sellingPoints),
          content: topProduct.content ? {
            ...topProduct.content,
            adTitles: JSON.parse(topProduct.content.adTitles)
          } : null,
          dataSource: 'database'
        } : null,
        lastUpdate: topProduct?.updatedAt || new Date(),
        scoreTrend
      }
    });
  }
  catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.post('/run-selection', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: '未授权访问' });
    }

    const allowed = await checkDailyLimit(req.user.id, 'selections');
    if (!allowed) {
      return res.status(403).json({
        success: false,
        error: '今日AI选品次数已用完，请升级到专业版或企业版获取更多次数'
      });
    }

    await recordAnalytics(req.user.id, 'selections');

    runSelection().catch(err => {
      console.error('选品任务后台执行失败:', err);
    });

    res.json({ success: true, message: '选品任务已启动，正在后台执行...' });
  }
  catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.post('/generate-content', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { productName } = req.body;
    if (!productName) {
      return res.status(400).json({ success: false, error: '请输入产品名称' });
    }

    if (!req.user) {
      return res.status(401).json({ success: false, error: '未授权访问' });
    }

    const allowed = await checkDailyLimit(req.user.id, 'generations');
    if (!allowed) {
      return res.status(403).json({
        success: false,
        error: '今日AI内容生成次数已用完，请升级到专业版或企业版获取更多次数'
      });
    }

    await recordAnalytics(req.user.id, 'generations');

    const content = await generateContent(productName);

    res.json({
      success: true,
      data: {
        ...content,
        adTitles: content.ad_titles
      }
    });
  }
  catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.get('/daily-usage', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: '未授权访问' });
    }

    const usage = await getDailyUsage(req.user.id);

    res.json({
      success: true,
      data: {
        selectionsUsed: usage.selections,
        selectionsRemaining: Math.max(0, usage.planLimits.dailySelections - usage.selections),
        selectionsLimit: usage.planLimits.dailySelections,
        generationsUsed: usage.generations,
        generationsRemaining: Math.max(0, usage.planLimits.dailyGenerations - usage.generations),
        generationsLimit: usage.planLimits.dailyGenerations
      }
    });
  }
  catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.get('/analytics', authenticate, (req: AuthenticatedRequest, res) => {
  requirePlan(req, res, () => {
    res.json({
      success: true,
      data: {
        message: '数据分析功能（专业版及以上）'
      }
    });
  }, 'pro');
});

export default router;