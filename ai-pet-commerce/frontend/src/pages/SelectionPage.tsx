import { useState } from 'react';
import { Search, Zap, Star, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { productsAPI, Product } from '../services/api';

export default function SelectionPage() {
  const [keyword, setKeyword] = useState('');
  const [count, setCount] = useState(10);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSelection = async () => {
    if (!keyword.trim()) {
      setError('请输入关键词');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await productsAPI.select(keyword.trim(), count);
      setProducts(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || '选品失败');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSelection();
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">AI智能选品</h1>
        <p className="text-gray-400 mt-1">输入关键词，AI帮您发现爆款宠物用品</p>
      </div>

      <div className="bg-gradient-card border-gradient rounded-xl p-6 shadow-glow mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="输入宠物用品关键词，如：猫砂盆、自动喂食器..."
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-12 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
          <div className="flex items-center gap-4">
            <select
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-purple-500"
            >
              <option value={5}>5个</option>
              <option value={10}>10个</option>
              <option value={15}>15个</option>
              <option value={20}>20个</option>
            </select>
            <button
              onClick={handleSelection}
              disabled={loading}
              className="bg-gradient-primary py-3 px-6 rounded-xl font-semibold text-white flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <Zap className="w-5 h-5" />
              )}
              <span>{loading ? '选品中...' : 'AI选品'}</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-500/20 text-red-400 rounded-lg text-sm">
            {error}
          </div>
        )}
      </div>

      {products.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <div key={product.id} className="bg-gradient-card border-gradient rounded-xl p-5 shadow-glow hover:border-purple-500/50 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-white flex-1">{product.product_name}</h3>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                  product.decision === 'YES' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {product.decision === 'YES' ? (
                    <><CheckCircle className="w-3 h-3" /><span>推荐</span></>
                  ) : (
                    <><XCircle className="w-3 h-3" /><span>不推荐</span></>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <Star className="w-5 h-5 text-yellow-400" />
                <span className={`text-2xl font-bold ${getScoreColor(product.score)}`}>{product.score}</span>
                <span className="text-gray-400 text-sm">分</span>
              </div>

              <p className="text-gray-400 text-sm mb-4 line-clamp-2">{product.reason}</p>

              <div className="border-t border-white/10 pt-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">建议售价</span>
                  <span className="text-purple-400 font-semibold">¥{product.price_suggestion?.toFixed(2) || '--'}</span>
                </div>
              </div>

              {product.title && (
                <div className="mt-3 p-3 bg-white/5 rounded-lg">
                  <p className="text-gray-400 text-xs mb-1">AI生成标题</p>
                  <p className="text-white text-sm">{product.title}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!loading && products.length === 0 && (
        <div className="text-center py-12">
          <Zap className="w-16 h-16 mx-auto mb-4 text-purple-500/30" />
          <p className="text-gray-400">输入关键词开始AI选品</p>
          <p className="text-gray-500 text-sm mt-2">AI将根据市场数据为您推荐爆款商品</p>
        </div>
      )}
    </div>
  );
}