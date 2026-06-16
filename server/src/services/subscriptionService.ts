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
      maxProducts: 50,
      aiAnalysis: true,
      autoPublish: false,
      analytics: false,
      apiAccess: false
    },
    features: [
      '每日5次AI选品',
      '最多50个商品',
      '基础AI分析',
      '商品内容生成',
      '社区支持'
    ]
  },
  pro: {
    id: 'pro',
    name: '专业版',
    price: 99,
    currency: 'CNY',
    billingPeriod: 'month',
    limits: {
      dailySelections: 50,
      maxProducts: 500,
      aiAnalysis: true,
      autoPublish: true,
      analytics: true,
      apiAccess: true
    },
    features: [
      '每日50次AI选品',
      '最多500个商品',
      '高级AI分析',
      '商品内容生成',
      '数据报表分析',
      '一键上架多平台',
      'API接口访问',
      '优先技术支持'
    ]
  },
  business: {
    id: 'business',
    name: '企业版',
    price: 299,
    currency: 'CNY',
    billingPeriod: 'month',
    limits: {
      dailySelections: 200,
      maxProducts: 5000,
      aiAnalysis: true,
      autoPublish: true,
      analytics: true,
      apiAccess: true
    },
    features: [
      '每日200次AI选品',
      '无限商品数量',
      '企业级AI分析',
      '商品内容生成',
      '高级数据报表',
      '一键上架多平台',
      'API接口访问',
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

  await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionPlan: planId,
      subscriptionStatus: planId === 'free' ? 'inactive' : 'active',
      updatedAt: new Date()
    }
  });

  return true;
}

export async function downgradeSubscription(userId: number): Promise<boolean> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionPlan: 'free',
      subscriptionStatus: 'inactive',
      stripeSubscriptionId: null,
      updatedAt: new Date()
    }
  });

  return true;
}

export async function checkDailyLimit(userId: number, limitType: 'selections'): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return false;

  const plan = PLANS[user.subscriptionPlan];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const count = await prisma.analyticsRecord.count({
    where: {
      userId,
      metricType: limitType,
      recordDate: { gte: today }
    }
  });

  return count < plan.limits.dailySelections;
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
    plan: user.subscriptionPlan,
    status: user.subscriptionStatus,
    details: PLANS[user.subscriptionPlan]
  };
}