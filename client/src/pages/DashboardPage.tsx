import { useState, useEffect } from 'react';
import { LayoutDashboard, Package, Trophy, Sparkles, RefreshCw, Database, FileQuestion } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { getDashboard, runSelection, DashboardData } from '../services/api';
import { formatDate, getScoreColor, getRecommendationColor } from '../lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const getDataSourceBadge = (source?: string) => {
  if (source === 'database') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs">
        <Database className="w-3 h-3" />
        真实数据
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-500/20 text-gray-400 text-xs">
      <FileQuestion className="w-3 h-3" />
      模拟数据
    </span>
  );
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const response = await getDashboard();
      if (response.success) {
        setData(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await runSelection();
      await fetchDashboard();
    } catch (error) {
      console.error('Failed to refresh:', error);
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-accent-400" />
          <span className="text-gray-400">加载中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display">
            <span className="gradient-text">仪表盘</span>
          </h1>
          <p className="text-gray-400 mt-1">实时监控爆款选品数据</p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? '刷新中...' : '立即选品'}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">今日爆款数量</p>
              <p className="text-3xl font-bold font-display text-emerald-400 mt-2">
                {data?.todayCount || 0}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <Package className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
        </div>

        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">TOP1推荐产品</p>
              <p className="text-xl font-bold text-white mt-2 truncate">
                {data?.topProduct?.productName || '-'}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-amber-400" />
            </div>
          </div>
        </div>

        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">上次选品时间</p>
              <p className="text-sm text-white mt-2">
                {data?.lastUpdate ? formatDate(data.lastUpdate) : '-'}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center">
              <LayoutDashboard className="w-6 h-6 text-primary-400" />
            </div>
          </div>
        </div>
      </div>

      {/* TOP1 Product */}
      {data?.topProduct && (
        <div className="top-product-card rounded-xl p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 mb-4">
              <Trophy className="w-6 h-6 text-amber-400" />
              <span className="text-amber-400 font-semibold">TOP 1 爆款推荐</span>
              <Badge className={`ml-2 border ${getRecommendationColor(data.topProduct.recommendation)}`}>
                {data.topProduct.recommendation}
              </Badge>
              {getDataSourceBadge(data.topProduct.dataSource)}
            </div>
            <div className={`text-3xl font-bold font-display ${getScoreColor(data.topProduct.viralScore)}`}>
              {data.topProduct.viralScore}
              <span className="text-lg text-gray-400 ml-1">分</span>
            </div>
          </div>

          <h3 className="text-xl font-bold text-white mb-4">{data.topProduct.productName}</h3>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-gray-400 text-sm mb-2">核心痛点</p>
              <p className="text-gray-300">{data.topProduct.painPoint}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-2">爆款卖点</p>
              <ul className="space-y-1">
                {data.topProduct.sellingPoints.map((point, i) => (
                  <li key={i} className="text-gray-300 text-sm flex items-start gap-2">
                    <span className="text-accent-400 mt-1">•</span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-white/5">
            <p className="text-gray-400 text-sm">目标人群</p>
            <p className="text-gray-300">{data.topProduct.targetUsers}</p>
          </div>
        </div>
      )}

      {/* Score Trend Chart */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="w-5 h-5 text-accent-400" />
          <h3 className="font-semibold text-white">爆款评分趋势</h3>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data?.scoreTrend || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey="date" 
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              />
              <YAxis 
                domain={[0, 100]} 
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e293b', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px'
                }}
                formatter={(value: number) => [`${value}分`, '爆款评分']}
              />
              <Line 
                type="monotone" 
                dataKey="score" 
                stroke="#a855f7" 
                strokeWidth={2}
                dot={{ fill: '#a855f7', strokeWidth: 2 }}
                activeDot={{ fill: '#a855f7', strokeWidth: 0, r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function Badge({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border ${className}`}>
      {children}
    </span>
  );
}
