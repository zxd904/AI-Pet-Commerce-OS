import express from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';
import crypto from 'crypto';

const router = express.Router();

const PLANS: Record<string, { price: number; name: string; days: number }> = {
  free: { price: 0, name: '免费版', days: 0 },
  pro: { price: 29, name: '专业版', days: 30 },
  enterprise: { price: 299, name: '企业版', days: 365 }
};

function generateOrderNo(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `ORD${timestamp}${random}`;
}

function generateSign(params: Record<string, any>, key: string): string {
  const sortedKeys = Object.keys(params).sort();
  let signStr = '';
  for (const k of sortedKeys) {
    if (params[k] && k !== 'sign') {
      signStr += `${k}=${params[k]}&`;
    }
  }
  signStr += `key=${key}`;
  return crypto.createHash('md5').update(signStr).digest('hex').toUpperCase();
}

router.get('/plan', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: '未授权访问' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      return res.status(404).json({ success: false, error: '用户不存在' });
    }

    res.json({
      success: true,
      plan: user.plan,
      expireTime: user.expireTime ? user.expireTime.toISOString().split('T')[0] : null
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.get('/plans', (req, res) => {
  try {
    res.json({
      success: true,
      data: [
        {
          id: 'free',
          name: '免费版',
          price: 0,
          currency: 'CNY',
          billingPeriod: '永久',
          features: ['每天5次AI分析', '基础选品功能']
        },
        {
          id: 'pro',
          name: '专业版',
          price: 29,
          currency: 'CNY',
          billingPeriod: '月',
          features: ['无限AI分析', '自动生成商品标题', '自动生成商品描述', '热门商品推荐']
        },
        {
          id: 'enterprise',
          name: '企业版',
          price: 299,
          currency: 'CNY',
          billingPeriod: '年',
          features: ['全部Pro功能', '批量选品', 'API接口', '数据导出', '团队账号']
        }
      ]
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.post('/order/create', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: '未授权访问' });
    }

    const { plan } = req.body;
    
    if (!plan || !PLANS[plan]) {
      return res.status(400).json({ success: false, error: '无效的套餐' });
    }

    const planInfo = PLANS[plan];
    if (planInfo.price === 0) {
      await prisma.user.update({
        where: { id: req.user.id },
        data: { plan: 'free', expireTime: null }
      });
      return res.json({
        success: true,
        message: '已切换到免费版'
      });
    }

    const orderNo = generateOrderNo();
    
    await prisma.order.create({
      data: {
        orderNo,
        userId: req.user.id,
        amount: planInfo.price,
        plan
      }
    });

    const PAY_KEY = process.env.PAY_KEY || 'ai-pet-pay-secret';
    const payParams: Record<string, any> = {
      orderNo,
      amount: planInfo.price,
      plan,
      timestamp: Date.now(),
      notifyUrl: `${process.env.BASE_URL || 'http://localhost:3001'}/api/payment/notify`
    };
    const sign = generateSign(payParams, PAY_KEY);
    payParams['sign'] = sign;

    res.json({
      success: true,
      orderNo,
      amount: planInfo.price,
      payUrl: `https://pay.example.com/qrcode?orderNo=${orderNo}&amount=${planInfo.price}&sign=${sign}`,
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`https://pay.example.com/pay?orderNo=${orderNo}&amount=${planInfo.price}`)}`
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.post('/payment/notify', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const body = JSON.parse(req.body.toString());
    const { orderNo, sign, status, paymentMethod } = body;

    const PAY_KEY = process.env.PAY_KEY || 'ai-pet-pay-secret';
    const params = { ...body };
    delete params.sign;
    
    const verifySign = generateSign(params, PAY_KEY);
    if (verifySign !== sign) {
      return res.json({ code: -1, message: '签名验证失败' });
    }

    const order = await prisma.order.findUnique({ where: { orderNo } });
    if (!order) {
      return res.json({ code: -1, message: '订单不存在' });
    }

    if (order.status === 'paid') {
      return res.json({ code: 0, message: '订单已支付' });
    }

    if (status === 'success') {
      const planInfo = PLANS[order.plan];
      const expireTime = new Date();
      expireTime.setDate(expireTime.getDate() + planInfo.days);

      await prisma.$transaction([
        prisma.order.update({
          where: { orderNo },
          data: { status: 'paid', paymentMethod, paidAt: new Date() }
        }),
        prisma.user.update({
          where: { id: order.userId },
          data: { plan: order.plan, expireTime }
        })
      ]);

      return res.json({ code: 0, message: '支付成功' });
    }

    await prisma.order.update({
      where: { orderNo },
      data: { status: 'failed' }
    });

    return res.json({ code: -1, message: '支付失败' });
  } catch (error) {
    console.error('支付回调错误:', error);
    return res.json({ code: -1, message: '服务器错误' });
  }
});

router.get('/order/status', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: '未授权访问' });
    }

    const { orderNo } = req.query;
    if (!orderNo) {
      return res.status(400).json({ success: false, error: '缺少订单号' });
    }

    const order = await prisma.order.findUnique({ where: { orderNo: orderNo as string } });
    if (!order) {
      return res.status(404).json({ success: false, error: '订单不存在' });
    }

    if (order.userId !== req.user.id) {
      return res.status(403).json({ success: false, error: '无权查看此订单' });
    }

    res.json({
      success: true,
      orderNo: order.orderNo,
      status: order.status,
      amount: order.amount,
      plan: order.plan,
      createdAt: order.createdAt,
      paidAt: order.paidAt
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// ============ 内测账号专用接口 ============
router.post('/switch-plan', authenticate, async (req: AuthenticatedRequest, res) => {
  const EXEMPT_EMAILS = [
    'test@ai-pet.com',
    'admin@ai-pet.com',
    'demo@ai-pet.com',
    'internal@ai-pet.com'
  ];

  if (!req.user) {
    return res.status(401).json({ success: false, error: '未授权访问' });
  }

  if (!EXEMPT_EMAILS.includes(req.user.email.toLowerCase())) {
    return res.status(403).json({ 
      success: false, 
      error: '此功能仅对内测账号开放'
    });
  }

  const { plan } = req.body;
  if (!PLANS[plan]) {
    return res.status(400).json({ success: false, error: '无效的套餐' });
  }

  const days = plan === 'free' ? 0 : PLANS[plan].days;
  const expireTime = days > 0 ? new Date(Date.now() + days * 24 * 60 * 60 * 1000) : null;

  await prisma.user.update({
    where: { id: req.user.id },
    data: {
      plan,
      expireTime
    }
  });

  res.json({
    success: true,
    data: {
      message: `已切换到${PLANS[plan].name}`,
      plan,
      expireTime: expireTime ? expireTime.toISOString().split('T')[0] : null
    }
  });
});

export default router;