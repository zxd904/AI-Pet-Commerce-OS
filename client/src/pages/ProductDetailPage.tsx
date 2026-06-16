import { useState, useEffect } from 'react';
import { ArrowLeft, Copy, Check, Zap, Users, Target, DollarSign, Video, Heart, Radio } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { getProduct, Product } from '../services/api';
import { formatDate, getScoreColor, getRecommendationColor } from '../lib/utils';
import { useNavigate, useParams } from 'react-router-dom';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchProduct(parseInt(id));
    }
  }, [id]);

  const fetchProduct = async (productId: number) => {
    setLoading(true);
    try {
      const response = await getProduct(productId);
      if (response.success) {
        setProduct(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch product:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-accent-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-400">加载中...</span>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">产品不存在</p>
        <Button onClick={() => navigate('/products')} className="mt-4">
          返回产品列表
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button onClick={() => navigate('/products')} className="bg-white/10 hover:bg-white/20 hover:from-transparent hover:to-transparent">
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回列表
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-display text-white">{product.productName}</h1>
          <p className="text-gray-400 text-sm mt-1">最后更新: {formatDate(product.updatedAt)}</p>
        </div>
      </div>

      {/* Product Summary */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <span className={`text-4xl font-bold font-display ${getScoreColor(product.viralScore)}`}>
              {product.viralScore}
            </span>
            <span className="text-gray-400">爆款评分</span>
            <span className={`px-4 py-2 rounded-full text-sm font-medium border ${getRecommendationColor(product.recommendation)}`}>
              {product.recommendation}
            </span>
          </div>
        </div>
      </div>

      {/* Product Analysis */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-red-400" />
            <h3 className="font-semibold text-white">核心痛点</h3>
          </div>
          <p className="text-gray-300">{product.painPoint}</p>
        </div>

        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-primary-400" />
            <h3 className="font-semibold text-white">目标人群</h3>
          </div>
          <p className="text-gray-300">{product.targetUsers}</p>
        </div>
      </div>

      {/* Selling Points */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-accent-400" />
          <h3 className="font-semibold text-white">爆款卖点</h3>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {product.sellingPoints.map((point, i) => (
            <div key={i} className="bg-black/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full bg-accent-500/20 flex items-center justify-center text-accent-400 text-sm font-bold">
                  {i + 1}
                </span>
                <span className="text-accent-400 font-medium">卖点</span>
              </div>
              <p className="text-gray-300 text-sm">{point}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Content Section */}
      {product.content && (
        <>
          {/* Douyin Script */}
          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Video className="w-5 h-5 text-pink-400" />
                <h3 className="font-semibold text-white">抖音脚本</h3>
              </div>
              <Button onClick={() => handleCopy(product.content?.douyinScript || '', 'douyin')} className="h-8 px-3">
                {copied === 'douyin' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <pre className="bg-black/20 rounded-lg p-4 text-gray-300 text-sm whitespace-pre-wrap font-sans">
              {product.content.douyinScript}
            </pre>
          </div>

          {/* Xiaohongshu Content */}
          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-400" />
                <h3 className="font-semibold text-white">小红书文案</h3>
              </div>
              <Button onClick={() => handleCopy(product.content?.xiaohongshuPost || '', 'xiaohongshu')} className="h-8 px-3">
                {copied === 'xiaohongshu' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <pre className="bg-black/20 rounded-lg p-4 text-gray-300 text-sm whitespace-pre-wrap font-sans">
              {product.content.xiaohongshuPost}
            </pre>
          </div>

          {/* Live Script */}
          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-emerald-400" />
                <h3 className="font-semibold text-white">直播话术</h3>
              </div>
              <Button onClick={() => handleCopy(product.content?.liveScript || '', 'live')} className="h-8 px-3">
                {copied === 'live' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <pre className="bg-black/20 rounded-lg p-4 text-gray-300 text-sm whitespace-pre-wrap font-sans">
              {product.content.liveScript}
            </pre>
          </div>

          {/* Ad Titles */}
          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="w-5 h-5 text-amber-400" />
              <h3 className="font-semibold text-white">广告标题</h3>
            </div>
            <div className="space-y-3">
              {product.content.adTitles.map((title, i) => (
                <div key={i} className="flex items-center justify-between bg-black/20 rounded-lg p-3">
                  <span className="text-amber-400 font-medium">{title}</span>
                  <Button onClick={() => handleCopy(title, `title-${i}`)} className="h-6 px-2 text-xs">
                    {copied === `title-${i}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
