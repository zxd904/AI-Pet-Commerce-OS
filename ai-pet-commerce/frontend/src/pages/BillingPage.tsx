import { useEffect, useState } from 'react';
import { Check, Zap, Crown, Building2, CreditCard, RefreshCw } from 'lucide-react';
import { billingAPI, Plan } from '../services/api';

const plans = [
  {
    id: 'free',
    name: '免费版',
    price: 0,
    period: '永久',
    icon: Zap,
    color: 'bg-gray-500/20 border-gray-500/30',
    buttonColor: 'bg-gray-600 hover:bg-gray-500',
    features: [
      '每日5次AI选品',
      '最多50个商品',
      '基础AI分析',
      '手动上架',
      '邮件支持'
    ]
  },
  {
    id: 'pro',
    name: '专业版',
    price: 99,
    period: '月',
    icon: Crown,
    color: 'bg-purple-500/20 border-purple-500/30',
    buttonColor: 'bg-gradient-primary hover:opacity-90',
    popular: true,
    features: [
      '每日50次AI选品',
      '最多500个商品',
      '高级AI分析',
      '一键上架多平台',
      '数据分析报表',
      '优先技术支持'
    ]
  },
  {
    id: 'business',
    name: '企业版',
    price: 299,
    period: '月',
    icon: Building2,
    color: 'bg-yellow-500/20 border-yellow-500/30',
    buttonColor: 'bg-yellow-500 hover:bg-yellow-400',
    features: [
      '每日200次AI选品',
      '最多5000个商品',
      '企业级AI分析',
      'API接口集成',
      '高级数据分析',
      '专属客户经理',
      '定制化开发'
    ]
  }
];

export default function BillingPage() {
  const [currentPlan, setCurrentPlan] = useState<string>('free');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await billingAPI.getStatus();
        setCurrentPlan(response.data.data.plan);
      } catch (err) {
        console.error('获取订阅状态失败:', err);
      }
    };
    fetchStatus();
  }, []);

  const handleSubscribe = async (planId: string) => {
    if (planId === currentPlan) {
      setMessage('您当前已是该套餐用户');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await billingAPI.subscribe(planId);
      setMessage(response.data.message);
      setCurrentPlan(planId);
    } catch (err: any) {
      setMessage(err.response?.data?.detail || '订阅失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">订阅套餐</h1>
        <p className="text-gray-400 mt-1">选择适合您业务规模的套餐</p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-xl text-center ${
          message.includes('成功') || message.includes('已') 
            ? 'bg-green-500/20 text-green-400' 
            : 'bg-red-500/20 text-red-400'
        }`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const Icon = plan.icon;
          const isCurrentPlan = currentPlan === plan.id;
          
          return (
            <div 
              key={plan.id} 
              className={`relative ${plan.color} border rounded-2xl p-6 transition-all hover:scale-105 ${
                plan.popular ? 'ring-2 ring-purple-500' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-primary rounded-full text-xs text-white font-medium">
                  最受欢迎
                </div>
              )}

              {isCurrentPlan && (
                <div className="absolute -top-3 right-3 px-2 py-1 bg-green-500 rounded-full text-xs text-white">
                  当前
                </div>
              )}

              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-4">
                <Icon className="w-6 h-6 text-white" />
              </div>

              <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
              
              <div className="mb-4">
                <span className="text-4xl font-bold text-white">
                  {plan.price === 0 ? '免费' : `¥${plan.price}`}
                </span>
                {plan.price > 0 && (
                  <span className="text-gray-400 text-sm">/{plan.period}</span>
                )}
              </div>

              <ul className="space-y-2 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span className="text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(plan.id)}
                disabled={loading}
                className={`w-full py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-opacity disabled:opacity-50 ${plan.buttonColor}`}
              >
                {loading ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <CreditCard className="w-5 h-5" />
                )}
                <span>{isCurrentPlan ? '当前套餐' : loading ? '处理中...' : '立即订阅'}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}