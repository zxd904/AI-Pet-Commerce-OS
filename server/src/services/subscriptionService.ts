import { prisma } from '../lib/prisma.js';

const EXEMPT_ACCOUNTS = [
  'testuser@example.com',
  'demo@aipet.com',
  'admin@aipet.com'
];

export function isExemptAccount(email: string): boolean {
  return EXEMPT_ACCOUNTS.includes(email.toLowerCase());
}

export interface PlanLimits {
  dailySelections: number;
  dailyGenerations: number;
  maxProducts: number;
  aiAnalysis: boolean;
  autoPublish: boolean;
  analytics: boolean;
  apiAccess: boolean;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  billingPeriod: string;
  limits: PlanLimits;
  features: string[];
}

export const PLANS: Record<string, Plan> = {
  free: {
    id: 'free',
    name: '免费版',
    price: 0,
    currency: 'CNY',
    billingPeriod: 'month',
    limits: {
        dailySelections: 5,
        dailyGenerations: 3,
        maxProducts: 50,
        aiAnalysis: true,
        autoPublish: false,
        analytics: false,
        apiAccess: false
      },
      features: [
        '每日5次AI选品',
        '每日3次内容生成',
        '最多50个商品',
        '基础AI分析',
        '社区支持'
      ]
  },
  pro: {
    id: 'pro',
    name: '专业版',
    price: 29,
    currency: 'CNY',
    billingPeriod: 'month',
    limits: {
      dailySelections: 1000,
      dailyGenerations: 1000,
      maxProducts: 500,
      aiAnalysis: true,
      autoPublish: true,
      analytics: true,
      apiAccess: true
    },
    features: [
      '无限AI分析',
      '无限内容生成',
      '最多500个商品',
      '高级AI分析',
      '数据报表分析',
      '一键上架多平台',
      'API接口访问',
      '优先技术支持'
    ]
  },
  enterprise: {
    id: 'enterprise',
    name: '企业版',
    price: 299,
    currency: 'CNY',
    billingPeriod: 'year',
    limits: {
      dailySelections: 10000,
      dailyGenerations: 10000,
      maxProducts: 5000,
      aiAnalysis: true,
      autoPublish: true,
      analytics: true,
      apiAccess: true
    },
    features: [
      '全部Pro功能',
      '批量选品',
      'API接口',
      '数据导出',
      '团队账号',
      '专属客户经理',
      '定制化功能开发',
      'SLA服务保障'
    ]
  }
};

export async function getPlan(planId: string): Promise<Plan> {
  return PLANS[planId] || PLANS.free;
}

export async function upgradeSubscription(userId: number, planId: string): Promise<boolean> {
  const plan = PLANS[planId];
  if (!plan) {
    throw new Error('无效的套餐');
  }

  const days = planId === 'pro' ? 30 : planId === 'enterprise' ? 365 : 0;
  const expireTime = days > 0 ? new Date(Date.now() + days * 24 * 60 * 60 * 1000) : null;

  await prisma.user.update({
    where: { id: userId },
    data: {
      plan: planId,
      expireTime,
      updatedAt: new Date()
    }
  });

  return true;
}

export async function downgradeSubscription(userId: number): Promise<boolean> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      plan: 'free',
      expireTime: null,
      updatedAt: new Date()
    }
  });

  return true;
}

export async function checkDailyLimit(userId: number, limitType: 'selections' | 'generations'): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return false;

  const plan = PLANS[user.plan];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const count = await prisma.analyticsRecord.count({
    where: {
      userId,
      metricType: limitType,
      recordDate: { gte: today }
    }
  });

  if (limitType === 'selections') {
    return count < plan.limits.dailySelections;
  }
  return count < plan.limits.dailyGenerations;
}

export async function recordAnalytics(userId: number, metricType: string, value: number = 1): Promise<void> {
  await prisma.analyticsRecord.create({
    data: {
      userId,
      metricType,
      value,
      recordDate: new Date()
    }
  });
}

export async function getSubscriptionStatus(userId: number) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;

  return {
    plan: user.plan,
    expireTime: user.expireTime,
    details: PLANS[user.plan]
  };
}

export async function getDailyUsage(userId: number): Promise<{ selections: number; generations: number; planLimits: PlanLimits }> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return {
      selections: 0,
      generations: 0,
      planLimits: PLANS.free.limits
    };
  }

  const plan = PLANS[user.plan];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [selectionCount, generationCount] = await Promise.all([
    prisma.analyticsRecord.count({
      where: {
        userId,
        metricType: 'selections',
        recordDate: { gte: today }
      }
    }),
    prisma.analyticsRecord.count({
      where: {
        userId,
        metricType: 'generations',
        recordDate: { gte: today }
      }
    })
  ]);

  return {
    selections: selectionCount,
    generations: generationCount,
    planLimits: plan.limits
  };
}