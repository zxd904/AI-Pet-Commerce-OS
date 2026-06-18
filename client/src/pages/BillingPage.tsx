import { useState, useEffect } from 'react';
import { Check, Zap, Crown, Rocket, CreditCard, Sparkles, X, Smartphone, Scan, RefreshCw, Shield } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { getPlans, getUserPlan, createOrder, getOrderStatus, switchPlan, Plan } from '../services/api';
import { useUser } from '../context/UserContext';

interface PaymentState {
  orderNo: string;
  amount: number;
  qrCodeUrl: string;
  payUrl: string;
  plan: Plan;
}

const INTERNAL_TEST_EMAILS = ['test@ai-pet.com', 'admin@ai-pet.com', 'demo@ai-pet.com', 'internal@ai-pet.com'];

export default function BillingPage() {
  const { refreshUser } = useUser();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [currentPlan, setCurrentPlan] = useState<string>('free');
  const [expireTime, setExpireTime] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentState, setPaymentState] = useState<PaymentState | null>(null);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [isInternalUser, setIsInternalUser] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setUserEmail(user.email || '');
      setIsInternalUser(INTERNAL_TEST_EMAILS.includes((user.email || '').toLowerCase()));
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [plansResponse] = await Promise.all([
          getPlans()
        ]);

        if (plansResponse.success) {
          setPlans(plansResponse.data);
        }
        
        try {
          const planResponse = await getUserPlan();
          if (planResponse.success) {
            setCurrentPlan(planResponse.data.plan);
            setSelectedPlan(planResponse.data.plan);
            setExpireTime(planResponse.data.expireTime);
          }
        } catch (authError) {
          console.log('User not logged in, showing default free plan');
        }
      } catch (error) {
        console.error('Failed to fetch billing data:', error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!showPaymentModal || !paymentState) return;

    const interval = setInterval(async () => {
      try {
        setCheckingPayment(true);
        const response = await getOrderStatus(paymentState.orderNo);
        if (response && response.success && response.data && response.data.status === 'paid') {
          clearInterval(interval);
          setMessage('支付成功！会员已升级');
          setMessageType('success');
          setShowPaymentModal(false);
          setPaymentState(null);
          setCurrentPlan(response.data.plan);
          setSelectedPlan(response.data.plan);
          setExpireTime(new Date(Date.now() + (response.data.plan === 'pro' ? 30 : 365) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
        }
      } catch (error) {
        console.error('Failed to check order status:', error);
      } finally {
        setCheckingPayment(false);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [showPaymentModal, paymentState]);

  const handleSubscribe = async (planId: string) => {
    setLoading(true);
    setMessage('');
    
    try {
      const response = await createOrder(planId);
      
      if (response.success) {
        if (response.amount === 0) {
          setMessage(response.message || '已切换到免费版');
          setMessageType('success');
          setCurrentPlan('free');
          setSelectedPlan('free');
          setExpireTime(null);
        } else {
          const plan = plans.find(p => p.id === planId);
          if (plan && response.orderNo && response.amount && response.qrCodeUrl && response.payUrl) {
            setPaymentState({
              orderNo: response.orderNo,
              amount: response.amount,
              qrCodeUrl: response.qrCodeUrl,
              payUrl: response.payUrl,
              plan
            });
            setShowPaymentModal(true);
          }
        }
      } else {
        setMessage(response.error || '订阅失败');
        setMessageType('error');
      }
    } catch (error: any) {
      setMessage(error.response?.data?.error || error.response?.data?.message || '订阅失败');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchPlan = async (plan: string) => {
    setLoading(true);
    setMessage('');
    try {
      const response = await switchPlan(plan);
      if (response && response.success && response.data) {
        setMessage(response.data.message || `已切换到${getPlanName(plan)}`);
        setMessageType('success');
        setCurrentPlan(response.data.plan);
        setSelectedPlan(response.data.plan);
        setExpireTime(response.data.expireTime);
        // 调用 refreshUser 更新全局状态，所有页面立即生效
        await refreshUser();
      } else {
        setMessage(response?.error || '切换套餐失败');
        setMessageType('error');
      }
    } catch (error: any) {
      setMessage(error.response?.data?.error || '切换套餐失败');
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
      case 'enterprise':
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
      case 'enterprise':
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
      case 'enterprise':
        return 'border-purple-400 bg-purple-500/10';
      default:
        return '';
    }
  };

  const getPlanName = (planId: string) => {
    switch (planId) {
      case 'free': return '免费版';
      case 'pro': return '专业版';
      case 'enterprise': return '企业版';
      default: return planId;
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-white mb-4">选择您的套餐</h1>
        <p className="text-gray-400">升级套餐解锁更多AI选品功能</p>
      </div>

      {message && (
        <div className={`mb-8 p-4 rounded-lg ${
          messageType === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
        }`}>
          {message}
        </div>
      )}

      {currentPlan && (
        <div className="mb-8 glass-card rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">当前套餐</p>
              <p className="text-xl font-bold text-white flex items-center gap-2">
                {getPlanIcon(currentPlan)}
                {getPlanName(currentPlan)}
              </p>
              {expireTime && (
                <p className="text-gray-400 text-sm mt-1">到期时间: {expireTime}</p>
              )}
            </div>
            <div className={`px-4 py-2 rounded-full text-sm font-medium ${
              currentPlan !== 'free' && expireTime ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
            }`}>
              {currentPlan !== 'free' && expireTime ? '已激活' : '未激活'}
            </div>
          </div>

          {isInternalUser && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4 text-amber-400" />
                <span className="text-amber-400 text-sm font-medium">内测账号模式</span>
                <span className="text-gray-400 text-xs">({userEmail})</span>
              </div>
              <div className="flex gap-2">
                {['free', 'pro', 'enterprise'].map((plan) => (
                  <button
                    key={plan}
                    onClick={() => handleSwitchPlan(plan)}
                    disabled={loading || currentPlan === plan}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors disabled:opacity-50 ${
                      plan === 'free' ? 'bg-gray-600 hover:bg-gray-500 text-white' :
                      plan === 'pro' ? 'bg-indigo-600 hover:bg-indigo-500 text-white' :
                      'bg-purple-600 hover:bg-purple-500 text-white'
                    } ${currentPlan === plan ? 'ring-2 ring-white/50' : ''}`}
                  >
                    {getPlanName(plan)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

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
              {plan.id === 'enterprise' && (
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
                  <span className="text-gray-400">/{plan.billingPeriod}</span>
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
              disabled={loading || selectedPlan === plan.id && currentPlan === plan.id}
              className={`w-full ${
                plan.id === 'pro' ? 'bg-indigo-500 hover:bg-indigo-600' :
                plan.id === 'enterprise' ? 'bg-purple-500 hover:bg-purple-600' :
                'bg-gray-600 hover:bg-gray-500'
              }`}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              {loading ? '处理中...' : selectedPlan === plan.id && currentPlan === plan.id ? '已订阅' : '立即订阅'}
            </Button>
          </div>
        ))}
      </div>

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
                <td className="p-4 text-gray-300">每天AI分析</td>
                <td className="p-4 text-center">5次</td>
                <td className="p-4 text-center"><Check className="w-5 h-5 text-green-400 mx-auto" /></td>
                <td className="p-4 text-center"><Check className="w-5 h-5 text-green-400 mx-auto" /></td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="p-4 text-gray-300">基础选品功能</td>
                <td className="p-4 text-center"><Check className="w-5 h-5 text-green-400 mx-auto" /></td>
                <td className="p-4 text-center"><Check className="w-5 h-5 text-green-400 mx-auto" /></td>
                <td className="p-4 text-center"><Check className="w-5 h-5 text-green-400 mx-auto" /></td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="p-4 text-gray-300">自动生成商品标题</td>
                <td className="p-4 text-center">-</td>
                <td className="p-4 text-center"><Check className="w-5 h-5 text-green-400 mx-auto" /></td>
                <td className="p-4 text-center"><Check className="w-5 h-5 text-green-400 mx-auto" /></td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="p-4 text-gray-300">自动生成商品描述</td>
                <td className="p-4 text-center">-</td>
                <td className="p-4 text-center"><Check className="w-5 h-5 text-green-400 mx-auto" /></td>
                <td className="p-4 text-center"><Check className="w-5 h-5 text-green-400 mx-auto" /></td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="p-4 text-gray-300">热门商品推荐</td>
                <td className="p-4 text-center">-</td>
                <td className="p-4 text-center"><Check className="w-5 h-5 text-green-400 mx-auto" /></td>
                <td className="p-4 text-center"><Check className="w-5 h-5 text-green-400 mx-auto" /></td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="p-4 text-gray-300">批量选品</td>
                <td className="p-4 text-center">-</td>
                <td className="p-4 text-center">-</td>
                <td className="p-4 text-center"><Check className="w-5 h-5 text-green-400 mx-auto" /></td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="p-4 text-gray-300">API接口</td>
                <td className="p-4 text-center">-</td>
                <td className="p-4 text-center">-</td>
                <td className="p-4 text-center"><Check className="w-5 h-5 text-green-400 mx-auto" /></td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="p-4 text-gray-300">数据导出</td>
                <td className="p-4 text-center">-</td>
                <td className="p-4 text-center">-</td>
                <td className="p-4 text-center"><Check className="w-5 h-5 text-green-400 mx-auto" /></td>
              </tr>
              <tr>
                <td className="p-4 text-gray-300">团队账号</td>
                <td className="p-4 text-center">-</td>
                <td className="p-4 text-center">-</td>
                <td className="p-4 text-center"><Check className="w-5 h-5 text-green-400 mx-auto" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {showPaymentModal && paymentState && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="glass-card rounded-2xl p-8 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl ${
                  paymentState.plan.id === 'pro' ? 'bg-indigo-500/20 text-indigo-400' :
                  'bg-purple-500/20 text-purple-400'
                }`}>
                  {getPlanIcon(paymentState.plan.id)}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{paymentState.plan.name}订阅</h3>
                  <p className="text-gray-400 text-sm">¥{paymentState.amount}/{paymentState.plan.billingPeriod}</p>
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
                    src={paymentState.qrCodeUrl}
                    alt={`${paymentState.plan.name}收款码`}
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
              {checkingPayment && (
                <RefreshCw className="w-4 h-4 animate-spin" />
              )}
            </div>

            <div className={`rounded-xl p-4 ${
              paymentState.plan.id === 'pro' ? 'bg-indigo-500/10' : 'bg-purple-500/10'
            }`}>
              <h4 className={`font-medium mb-2 flex items-center gap-2 ${
                paymentState.plan.id === 'pro' ? 'text-indigo-400' : 'text-purple-400'
              }`}>
                <CreditCard className="w-4 h-4" />
                支付说明
              </h4>
              <ul className="text-gray-400 text-sm space-y-1">
                <li>• 支付成功后系统自动开通{paymentState.plan.name}</li>
                <li>• 系统正在自动检测支付状态</li>
                <li>• 如有疑问请联系客服</li>
                <li>• 支持7天无理由退款</li>
                {paymentState.plan.id === 'enterprise' && (
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
                  paymentState.plan.id === 'pro' ? 'bg-indigo-500 hover:bg-indigo-600' :
                  'bg-purple-500 hover:bg-purple-600'
                }`}
                onClick={() => {
                  window.open(paymentState.payUrl, '_blank');
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