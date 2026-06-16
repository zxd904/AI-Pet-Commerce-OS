import { useState, useEffect } from 'react';
import { Trophy, Medal, Award, Clock, TrendingUp } from 'lucide-react';
import { getRankings, RANKING_PERIODS, Product } from '../services/api';
import { getScoreColor, getRecommendationColor } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

export default function RankingsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('24h');

  const navigate = useNavigate();

  useEffect(() => {
    fetchRankings();
  }, [period]);

  const fetchRankings = async () => {
    setLoading(true);
    try {
      const response = await getRankings(period, 10);
      if (response.success) {
        setProducts(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch rankings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return <Trophy className="w-8 h-8 text-amber-400" />;
      case 1: return <Medal className="w-7 h-7 text-gray-300" />;
      case 2: return <Award className="w-6 h-6 text-amber-600" />;
      default: return <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-gray-400 font-bold">{index + 1}</span>;
    }
  };

  const getRankBg = (index: number) => {
    switch (index) {
      case 0: return 'bg-gradient-to-br from-amber-500/20 to-amber-600/10 border-amber-500/30';
      case 1: return 'bg-gradient-to-br from-gray-400/20 to-gray-500/10 border-gray-400/30';
      case 2: return 'bg-gradient-to-br from-amber-600/20 to-amber-700/10 border-amber-600/30';
      default: return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display">
          <span className="gradient-text">排行榜</span>
        </h1>
        <p className="text-gray-400 mt-1">爆款产品实时排名</p>
      </div>

      {/* Period Selector */}
      <div className="flex gap-2">
        {RANKING_PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              period === p.value
                ? 'bg-gradient-to-r from-accent-600 to-primary-600 text-white'
                : 'glass text-gray-400 hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4" />
            {p.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-accent-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-gray-400">加载中...</span>
          </div>
        </div>
      )}

      {/* Top 3 Cards */}
      {!loading && (
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          {products.slice(0, 3).map((product, index) => (
            <div
              key={product.id}
              onClick={() => navigate(`/products/${product.id}`)}
              className={`glass-card rounded-xl p-6 cursor-pointer transition-all hover:scale-[1.02] border ${getRankBg(index)}`}
            >
              <div className="flex items-center justify-between mb-4">
                {getRankIcon(index)}
                <span className={`text-2xl font-bold font-display ${getScoreColor(product.viralScore)}`}>
                  {product.viralScore}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{product.productName}</h3>
              <p className="text-gray-400 text-sm line-clamp-2">{product.painPoint}</p>
              <div className="mt-4 flex items-center justify-between">
                <span className={`text-xs font-medium px-2 py-1 rounded-full border ${getRecommendationColor(product.recommendation)}`}>
                  {product.recommendation}
                </span>
                <TrendingUp className="w-4 h-4 text-green-400" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Top 10 List */}
      {!loading && (
        <div className="glass-card rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left p-4 text-gray-400 font-medium text-sm w-12">#</th>
                <th className="text-left p-4 text-gray-400 font-medium text-sm">产品名称</th>
                <th className="text-center p-4 text-gray-400 font-medium text-sm">评分</th>
                <th className="text-center p-4 text-gray-400 font-medium text-sm">推荐等级</th>
                <th className="text-left p-4 text-gray-400 font-medium text-sm">目标人群</th>
                <th className="text-right p-4 text-gray-400 font-medium text-sm">操作</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product, index) => (
                <tr key={product.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="p-4">
                    {getRankIcon(index)}
                  </td>
                  <td className="p-4">
                    <div className="font-medium text-white">{product.productName}</div>
                    <div className="text-xs text-gray-500 line-clamp-1">{product.painPoint}</div>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`text-lg font-bold font-display ${getScoreColor(product.viralScore)}`}>
                      {product.viralScore}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border ${getRecommendationColor(product.recommendation)}`}>
                      {product.recommendation}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="text-sm text-gray-300 line-clamp-1">{product.targetUsers}</div>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => navigate(`/products/${product.id}`)}
                      className="text-primary-400 hover:text-primary-300 text-sm font-medium"
                    >
                      查看详情
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {products.length === 0 && (
            <div className="p-12 text-center">
              <p className="text-gray-400">暂无排名数据</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
