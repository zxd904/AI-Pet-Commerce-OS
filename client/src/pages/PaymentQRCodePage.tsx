import { useState, useEffect } from 'react';
import { Zap, Crown, CreditCard, Smartphone, Scan } from 'lucide-react';
import { Button } from '../components/ui/Button';
import api from '../services/api';

interface PlanPayment {
  planId: string;
  name: string;
  price: number;
  qrCodeUrl: string;
  payType: string;
}

export default function PaymentQRCodePage() {
  const [proPayment, setProPayment] = useState<PlanPayment | null>(null);
  const [enterprisePayment, setEnterprisePayment] = useState<PlanPayment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPaymentData = async () => {
      try {
        setProPayment({
          planId: 'pro',
          name: '专业版订阅',
          price: 99,
          qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://pay.example.com/subscribe?plan=pro',
          payType: 'wechat'
        });

        setEnterprisePayment({
          planId: 'enterprise',
          name: '企业版订阅',
          price: 299,
          qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://pay.example.com/subscribe?plan=enterprise',
          payType: 'wechat'
        });
      } catch (error) {
        console.error('Failed to fetch payment data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentData();
  }, []);

  const handleRefreshQR = async (planId: string) => {
    setLoading(true);
    try {
      const response = await api.post('/order/create', {
        user_id: JSON.parse(localStorage.getItem('user') || '{}')?.id || 1,
        plan: planId,
        pay_type: 'alipay'
      });

      if (response.data.success) {
        if (planId === 'pro') {
          setProPayment(prev => prev ? { ...prev, qrCodeUrl: response.data.pay_url } : null);
        } else {
          setEnterprisePayment(prev => prev ? { ...prev, qrCodeUrl: response.data.pay_url } : null);
        }
      }
    } catch (error) {
      console.error('Failed to refresh QR code:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white text-lg">加载中...</div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-white mb-4">订阅支付</h1>
        <p className="text-gray-400">扫描下方收款码完成订阅，支持微信支付和支付宝</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* 专业版收款码 */}
        <div className="glass-card rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-indigo-500/20 text-indigo-400">
              <Zap className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{proPayment?.name}</h2>
              <p className="text-gray-400 text-sm">月付套餐</p>
            </div>
          </div>

          <div className="text-center mb-6">
            <div className="text-5xl font-bold text-indigo-400 mb-2">
              ¥{proPayment?.price}
              <span className="text-xl font-normal text-gray-400 ml-1">/月</span>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 mb-6">
            <div className="flex flex-col items-center">
              <div className="relative">
                <img
                  src={proPayment?.qrCodeUrl}
                  alt="专业版订阅收款码"
                  className="w-64 h-64 rounded-lg"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity rounded-lg">
                  <Scan className="w-12 h-12 text-white" />
                </div>
              </div>
              <p className="mt-4 text-gray-600 text-sm font-medium">微信支付</p>
            </div>
          </div>

          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <Smartphone className="w-4 h-4" />
              <span>打开微信扫码支付</span>
            </div>
            <Button
              className="bg-white/10 hover:bg-white/20 text-gray-300 text-sm px-3 py-1"
              onClick={() => handleRefreshQR('pro')}
              disabled={loading}
            >
              刷新
            </Button>
          </div>

          <div className="bg-indigo-500/10 rounded-xl p-4">
            <h3 className="text-indigo-400 font-medium mb-2 flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              支付说明
            </h3>
            <ul className="text-gray-400 text-sm space-y-1">
              <li>• 支付成功后系统自动开通专业版</li>
              <li>• 如有疑问请联系客服</li>
              <li>• 支持7天无理由退款</li>
            </ul>
          </div>
        </div>

        {/* 企业版收款码 */}
        <div className="glass-card rounded-2xl p-8 border-2 border-purple-500/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-purple-500/20 text-purple-400">
              <Crown className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">{enterprisePayment?.name}</h2>
                <span className="px-2 py-1 rounded-full bg-purple-500/30 text-purple-300 text-xs font-medium">
                  推荐
                </span>
              </div>
              <p className="text-gray-400 text-sm">月付套餐</p>
            </div>
          </div>

          <div className="text-center mb-6">
            <div className="text-5xl font-bold text-purple-400 mb-2">
              ¥{enterprisePayment?.price}
              <span className="text-xl font-normal text-gray-400 ml-1">/月</span>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 mb-6">
            <div className="flex flex-col items-center">
              <div className="relative">
                <img
                  src={enterprisePayment?.qrCodeUrl}
                  alt="企业版订阅收款码"
                  className="w-64 h-64 rounded-lg"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity rounded-lg">
                  <Scan className="w-12 h-12 text-white" />
                </div>
              </div>
              <p className="mt-4 text-gray-600 text-sm font-medium">微信支付</p>
            </div>
          </div>

          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <Smartphone className="w-4 h-4" />
              <span>打开微信扫码支付</span>
            </div>
            <Button
              className="bg-white/10 hover:bg-white/20 text-gray-300 text-sm px-3 py-1"
              onClick={() => handleRefreshQR('enterprise')}
              disabled={loading}
            >
              刷新
            </Button>
          </div>

          <div className="bg-purple-500/10 rounded-xl p-4">
            <h3 className="text-purple-400 font-medium mb-2 flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              支付说明
            </h3>
            <ul className="text-gray-400 text-sm space-y-1">
              <li>• 支付成功后系统自动开通企业版</li>
              <li>• 享受专属客服一对一服务</li>
              <li>• 支持7天无理由退款</li>
              <li>• 可开具增值税专用发票</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-8 glass-card rounded-xl p-6">
        <h3 className="text-white font-medium mb-4">支付方式说明</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c4.801 0 8.692-3.287 8.692-7.343 0-4.054-3.891-7.342-8.692-7.342zm-3.12 4.213c.54 0 .976.44.976.982a.97.97 0 01-.976.983.97.97 0 01-.976-.983c0-.542.436-.982.976-.982zm6.027 0c.54 0 .976.44.976.982a.97.97 0 01-.976.983.97.97 0 01-.976-.983c0-.542.436-.982.976-.982zm3.014 2.767c-1.797-.052-3.446.682-4.662 1.802-1.215 1.12-1.932 2.722-1.88 4.42.053 1.698.85 3.26 1.994 4.405 1.145 1.145 2.72 1.942 4.418 1.889 1.697-.053 3.321-.824 4.466-1.97 1.145-1.145 1.932-2.77 1.879-4.468-.053-1.698-.85-3.26-1.994-4.405-1.226-1.129-2.874-1.851-4.672-1.799zm-1.04 1.594c.472 0 .855.388.855.866a.85.85 0 01-.855.866.85.85 0 01-.855-.866c0-.478.383-.866.855-.866zm4.074 0c.472 0 .855.388.855.866a.85.85 0 01-.855.866.85.85 0 01-.855-.866c0-.478.383-.866.855-.866z"/>
              </svg>
            </div>
            <div>
              <p className="text-white font-medium">微信支付</p>
              <p className="text-gray-400 text-sm">推荐使用微信扫码支付</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
              </svg>
            </div>
            <div>
              <p className="text-white font-medium">支付宝</p>
              <p className="text-gray-400 text-sm">支持支付宝扫码支付</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}