import express from 'express';
import { PLANS, upgradeSubscription, downgradeSubscription, getSubscriptionStatus, isExemptAccount } from '../services/subscriptionService.js';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';

const router = express.Router();

router.get('/plans', (req, res) => {
  try {
    res.json({
      success: true,
      data: PLANS
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.get('/status', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: '未授权访问' });
    }

    const status = await getSubscriptionStatus(req.user.id);
    if (!status) {
      return res.status(404).json({ success: false, error: '订阅状态未找到' });
    }

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.post('/subscribe', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: '未授权访问' });
    }

    const { plan } = req.body;
    
    if (!plan || !PLANS[plan]) {
      return res.status(400).json({ success: false, error: '无效的套餐' });
    }

    if (plan === 'free') {
      await downgradeSubscription(req.user.id);
      return res.json({
        success: true,
        message: '已切换到免费版',
        data: await getSubscriptionStatus(req.user.id)
      });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      return res.status(404).json({ success: false, error: '用户不存在' });
    }

    const exempt = isExemptAccount(user.email);

    if (!exempt) {
      return res.json({
        success: false,
        message: `升级到${PLANS[plan].name}需要支付 ¥${PLANS[plan].price}/月`,
        error: '需要支付',
        requiresPayment: true,
        planDetails: PLANS[plan]
      });
    }

    await upgradeSubscription(req.user.id, plan);
    
    res.json({
      success: true,
      message: `已成功升级到${PLANS[plan].name}（豁免账户）`,
      data: await getSubscriptionStatus(req.user.id),
      exempt: true
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

export default router;