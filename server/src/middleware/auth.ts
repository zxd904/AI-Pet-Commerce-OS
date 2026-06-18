import { Request, Response, NextFunction } from 'express';
import { verifyToken, getUserById } from '../services/authService.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    plan: string;
    expireTime: Date | null;
  };
}

export async function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: '未授权访问' });
  }

  const token = authHeader.substring(7);
  const payload = await verifyToken(token);
  
  if (!payload) {
    return res.status(401).json({ success: false, error: '无效的token' });
  }

  const user = await getUserById(payload.userId);
  if (!user) {
    return res.status(401).json({ success: false, error: '用户不存在' });
  }

  req.user = user;
  next();
}

export async function requirePlan(req: AuthenticatedRequest, res: Response, next: NextFunction, requiredPlan: 'pro' | 'enterprise') {
  if (!req.user) {
    return res.status(401).json({ success: false, error: '未授权访问' });
  }

  const plans: Record<string, number> = { free: 0, pro: 1, enterprise: 2 };
  const userPlanLevel = plans[req.user.plan] || 0;
  const requiredLevel = plans[requiredPlan] || 0;

  if (userPlanLevel < requiredLevel) {
    return res.status(403).json({ 
      success: false, 
      error: `请升级${requiredPlan === 'pro' ? '专业版' : '企业版'}`,
      requiredPlan
    });
  }

  next();
}