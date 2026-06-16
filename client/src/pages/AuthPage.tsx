import { useState } from 'react';
import api from '../services/api';

interface AuthPageProps {
  onLogin: () => void;
}

export default function AuthPage({ onLogin }: AuthPageProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const response = await api.post('/auth/login', { email, password });
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
      } else {
        await api.post('/auth/register', { email, password, fullName });
        const response = await api.post('/auth/login', { email, password });
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
      }
      onLogin();
    } catch (err: any) {
      setError(err.response?.data?.error || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl">🐾</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">AI Pet Commerce OS</h1>
          <p className="text-gray-500 mt-2">智能宠物电商选品平台</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                姓名
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-gray-800 placeholder-gray-400"
                placeholder="请输入姓名"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              邮箱
            </label>
            <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-gray-800 placeholder-gray-400"
                placeholder="请输入邮箱"
                required
              />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              密码
            </label>
            <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-gray-800 placeholder-gray-400"
                placeholder="请输入密码"
                required
              />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-3 rounded-lg font-medium hover:from-indigo-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? '加载中...' : (isLogin ? '登 录' : '注 册')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-indigo-600 hover:text-indigo-800 font-medium"
          >
            {isLogin ? '还没有账号？立即注册' : '已有账号？立即登录'}
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl mb-1">🤖</div>
              <div className="text-xs text-gray-500">AI选品</div>
            </div>
            <div>
              <div className="text-2xl mb-1">📊</div>
              <div className="text-xs text-gray-500">数据分析</div>
            </div>
            <div>
              <div className="text-2xl mb-1">📦</div>
              <div className="text-xs text-gray-500">一键上架</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}