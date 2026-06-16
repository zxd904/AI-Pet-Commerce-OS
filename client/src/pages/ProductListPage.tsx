import { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, Filter, ArrowUpDown, Database, FileQuestion } from 'lucide-react';
import { Button, Input, Select } from '../components/ui/Button';
import { getProducts, Product, PaginationInfo } from '../services/api';
import { formatDate, getScoreColor, getRecommendationColor } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

const getDataSourceBadge = (source?: string) => {
  if (source === 'database') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs">
        <Database className="w-3 h-3" />
        真实数据
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-500/20 text-gray-400 text-xs">
      <FileQuestion className="w-3 h-3" />
      模拟数据
    </span>
  );
};

export default function ProductListPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo>({ page: 1, limit: 10, total: 0, pages: 1 });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('viralScore');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [recommendationFilter, setRecommendationFilter] = useState('all');

  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, [pagination.page, searchTerm, sortBy, sortOrder, recommendationFilter]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await getProducts({
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm || undefined,
        sortBy,
        sortOrder,
        recommendation: recommendationFilter === 'all' ? undefined : recommendationFilter
      });
      if (response.success) {
        setProducts(response.data);
        if (response.pagination) {
          setPagination(response.pagination);
        }
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = () => {
    setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= pagination.pages) {
      setPagination(prev => ({ ...prev, page }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display">
          <span className="gradient-text">产品列表</span>
        </h1>
        <p className="text-gray-400 mt-1">浏览和管理所有宠物智能用品</p>
      </div>

      {/* Filters */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="搜索产品名称..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="pl-10"
            />
          </div>

          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <Select
                value={recommendationFilter}
                onChange={(e) => {
                  setRecommendationFilter(e.target.value);
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="w-36"
              >
                <option value="all">全部等级</option>
                <option value="强烈推荐">强烈推荐</option>
                <option value="推荐">推荐</option>
                <option value="观察">观察</option>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4 text-gray-400" />
              <Select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                }}
                className="w-36"
              >
                <option value="viralScore">爆款评分</option>
                <option value="productName">产品名称</option>
                <option value="updatedAt">更新时间</option>
              </Select>
              <Button onClick={handleSort} className="h-10 px-3">
                {sortOrder === 'desc' ? '↓' : '↑'}
              </Button>
            </div>
          </div>
        </div>
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

      {/* Products Table */}
      {!loading && (
        <div className="glass-card rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left p-4 text-gray-400 font-medium text-sm">产品名称</th>
                <th className="text-center p-4 text-gray-400 font-medium text-sm">爆款评分</th>
                <th className="text-center p-4 text-gray-400 font-medium text-sm">推荐等级</th>
                <th className="text-left p-4 text-gray-400 font-medium text-sm">目标人群</th>
                <th className="text-center p-4 text-gray-400 font-medium text-sm">数据来源</th>
                <th className="text-right p-4 text-gray-400 font-medium text-sm">更新时间</th>
                <th className="text-center p-4 text-gray-400 font-medium text-sm">操作</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="p-4">
                    <div className="font-medium text-white">{product.productName}</div>
                    <div className="text-xs text-gray-500 line-clamp-1 max-w-xs">{product.painPoint}</div>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`text-xl font-bold font-display ${getScoreColor(product.viralScore)}`}>
                      {product.viralScore}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border ${getRecommendationColor(product.recommendation)}`}>
                      {product.recommendation}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="text-sm text-gray-300 line-clamp-1 max-w-xs">{product.targetUsers}</div>
                  </td>
                  <td className="p-4 text-center">
                    {getDataSourceBadge(product.dataSource)}
                  </td>
                  <td className="p-4 text-right">
                    <div className="text-sm text-gray-400">{formatDate(product.updatedAt)}</div>
                  </td>
                  <td className="p-4 text-center">
                    <Button 
                      onClick={() => navigate(`/products/${product.id}`)}
                      className="px-4 py-2 text-sm"
                    >
                      查看详情
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Empty State */}
          {products.length === 0 && (
            <div className="p-12 text-center">
              <p className="text-gray-400">暂无产品数据</p>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {!loading && products.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-gray-400 text-sm">
            显示 {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} 条，共 {pagination.total} 条
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-gray-400 text-sm w-8 text-center">{pagination.page} / {pagination.pages}</span>
            <Button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.pages}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
