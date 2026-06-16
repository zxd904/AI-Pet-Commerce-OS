import { useState, useEffect } from 'react';
import { Upload, ShoppingBag, Package, CheckCircle, RefreshCw } from 'lucide-react';
import { productsAPI, Product } from '../services/api';

const platforms = [
  { id: 'taobao', name: '淘宝', icon: ShoppingBag, color: 'bg-orange-500/20 text-orange-400' },
  { id: 'pinduoduo', name: '拼多多', icon: Package, color: 'bg-red-500/20 text-red-400' },
  { id: 'douyin', name: '抖音', icon: Upload, color: 'bg-pink-500/20 text-pink-400' },
];

export default function UploadPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [uploadingId, setUploadingId] = useState<number | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await productsAPI.list();
        const filtered = response.data.data.filter(p => p.decision === 'YES');
        setProducts(filtered);
      } catch (err) {
        console.error('获取商品失败:', err);
      }
    };
    fetchProducts();
  }, []);

  const handleUpload = async () => {
    if (!selectedProduct || !selectedPlatform) return;

    setUploadingId(selectedProduct);
    setLoading(true);

    try {
      await productsAPI.upload(selectedProduct, selectedPlatform);
      
      setProducts(prev => prev.map(p => 
        p.id === selectedProduct ? { ...p, status: 'uploaded' } : p
      ));
      
      setSelectedProduct(null);
      setSelectedPlatform('');
    } catch (err) {
      console.error('上传失败:', err);
    } finally {
      setUploadingId(null);
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">一键上架</h1>
        <p className="text-gray-400 mt-1">选择商品和平台，一键上架到各大电商平台</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-gradient-card border-gradient rounded-xl p-6 shadow-glow">
            <h2 className="text-lg font-semibold text-white mb-4">待上架商品</h2>
            
            {products.length > 0 ? (
              <div className="space-y-3">
                {products.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => setSelectedProduct(product.id)}
                    className={`p-4 rounded-xl cursor-pointer transition-all ${
                      selectedProduct === product.id
                        ? 'bg-purple-500/20 border border-purple-500/50'
                        : 'bg-white/5 hover:bg-white/10 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">{product.product_name}</p>
                        <p className="text-gray-400 text-sm">
                          评分: {product.score} | 建议售价: ¥{product.price_suggestion?.toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {product.status === 'uploaded' ? (
                          <span className="text-green-400 text-sm flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" />
                            <span>已上架</span>
                          </span>
                        ) : uploadingId === product.id ? (
                          <RefreshCw className="w-5 h-5 text-purple-400 animate-spin" />
                        ) : (
                          <span className="text-gray-400 text-sm">待上架</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                <p className="text-gray-400">暂无推荐上架的商品</p>
                <p className="text-gray-500 text-sm mt-2">前往AI选品发现爆款商品</p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-gradient-card border-gradient rounded-xl p-6 shadow-glow">
            <h2 className="text-lg font-semibold text-white mb-4">选择平台</h2>
            
            <div className="space-y-3 mb-6">
              {platforms.map((platform) => {
                const Icon = platform.icon;
                return (
                  <button
                    key={platform.id}
                    onClick={() => setSelectedPlatform(platform.id)}
                    className={`w-full p-4 rounded-xl flex items-center gap-3 transition-all ${
                      selectedPlatform === platform.id
                        ? `${platform.color} border-2 border-current`
                        : 'bg-white/5 hover:bg-white/10 border-2 border-transparent'
                    }`}
                  >
                    <div className={`w-10 h-10 ${platform.color} rounded-lg flex items-center justify-center`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-white font-medium">{platform.name}</span>
                  </button>
                );
              })}
            </div>

            {selectedProduct && (
              <div className="mb-4 p-3 bg-white/5 rounded-lg">
                <p className="text-gray-400 text-sm">已选择商品</p>
                <p className="text-white font-medium">
                  {products.find(p => p.id === selectedProduct)?.product_name}
                </p>
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={loading || !selectedProduct || !selectedPlatform}
              className="w-full bg-gradient-primary py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <Upload className="w-5 h-5" />
              )}
              <span>{loading ? '上传中...' : '一键上架'}</span>
            </button>

            <p className="text-gray-500 text-xs text-center mt-4">
              上架成功后，商品将同步到所选平台
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}