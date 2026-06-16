import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 60000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export interface Product {
  id: number;
  productName: string;
  painPoint: string;
  sellingPoints: string[];
  viralScore: number;
  targetUsers: string;
  recommendation: string;
  createdAt: string;
  updatedAt: string;
  content?: Content;
  dataSource?: string;
}

export interface Content {
  id: number;
  productId: number;
  douyinScript: string;
  xiaohongshuPost: string;
  liveScript: string;
  adTitles: string[];
  createdAt: string;
  updatedAt: string;
}

export interface DashboardData {
  todayCount: number;
  topProduct: Product | null;
  lastUpdate: string;
  scoreTrend: { date: string; score: number }[];
}

export interface RankingPeriod {
  value: string;
  label: string;
}

export const RANKING_PERIODS: RankingPeriod[] = [
  { value: '24h', label: '最近24小时' },
  { value: '7d', label: '最近7天' },
  { value: '30d', label: '最近30天' },
];

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  pagination?: PaginationInfo;
  error?: string;
}

export async function getDashboard(): Promise<ApiResponse<DashboardData>> {
  const response = await api.get('/dashboard');
  return response.data;
}

export async function getProducts(params?: {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
  recommendation?: string;
}): Promise<ApiResponse<Product[]>> {
  const response = await api.get('/products', { params });
  return response.data;
}

export async function getProduct(id: number): Promise<ApiResponse<Product>> {
  const response = await api.get(`/products/${id}`);
  return response.data;
}

export async function getRankings(period: string = '24h', limit: number = 10): Promise<ApiResponse<Product[]>> {
  const response = await api.get('/rankings', { params: { period, limit } });
  return response.data;
}

export async function runSelection(): Promise<ApiResponse<{ message: string }>> {
  const response = await api.post('/run-selection');
  return response.data;
}

export async function generateContent(productName: string): Promise<ApiResponse<{
  douyin_script: string;
  xiaohongshu_post: string;
  live_script: string;
  ad_titles: string[];
}>> {
  const response = await api.post('/generate-content', { productName });
  return response.data;
}

export default api;