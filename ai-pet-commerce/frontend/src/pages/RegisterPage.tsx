import { useState } from 'react';
import { Zap, Mail, Lock, User, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { authAPI, saveToken, saveUserInfo } from '../services/api';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    setLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('密码长度至少6位');
      setLoading(false);
      return;
    }

    try {
      const response = await authAPI.register(email, password, fullName);
      const data = response.data;

      saveToken(data.access_token);
      saveUserInfo({
        user_id: data.user_id,
        email: data.email,
        subscription_plan: data.subscription_plan
      });

      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.response?.data?.detail || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRegister();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gradient mb-2">AI Pet Commerce</h1>
          <p className="text-gray-400">AI驱动的智能选品系统</p>
        </div>

        <div className="bg-gradient-card border-gradient rounded-2xl p-6 shadow-glow">
          <h2 className="text-xl font-semibold text-white mb-6">注册</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">用户名</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="请输入用户名"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">邮箱</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="your@email.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">密码</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="至少6位密码"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">确认密码</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="再次输入密码"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
            </div>

            <button
              onClick={handleRegister}
              disabled={loading || !email || !password || !confirmPassword}
              className="w-full bg-gradient-primary py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>注册</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          <div className="mt-6 text-center">
            <span className="text-gray-400 text-sm">已有账号？</span>
            <a href="/login" className="ml-2 text-purple-400 hover:text-purple-300 transition-colors">
              立即登录
            </a>
          </div>
        </div>

        <p className="text-center text-gray-500 text-xs mt-6">
          注册即表示同意我们的服务条款和隐私政策
        </p>
      </div>
    </div>
  );
}