import { useState, useEffect } from 'react';
import { Play, RefreshCw, TrendingUp, Package, CheckCircle, XCircle, Clock, BarChart3, Eye, FileQuestion, Zap, FileText } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useUser } from '../context/UserContext';
import { useDailyUsage } from '../hooks/useDailyUsage';

interface Product {
  id: number;
  title: string;
  price: number;
  score: number;
  level: string;
  decision: string;
  status: string;
  profitMargin: number;
  source: string;
  shopifyId?: string;
  douyinProductId?: string;
  douyinStatus?: string;
}

interface RawProduct {
  title: string;
  price: number;
  sales_volume: number;
  rating: number;
  review_count: number;
  category: string;
  image_url: string;
  supplier_price: number;
  shipping_cost: number;
  source: string;
  source_url: string;
  dataSource: string;
}

interface Log {
  id: number;
  action: string;
  result: string;
  message: string;
  createdAt: string;
  product?: { title: string };
}

interface DashboardStats {
  total: number;
  listed: number;
  draft: number;
  rejected: number;
  avgScore: number;
}

export default function AgentConsolePage() {
  const [isRunning, setIsRunning] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'products' | 'logs' | 'rawData'>('products');
  const [rawProducts, setRawProducts] = useState<RawProduct[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);

  const { isProOrAbove } = useUser();
  const { dailyUsage } = useDailyUsage();
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchDashboard();
    fetchProducts();
    fetchLogs();
  }, []);

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  });

  const fetchRawData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/agent/run-scan', {
        method: 'POST',
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success && data.data.products) {
        setRawProducts(data.data.products);
        setActiveTab('rawData');
      } else {
        alert(`获取失败: ${data.message || '未知错误'}`);
      }
    } catch (error) {
      console.error('获取原始数据失败:', error);
      alert('获取原始数据失败，请检查网络连接');
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/agent/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setStats(data.data.stats);
      }
    } catch (error) {
      console.error('获取仪表盘失败:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch('/agent/products/top?limit=20', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setProducts(data.data);
      }
    } catch (error) {
      console.error('获取商品失败:', error);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch('/agent/logs?limit=50', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setLogs(data.data.logs);
      }
    } catch (error) {
      console.error('获取日志失败:', error);
    }
  };

  const runAutoSelection = async () => {
    setLoading(true);
    setIsRunning(true);
    try {
      const res = await fetch('/agent/auto-list', {
        method: 'POST',
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        fetchDashboard();
        fetchProducts();
        fetchLogs();
      } else {
        alert(`选品失败: ${data.message || '未知错误'}`);
      }
    } catch (error) {
      console.error('自动选品失败:', error);
      alert('自动选品失败，请检查网络连接');
    } finally {
      setLoading(false);
      setIsRunning(false);
    }
  };

  const runScan = async () => {
    setLoading(true);
    try {
      const res = await fetch('/agent/run-scan', {
        method: 'POST',
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setRawProducts(data.data.products);
        setActiveTab('rawData');
      } else {
        alert(`扫描失败: ${data.message || '未知错误'}`);
      }
    } catch (error) {
      console.error('扫描失败:', error);
      alert('扫描失败，请检查网络连接');
    } finally {
      setLoading(false);
    }
  };

  const publishProduct = async (productId: number) => {
    try {
      const res = await fetch('/agent/publish-product', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ productId })
      });
      const data = await res.json();
      if (data.success) {
        alert('上架成功！');
        fetchProducts();
        fetchLogs();
      } else {
        alert(`上架失败: ${data.message}`);
      }
    } catch (error) {
      console.error('上架失败:', error);
    }
  };

  const rollbackProduct = async (productId: number) => {
    try {
      const res = await fetch('/agent/rollback-product', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ productId })
      });
      const data = await res.json();
      if (data.success) {
        alert('回滚成功！');
        fetchProducts();
        fetchLogs();
      }
    } catch (error) {
      console.error('回滚失败:', error);
    }
  };

  const publishToDouyin = async (productId: number) => {
    try {
      const res = await fetch('/agent/publish-douyin', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ productId })
      });
      const data = await res.json();
      if (data.success) {
        alert('抖音上架成功！');
        fetchProducts();
        fetchLogs();
      } else {
        alert(`抖音上架失败: ${data.message}`);
      }
    } catch (error) {
      console.error('抖音上架失败:', error);
    }
  };

  const getDataSourceBadge = (source?: string) => {
    if (source === 'database') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs">
          <BarChart3 className="w-3 h-3" />
          真实数据
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs">
        <FileQuestion className="w-3 h-3" />
        模拟数据
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {showSuccess && (
        <div className="fixed top-20 right-6 z-50 animate-pulse bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          自动选品成功！
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display">
            <span className="gradient-text">AI Agent 控制台</span>
          </h1>
          <p className="text-gray-400 mt-1">自动化选品与上架管理</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={runScan} disabled={loading} className="bg-blue-500 hover:bg-blue-600">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            扫描数据源
          </Button>
          <Button onClick={fetchRawData} disabled={loading} className="bg-amber-500 hover:bg-amber-600">
            <Eye className="w-4 h-4 mr-2" />
            查看模拟数据
          </Button>
          <Button onClick={runAutoSelection} disabled={isRunning || loading} className="bg-purple-500 hover:bg-purple-600">
            <Play className={`w-4 h-4 mr-2 ${isRunning ? 'animate-pulse' : ''}`} />
            {isRunning ? '选品中...' : '启动自动选品'}
          </Button>
        </div>
      </div>

      {/* Daily Usage Info */}
      {dailyUsage && (
        <div className="glass-card rounded-xl p-4">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              <div>
                <span className="text-gray-400 text-sm">AI选品</span>
                <span className="ml-2 text-white font-medium">
                  {dailyUsage.selectionsUsed} / {dailyUsage.selectionsLimit}
                </span>
                <span className="ml-1 text-gray-500 text-xs">
                  (今日剩余 {dailyUsage.selectionsRemaining} 次)
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-400" />
              <div>
                <span className="text-gray-400 text-sm">内容生成</span>
                <span className="ml-2 text-white font-medium">
                  {dailyUsage.generationsUsed} / {dailyUsage.generationsLimit}
                </span>
                <span className="ml-1 text-gray-500 text-xs">
                  (今日剩余 {dailyUsage.generationsRemaining} 次)
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">总商品数</p>
              <p className="text-3xl font-bold font-display text-blue-400 mt-2">{stats?.total || 0}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </div>
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">已上架</p>
              <p className="text-3xl font-bold font-display text-green-400 mt-2">{stats?.listed || 0}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </div>
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">待审核</p>
              <p className="text-3xl font-bold font-display text-yellow-400 mt-2">{stats?.draft || 0}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-400" />
            </div>
          </div>
        </div>
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">已拒绝</p>
              <p className="text-3xl font-bold font-display text-red-400 mt-2">{stats?.rejected || 0}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
              <XCircle className="w-6 h-6 text-red-400" />
            </div>
          </div>
        </div>
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">平均评分</p>
              <p className="text-3xl font-bold font-display text-purple-400 mt-2">{stats?.avgScore || 0}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <Button
          onClick={() => setActiveTab('products')}
          className={activeTab === 'products' 
            ? 'bg-purple-500 hover:bg-purple-600' 
            : 'bg-transparent border border-white/20 hover:bg-white/5'}
        >
          商品列表
        </Button>
        <Button
          onClick={() => setActiveTab('logs')}
          className={activeTab === 'logs' 
            ? 'bg-purple-500 hover:bg-purple-600' 
            : 'bg-transparent border border-white/20 hover:bg-white/5'}
        >
          执行日志
        </Button>
        <Button
          onClick={() => setActiveTab('rawData')}
          className={activeTab === 'rawData' 
            ? 'bg-amber-500 hover:bg-amber-600' 
            : 'bg-transparent border border-white/20 hover:bg-white/5'}
        >
          原始数据源
        </Button>
      </div>

      {activeTab === 'products' && (
        <div className="glass-card rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left p-4 text-gray-400 font-medium">商品名称</th>
                <th className="text-left p-4 text-gray-400 font-medium">价格</th>
                <th className="text-left p-4 text-gray-400 font-medium">评分</th>
                <th className="text-left p-4 text-gray-400 font-medium">利润率</th>
                <th className="text-left p-4 text-gray-400 font-medium">来源</th>
                <th className="text-left p-4 text-gray-400 font-medium">状态</th>
                <th className="text-left p-4 text-gray-400 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400">
                    暂无商品数据
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="p-4">
                      <div className="font-medium">{product.title}</div>
                      <div className="text-xs text-gray-500 mt-1">ID: {product.id}</div>
                    </td>
                    <td className="p-4">${product.price}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          product.score >= 80 ? 'bg-green-500/20 text-green-400' :
                          product.score >= 60 ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {product.score}
                        </span>
                        <span className="text-xs text-gray-500">{product.level}</span>
                      </div>
                    </td>
                    <td className="p-4">{product.profitMargin}%</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        product.source === 'amazon' ? 'bg-blue-500/20 text-blue-400' :
                        product.source === 'aliexpress' ? 'bg-orange-500/20 text-orange-400' :
                        product.source === '1688' ? 'bg-red-500/20 text-red-400' :
                        'bg-pink-500/20 text-pink-400'
                      }`}>
                        {product.source.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        product.status === 'listed' ? 'bg-green-500/20 text-green-400' :
                        product.status === 'draft' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {product.status === 'listed' ? '已上架' : product.status === 'draft' ? '待上架' : '已拒绝'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      {product.status === 'draft' && (
                        <div className="flex gap-2 justify-center">
                          {isProOrAbove ? (
                            <>
                              <Button
                                onClick={() => publishProduct(product.id)}
                                className="h-8 px-3 bg-green-500 hover:bg-green-600"
                              >
                                上架
                              </Button>
                              <Button
                                onClick={() => publishToDouyin(product.id)}
                                className="h-8 px-3 bg-pink-500 hover:bg-pink-600"
                              >
                                抖音
                              </Button>
                            </>
                          ) : (
                            <span className="text-xs text-gray-500">升级专业版解锁上架功能</span>
                          )}
                        </div>
                      )}
                      {product.status === 'listed' && (
                        <div className="flex gap-2 justify-center">
                          {isProOrAbove ? (
                            <>
                              <Button
                                onClick={() => rollbackProduct(product.id)}
                                className="h-8 px-3 bg-white/10 hover:bg-white/20 text-gray-300"
                              >
                                回滚
                              </Button>
                              {!product.douyinProductId && (
                                <Button
                                  onClick={() => publishToDouyin(product.id)}
                                  className="h-8 px-3 bg-pink-500 hover:bg-pink-600"
                                >
                                  抖音
                                </Button>
                              )}
                              {product.douyinProductId && (
                                <span className="text-xs text-pink-400">
                                  抖音: {product.douyinStatus || '已提交'}
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-xs text-gray-500">升级专业版解锁操作功能</span>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="glass-card rounded-xl p-6">
          {logs.length === 0 ? (
            <div className="text-center text-gray-400 py-8">暂无日志数据</div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg bg-white/5">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    log.result === 'SUCCESS' ? 'bg-green-500' :
                    log.result === 'ERROR' ? 'bg-red-500' :
                    'bg-yellow-500'
                  }`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{log.action}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        log.result === 'SUCCESS' ? 'bg-green-500/20 text-green-400' :
                        log.result === 'ERROR' ? 'bg-red-500/20 text-red-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {log.result}
                      </span>
                    </div>
                    <div className="text-sm text-gray-400 mt-1">{log.message}</div>
                    {log.product && (
                      <div className="text-xs text-gray-500 mt-1">商品: {log.product.title}</div>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(log.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'rawData' && (
        <div className="glass-card rounded-xl p-6">
          {rawProducts.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <FileQuestion className="w-12 h-12 mx-auto mb-4 text-gray-600" />
              <p>暂无原始数据</p>
              <p className="text-sm mt-2">点击上方"扫描数据源"或"查看模拟数据"按钮获取数据</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left p-3 text-gray-400 font-medium text-sm">商品名称</th>
                    <th className="text-left p-3 text-gray-400 font-medium text-sm">价格</th>
                    <th className="text-left p-3 text-gray-400 font-medium text-sm">销量</th>
                    <th className="text-left p-3 text-gray-400 font-medium text-sm">评分</th>
                    <th className="text-left p-3 text-gray-400 font-medium text-sm">评论数</th>
                    <th className="text-left p-3 text-gray-400 font-medium text-sm">类目</th>
                    <th className="text-left p-3 text-gray-400 font-medium text-sm">成本</th>
                    <th className="text-left p-3 text-gray-400 font-medium text-sm">来源</th>
                    <th className="text-left p-3 text-gray-400 font-medium text-sm">数据类型</th>
                  </tr>
                </thead>
                <tbody>
                  {rawProducts.map((product, index) => (
                    <tr key={index} className="border-b border-white/5 hover:bg-white/5">
                      <td className="p-3 text-sm max-w-xs truncate">{product.title}</td>
                      <td className="p-3 text-sm">${product.price}</td>
                      <td className="p-3 text-sm">{product.sales_volume.toLocaleString()}</td>
                      <td className="p-3 text-sm">{product.rating}</td>
                      <td className="p-3 text-sm">{product.review_count.toLocaleString()}</td>
                      <td className="p-3 text-sm">{product.category}</td>
                      <td className="p-3 text-sm">${product.supplier_price}</td>
                      <td className="p-3 text-sm">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          product.source === 'amazon' ? 'bg-blue-500/20 text-blue-400' :
                          product.source === 'aliexpress' ? 'bg-orange-500/20 text-orange-400' :
                          product.source === '1688' ? 'bg-red-500/20 text-red-400' :
                          'bg-pink-500/20 text-pink-400'
                        }`}>
                          {product.source.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-3">
                        {getDataSourceBadge(product.dataSource)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}