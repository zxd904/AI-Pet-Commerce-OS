import { useState, useEffect } from 'react';
import { Check, Zap, Crown, Rocket, CreditCard, Sparkles, X, Smartphone, Scan } from 'lucide-react';
import { Button } from '../components/ui/Button';
import api from '../services/api';

interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  billingPeriod: string;
  limits: {
    dailySelections: number;
    maxProducts: number;
    aiAnalysis: boolean;
    autoPublish: boolean;
    analytics: boolean;
    apiAccess: boolean;
  };
  features: string[];
}

interface User {
  id: number;
  email: string;
  fullName: string;
  subscriptionPlan: string;
  subscriptionStatus: string;
}

export default function BillingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentPlan, setPaymentPlan] = useState<Plan | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = localStorage.getItem('user');
        let user: User | null = null;
        
        if (userData) {
          user = JSON.parse(userData);
        }
        
        const [plansResponse, statusResponse] = await Promise.all([
          api.get('/billing/plans'),
          api.get('/billing/status')
        ]);
        
        const planList = Object.values(plansResponse.data.data) as Plan[];
        setPlans(planList);
        
        if (statusResponse.data.success && statusResponse.data.data) {
          const subscriptionData = statusResponse.data.data;
          if (user) {
            const updatedUser: User = {
              id: user.id,
              email: user.email,
              fullName: user.fullName,
              subscriptionPlan: subscriptionData.plan || 'free',
              subscriptionStatus: subscriptionData.status || 'active'
            };
            setCurrentUser(updatedUser);
            setSelectedPlan(subscriptionData.plan || 'free');
            localStorage.setItem('user', JSON.stringify(updatedUser));
          }
        } else if (user) {
          setCurrentUser(user);
          setSelectedPlan(user.subscriptionPlan);
        }
      } catch (error) {
        console.error('Failed to fetch billing data:', error);
        const userData = localStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          setCurrentUser(user);
          setSelectedPlan(user.subscriptionPlan);
        }
      }
    };
    fetchData();
  }, []);

  const handleSubscribe = async (planId: string) => {
    setLoading(true);
    setMessage('');
    
    try {
      const response = await api.post('/billing/subscribe', { plan: planId });
      
      if (response.data.success) {
        setMessage(response.data.message);
        setMessageType('success');
        
        if (response.data.data && currentUser) {
          const updatedUser: User = { ...currentUser, subscriptionPlan: planId };
          setCurrentUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
          setSelectedPlan(planId);
        }
      } else if (response.data.requiresPayment) {
        const plan = plans.find(p => p.id === planId);
        if (plan) {
          setPaymentPlan(plan);
          setShowPaymentModal(true);
        }
      } else {
        setMessage(response.data.error || '订阅失败');
        setMessageType('error');
      }
    } catch (error: any) {
      setMessage(error.response?.data?.error || error.response?.data?.message || '订阅失败');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'free':
        return <Sparkles className="w-6 h-6" />;
      case 'pro':
        return <Zap className="w-6 h-6" />;
      case 'business':
        return <Crown className="w-6 h-6" />;
      default:
        return <Rocket className="w-6 h-6" />;
    }
  };

  const getPlanColor = (planId: string) => {
    switch (planId) {
      case 'free':
        return 'border-gray-500 hover:border-gray-400';
      case 'pro':
        return 'border-indigo-500 hover:border-indigo-400';
      case 'business':
        return 'border-purple-500 hover:border-purple-400';
      default:
        return 'border-gray-500';
    }
  };

  const getSelectedColor = (planId: string) => {
    switch (planId) {
      case 'free':
        return 'border-gray-400 bg-gray-500/10';
      case 'pro':
        return 'border-indigo-400 bg-indigo-500/10';
      case 'business':
        return 'border-purple-400 bg-purple-500/10';
      default:
        return '';
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-white mb-4">选择您的套餐</h1>
        <p className="text-gray-400">升级套餐解锁更多AI选品功能</p>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-8 p-4 rounded-lg ${
          messageType === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
        }`}>
          {message}
        </div>
      )}

      {/* Current Plan */}
      {currentUser && (
        <div className="mb-8 glass-card rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">当前套餐</p>
              <p className="text-xl font-bold text-white flex items-center gap-2">
                {getPlanIcon(currentUser.subscriptionPlan)}
                {currentUser.subscriptionPlan === 'free' ? '免费版' : 
                 currentUser.subscriptionPlan === 'pro' ? '专业版' : '企业版'}
              </p>
            </div>
            <div className={`px-4 py-2 rounded-full text-sm font-medium ${
              currentUser.subscriptionStatus === 'active' 
                ? 'bg-green-500/20 text-green-400' 
                : 'bg-gray-500/20 text-gray-400'
            }`}>
              {currentUser.subscriptionStatus === 'active' ? '已激活' : '未激活'}
            </div>
          </div>
        </div>
      )}

      {/* Plans Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            onClick={() => setSelectedPlan(plan.id)}
            className={`glass-card rounded-xl p-6 cursor-pointer transition-all border-2 ${
              selectedPlan === plan.id ? getSelectedColor(plan.id) : 'border-transparent ' + getPlanColor(plan.id)
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${
                plan.id === 'free' ? 'bg-gray-500/20 text-gray-300' :
                plan.id === 'pro' ? 'bg-indigo-500/20 text-indigo-400' :
                'bg-purple-500/20 text-purple-400'
              }`}>
                {getPlanIcon(plan.id)}
              </div>
              {plan.id === 'business' && (
                <div className="px-3 py-1 rounded-full bg-purple-500/30 text-purple-300 text-xs font-medium">
                  推荐
                </div>
              )}
            </div>

            <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
            
            <div className="mb-6">
              {plan.price === 0 ? (
                <span className="text-3xl font-bold text-white">免费</span>
              ) : (
                <div>
                  <span className="text-4xl font-bold text-white">¥{plan.price}</span>
                  <span className="text-gray-400">/{plan.billingPeriod === 'month' ? '月' : '年'}</span>
                </div>
              )}
            </div>

            <ul className="space-y-3 mb-8">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2 text-gray-300">
                  <Check className="w-4 h-4 text-green-400" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            <Button
              onClick={(e) => {
                e.stopPropagation();
                handleSubscribe(plan.id);
              }}
              disabled={loading || selectedPlan === plan.id}
              className={`w-full ${
                plan.id === 'pro' ? 'bg-indigo-500 hover:bg-indigo-600' :
                plan.id === 'business' ? 'bg-purple-500 hover:bg-purple-600' :
                'bg-gray-600 hover:bg-gray-500'
              }`}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              {loading ? '处理中...' : selectedPlan === plan.id ? '已订阅' : '立即订阅'}
            </Button>
          </div>
        ))}
      </div>

      {/* Features Comparison */}
      <div className="mt-12 glass-card rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-6">功能对比</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left p-4 text-gray-400">功能</th>
                <th className="text-center p-4 text-gray-400">免费版</th>
                <th className="text-center p-4 text-gray-400">专业版</th>
                <th className="text-center p-4 text-gray-400">企业版</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-white/5">
                <td className="p-4 text-gray-300">每日AI选品</td>
                <td className="p-4 text-center">5次</td>
                <td className="p-4 text-center">50次</td>
                <td className="p-4 text-center">200次</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="p-4 text-gray-300">商品数量上限</td>
                <td className="p-4 text-center">50个</td>
                <td className="p-4 text-center">500个</td>
                <td className="p-4 text-center">5000个</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="p-4 text-gray-300">AI内容生成</td>
                <td className="p-4 text-center"><Check className="w-5 h-5 text-green-400 mx-auto" /></td>
                <td className="p-4 text-center"><Check className="w-5 h-5 text-green-400 mx-auto" /></td>
                <td className="p-4 text-center"><Check className="w-5 h-5 text-green-400 mx-auto" /></td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="p-4 text-gray-300">数据报表分析</td>
                <td className="p-4 text-center">-</td>
                <td className="p-4 text-center"><Check className="w-5 h-5 text-green-400 mx-auto" /></td>
                <td className="p-4 text-center"><Check className="w-5 h-5 text-green-400 mx-auto" /></td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="p-4 text-gray-300">一键上架多平台</td>
                <td className="p-4 text-center">-</td>
                <td className="p-4 text-center"><Check className="w-5 h-5 text-green-400 mx-auto" /></td>
                <td className="p-4 text-center"><Check className="w-5 h-5 text-green-400 mx-auto" /></td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="p-4 text-gray-300">API接口访问</td>
                <td className="p-4 text-center">-</td>
                <td className="p-4 text-center"><Check className="w-5 h-5 text-green-400 mx-auto" /></td>
                <td className="p-4 text-center"><Check className="w-5 h-5 text-green-400 mx-auto" /></td>
              </tr>
              <tr>
                <td className="p-4 text-gray-300">专属客户支持</td>
                <td className="p-4 text-center">-</td>
                <td className="p-4 text-center">-</td>
                <td className="p-4 text-center"><Check className="w-5 h-5 text-green-400 mx-auto" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment QR Code Modal */}
      {showPaymentModal && paymentPlan && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="glass-card rounded-2xl p-8 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl ${
                  paymentPlan.id === 'pro' ? 'bg-indigo-500/20 text-indigo-400' :
                  'bg-purple-500/20 text-purple-400'
                }`}>
                  {getPlanIcon(paymentPlan.id)}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{paymentPlan.name}订阅</h3>
                  <p className="text-gray-400 text-sm">¥{paymentPlan.price}/月</p>
                </div>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-2 rounded-lg hover:bg-white/10 transition"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <div className="bg-white rounded-xl p-4 mb-6">
              <div className="flex flex-col items-center">
                <div className="relative">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://pay.example.com/subscribe?plan=${paymentPlan.id}`}
                    alt={`${paymentPlan.name}收款码`}
                    className="w-56 h-56 rounded-lg"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity rounded-lg">
                    <Scan className="w-10 h-10 text-white" />
                  </div>
                </div>
                <p className="mt-3 text-gray-600 text-sm font-medium">微信支付</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-gray-400 text-sm mb-6">
              <Smartphone className="w-4 h-4" />
              <span>打开微信扫码支付</span>
            </div>

            <div className={`rounded-xl p-4 ${
              paymentPlan.id === 'pro' ? 'bg-indigo-500/10' : 'bg-purple-500/10'
            }`}>
              <h4 className={`font-medium mb-2 flex items-center gap-2 ${
                paymentPlan.id === 'pro' ? 'text-indigo-400' : 'text-purple-400'
              }`}>
                <CreditCard className="w-4 h-4" />
                支付说明
              </h4>
              <ul className="text-gray-400 text-sm space-y-1">
                <li>• 支付成功后系统自动开通{paymentPlan.name}</li>
                <li>• 如有疑问请联系客服</li>
                <li>• 支持7天无理由退款</li>
                {paymentPlan.id === 'business' && (
                  <li>• 可开具增值税专用发票</li>
                )}
              </ul>
            </div>

            <div className="mt-6 flex gap-3">
              <Button
                className="flex-1 bg-white/10 hover:bg-white/20 text-gray-300"
                onClick={() => setShowPaymentModal(false)}
              >
                关闭
              </Button>
              <Button
                className={`flex-1 ${
                  paymentPlan.id === 'pro' ? 'bg-indigo-500 hover:bg-indigo-600' :
                  'bg-purple-500 hover:bg-purple-600'
                }`}
                onClick={() => {
                  window.open(`https://pay.example.com/subscribe?plan=${paymentPlan.id}`, '_blank');
                }}
              >
                在浏览器中打开
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}