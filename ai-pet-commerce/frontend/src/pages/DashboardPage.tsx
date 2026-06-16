import { useEffect, useState } from 'react';
import { BarChart3, Zap, CheckCircle, Clock, TrendingUp, Star, ArrowUpRight } from 'lucide-react';
import { dashboardAPI, productsAPI, Product } from '../services/api';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    today_selections: 0,
    total_products: 0,
    approved_products: 0,
    pending_products: 0,
    avg_score: 0
  });
  const [topProducts, setTopProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [dashboardRes, productsRes] = await Promise.all([
          dashboardAPI.get(),
          productsAPI.list()
        ]);
        
        setStats(dashboardRes.data.data.stats);
        setTopProducts(productsRes.data.data.slice(0, 5));
      } catch (err) {
        console.error('获取数据失败:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const statCards = [
    { label: '今日选品', value: stats.today_selections, icon: Zap, color: 'bg-yellow-500/20 text-yellow-400' },
    { label: '商品总数', value: stats.total_products, icon: BarChart3, color: 'bg-blue-500/20 text-blue-400' },
    { label: '已通过', value: stats.approved_products, icon: CheckCircle, color: 'bg-green-500/20 text-green-400' },
    { label: '待审核', value: stats.pending_products, icon: Clock, color: 'bg-purple-500/20 text-purple-400' },
    { label: '平均评分', value: stats.avg_score, icon: Star, color: 'bg-orange-500/20 text-orange-400' },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">仪表盘</h1>
        <p className="text-gray-400 mt-1">欢迎回来，查看您的业务概览</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
            {statCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <div key={index} className="bg-gradient-card border-gradient rounded-xl p-4 shadow-glow">
                  <div className={`w-10 h-10 ${card.color} rounded-lg flex items-center justify-center mb-3`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <p className="text-gray-400 text-sm">{card.label}</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {typeof card.value === 'number' && card.value % 1 !== 0 ? card.value.toFixed(1) : card.value}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gradient-card border-gradient rounded-xl p-6 shadow-glow">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">TOP爆款推荐</h2>
                <button className="flex items-center gap-1 text-purple-400 hover:text-purple-300 text-sm">
                  <span>查看全部</span>
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-3">
                {topProducts.length > 0 ? (
                  topProducts.map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                      <div>
                        <p className="text-white font-medium">{product.product_name}</p>
                        <p className="text-gray-400 text-sm">{product.reason}</p>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-bold ${product.score >= 75 ? 'text-green-400' : product.score >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {product.score}分
                        </div>
                        <div className={`text-xs ${product.decision === 'YES' ? 'text-green-400' : 'text-red-400'}`}>
                          {product.decision === 'YES' ? '推荐上架' : '不推荐'}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>暂无爆款商品</p>
                    <p className="text-sm">点击AI选品开始发现爆款</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gradient-card border-gradient rounded-xl p-6 shadow-glow">
              <h2 className="text-lg font-semibold text-white mb-4">快速操作</h2>
              <div className="grid grid-cols-2 gap-4">
                <button className="p-4 bg-gradient-primary rounded-xl text-white text-center hover:opacity-90 transition-opacity">
                  <Zap className="w-8 h-8 mx-auto mb-2" />
                  <p className="font-medium">AI智能选品</p>
                  <p className="text-xs text-white/70 mt-1">发现爆款商品</p>
                </button>
                <button className="p-4 bg-blue-500/20 border border-blue-500/30 rounded-xl text-blue-400 text-center hover:bg-blue-500/30 transition-colors">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2" />
                  <p className="font-medium">内容生成</p>
                  <p className="text-xs text-blue-300/70 mt-1">自动生成标题卖点</p>
                </button>
                <button className="p-4 bg-green-500/20 border border-green-500/30 rounded-xl text-green-400 text-center hover:bg-green-500/30 transition-colors">
                  <TrendingUp className="w-8 h-8 mx-auto mb-2" />
                  <p className="font-medium">一键上架</p>
                  <p className="text-xs text-green-300/70 mt-1">多平台发布</p>
                </button>
                <button className="p-4 bg-orange-500/20 border border-orange-500/30 rounded-xl text-orange-400 text-center hover:bg-orange-500/30 transition-colors">
                  <BarChart3 className="w-8 h-8 mx-auto mb-2" />
                  <p className="font-medium">数据分析</p>
                  <p className="text-xs text-orange-300/70 mt-1">查看业绩报告</p>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}