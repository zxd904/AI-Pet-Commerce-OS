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
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
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

export interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  billingPeriod: string;
  features: string[];
}

export interface OrderResponse {
  success: boolean;
  orderNo?: string;
  amount?: number;
  payUrl?: string;
  qrCodeUrl?: string;
  message?: string;
  error?: string;
}

export interface UserPlan {
  plan: string;
  expireTime: string | null;
}

export interface User {
  id: number;
  email: string;
  plan: string;
  expireTime: string | null;
}

export async function getAuthMe(): Promise<ApiResponse<User>> {
  const response = await api.get('/auth/me');
  return response.data;
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

export async function getPlans(): Promise<ApiResponse<Plan[]>> {
  const response = await api.get('/billing/plans');
  return response.data;
}

export async function getUserPlan(): Promise<ApiResponse<UserPlan>> {
  const response = await api.get('/billing/plan');
  return response.data;
}

export async function createOrder(plan: string): Promise<OrderResponse> {
  const response = await api.post('/billing/order/create', { plan });
  return response.data;
}

export async function getOrderStatus(orderNo: string): Promise<ApiResponse<{
  orderNo: string;
  status: string;
  amount: number;
  plan: string;
}>> {
  const response = await api.get('/billing/order/status', { params: { orderNo } });
  return response.data;
}

export async function switchPlan(plan: string): Promise<ApiResponse<{
  message?: string;
  plan: string;
  expireTime: string | null;
}>> {
  const response = await api.post('/billing/switch-plan', { plan });
  return response.data;
}

export interface DailyUsage {
  selectionsUsed: number;
  selectionsRemaining: number;
  selectionsLimit: number;
  generationsUsed: number;
  generationsRemaining: number;
  generationsLimit: number;
}

export async function getDailyUsage(): Promise<ApiResponse<DailyUsage>> {
  const response = await api.get('/daily-usage');
  return response.data;
}

export default api;