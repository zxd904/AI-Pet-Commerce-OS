import { useState } from 'react';
import { Menu, X, Zap, BarChart3, Package, Upload, TrendingUp, CreditCard, LogOut } from 'lucide-react';
import { getUserInfo, removeToken, removeUserInfo } from '../services/api';

interface NavbarProps {
  activeMenu: string;
  onMenuChange: (menu: string) => void;
}

export default function Navbar({ activeMenu, onMenuChange }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const userInfo = getUserInfo();

  const handleLogout = () => {
    removeToken();
    removeUserInfo();
    window.location.href = '/login';
  };

  const menuItems = [
    { id: 'dashboard', label: '仪表盘', icon: BarChart3 },
    { id: 'selection', label: 'AI选品', icon: Zap },
    { id: 'generate', label: '内容生成', icon: Package },
    { id: 'upload', label: '一键上架', icon: Upload },
    { id: 'analytics', label: '数据分析', icon: TrendingUp },
    { id: 'billing', label: '订阅套餐', icon: CreditCard },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-slate-900/95 via-purple-900/95 to-slate-900/95 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gradient">AI Pet Commerce</span>
          </div>

          <div className="hidden md:flex items-center gap-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => onMenuChange(item.id)}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
                    activeMenu === item.id
                      ? 'bg-purple-500/20 text-purple-400'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-4">
            {userInfo && (
              <div className="hidden md:flex items-center gap-3">
                <span className="text-gray-400 text-sm">{userInfo.email}</span>
                <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                  {userInfo.subscription_plan === 'free' ? '免费版' : userInfo.subscription_plan === 'pro' ? '专业版' : '企业版'}
                </span>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-1.5 text-gray-400 hover:text-red-400 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">退出</span>
                </button>
              </div>
            )}

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden text-white"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/10">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onMenuChange(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full px-4 py-3 rounded-lg flex items-center gap-3 transition-all ${
                    activeMenu === item.id
                      ? 'bg-purple-500/20 text-purple-400'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
            {userInfo && (
              <button
                onClick={handleLogout}
                className="w-full px-4 py-3 rounded-lg flex items-center gap-3 text-gray-400 hover:text-red-400 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>退出登录</span>
              </button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}