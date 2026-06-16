import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Target, Lightbulb, AlertCircle } from 'lucide-react';
import { analyticsAPI, AnalyticsData } from '../services/api';

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await analyticsAPI.get();
        setData(response.data.data);
      } catch (err) {
        console.error('获取数据失败:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const metricCards = [
    { 
      label: '转化率', 
      value: () => `${data?.conversion_rate || 0}%`, 
      icon: Target, 
      color: 'bg-blue-500/20 text-blue-400',
      trend: 'up'
    },
    { 
      label: '爆款成功率', 
      value: () => `${data?.success_rate || 0}%`, 
      icon: TrendingUp, 
      color: 'bg-green-500/20 text-green-400',
      trend: 'up'
    },
    { 
      label: '平均ROI', 
      value: () => `${data?.avg_roi || 0}%`, 
      icon: BarChart3, 
      color: 'bg-purple-500/20 text-purple-400',
      trend: 'up'
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">数据分析</h1>
        <p className="text-gray-400 mt-1">查看业务数据分析和优化建议</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {metricCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <div key={index} className="bg-gradient-card border-gradient rounded-xl p-5 shadow-glow">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-12 h-12 ${card.color} rounded-xl flex items-center justify-center`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className={`text-xs px-2 py-1 rounded-full ${card.trend === 'up' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      ↑ 上升趋势
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm">{card.label}</p>
                  <p className="text-3xl font-bold text-white mt-1">{card.value()}</p>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gradient-card border-gradient rounded-xl p-6 shadow-glow">
              <h2 className="text-lg font-semibold text-white mb-4">核心指标</h2>
              {data?.metrics && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">总商品数</span>
                    <span className="text-white font-semibold">{data.metrics.total_products}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">已通过商品</span>
                    <span className="text-green-400 font-semibold">{data.metrics.approved_products}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">已上架商品</span>
                    <span className="text-blue-400 font-semibold">{data.metrics.uploaded_products}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">平均评分</span>
                    <span className="text-purple-400 font-semibold">{data.metrics.avg_score.toFixed(1)}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-gradient-card border-gradient rounded-xl p-6 shadow-glow">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-5 h-5 text-yellow-400" />
                <h2 className="text-lg font-semibold text-white">优化建议</h2>
              </div>
              
              {data?.recommendations && data.recommendations.length > 0 ? (
                <div className="space-y-3">
                  {data.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                      <p className="text-gray-300 text-sm">{rec}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Lightbulb className="w-12 h-12 mx-auto mb-3 text-green-500/50" />
                  <p className="text-green-400">业务表现优秀！</p>
                  <p className="text-gray-500 text-sm mt-1">继续保持当前策略</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}