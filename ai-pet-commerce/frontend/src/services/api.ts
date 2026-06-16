import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_info');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface UserInfo {
  user_id: number;
  email: string;
  subscription_plan: string;
}

export interface Product {
  id: number;
  product_name: string;
  score: number;
  decision: string;
  reason: string;
  title: string;
  selling_points: string[];
  keywords: string[];
  video_script: string;
  price_suggestion: number;
  status: string;
  created_at: string;
}

export interface DashboardStats {
  today_selections: number;
  total_products: number;
  approved_products: number;
  pending_products: number;
  avg_score: number;
}

export interface AnalyticsData {
  conversion_rate: number;
  success_rate: number;
  avg_roi: number;
  recommendations: string[];
  metrics: {
    total_products: number;
    approved_products: number;
    uploaded_products: number;
    avg_score: number;
  };
}

export interface Plan {
  name: string;
  price: number;
  limits: {
    daily_selections: number;
    max_products: number;
    ai_analysis: boolean;
    auto_publish: boolean;
    analytics: boolean;
  };
}

export const authAPI = {
  register: (email: string, password: string, full_name?: string) =>
    api.post('/auth/register', { email, password, full_name }),
  
  login: (email: string, password: string) =>
    api.post('/auth/login', new URLSearchParams({ username: email, password }), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }),
};

export const productsAPI = {
  select: (keyword: string, count: number = 10) =>
    api.post('/products/select', { keyword, count }),
  
  analyze: (product_name: string) =>
    api.post('/products/analyze', { product_name }),
  
  generate: (product_name: string, content_types: string[] = ['title', 'selling_points', 'keywords', 'video_script']) =>
    api.post('/products/generate', { product_name, content_types }),
  
  upload: (product_id: number, platform: string) =>
    api.post('/products/upload', { product_id, platform }),
  
  list: () => api.get('/products/list'),
  
  get: (product_id: number) => api.get(`/products/${product_id}`),
  
  delete: (product_id: number) => api.delete(`/products/${product_id}`),
};

export const dashboardAPI = {
  get: () => api.get('/dashboard'),
};

export const analyticsAPI = {
  get: () => api.get('/analytics'),
};

export const billingAPI = {
  getPlans: () => api.get('/billing/plans'),
  
  subscribe: (plan: string) => api.post('/billing/subscribe', { plan }),
  
  getStatus: () => api.get('/billing/status'),
};

export const saveToken = (token: string) => localStorage.setItem('access_token', token);

export const getToken = () => localStorage.getItem('access_token');

export const removeToken = () => localStorage.removeItem('access_token');

export const saveUserInfo = (user: UserInfo) => localStorage.setItem('user_info', JSON.stringify(user));

export const getUserInfo = (): UserInfo | null => {
  const info = localStorage.getItem('user_info');
  return info ? JSON.parse(info) : null;
};

export const removeUserInfo = () => localStorage.removeItem('user_info');

export default api;