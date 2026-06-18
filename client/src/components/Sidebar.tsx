import { LayoutDashboard, Package, Trophy, Sparkles, Cat, Bot, LogOut, User, CreditCard, Zap, FileText } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useDailyUsage } from '../hooks/useDailyUsage';

const navItems = [
  { icon: LayoutDashboard, label: '仪表盘', path: '/' },
  { icon: Bot, label: 'Agent控制台', path: '/agent' },
  { icon: Package, label: '产品列表', path: '/products' },
  { icon: Trophy, label: '排行榜', path: '/rankings' },
  { icon: Sparkles, label: '内容生成', path: '/generator' },
  { icon: CreditCard, label: '升级套餐', path: '/billing' },
];

interface User {
  id: number;
  email: string;
  plan: string;
  expireTime: string | null;
}

interface SidebarProps {
  user: User | null;
  onLogout: () => void;
}

const planNames: Record<string, string> = {
  free: '免费版',
  pro: '专业版',
  enterprise: '企业版'
};

export default function Sidebar({ user, onLogout }: SidebarProps) {
  const location = useLocation();
  const { dailyUsage } = useDailyUsage();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 glass border-r border-white/10 z-50">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
            <Cat className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-display font-bold text-white">AI宠物选品</h1>
            <p className="text-xs text-gray-400">智能爆款分析系统</p>
          </div>
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-accent-600/20 to-primary-600/20 text-white border border-accent-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="absolute bottom-6 left-6 right-6">
        {user && (
          <div className="glass-card rounded-xl p-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{user.email}</p>
                <p className="text-xs text-gray-400">{planNames[user.plan] || user.plan}</p>
              </div>
            </div>
            {dailyUsage && (
              <div className="mt-3 pt-3 border-t border-white/10">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-400" />
                    <span className="text-gray-400">选品</span>
                    <span className="text-white">{dailyUsage.selectionsRemaining}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FileText className="w-3 h-3 text-blue-400" />
                    <span className="text-gray-400">生成</span>
                    <span className="text-white">{dailyUsage.generationsRemaining}</span>
                  </div>
                </div>
              </div>
            )}
            <button
              onClick={onLogout}
              className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm">登出</span>
            </button>
          </div>
        )}
        <div className="glass-card rounded-xl p-4">
          <p className="text-xs text-gray-400">自动选品任务</p>
          <p className="text-sm text-emerald-400 mt-1">每6小时自动执行</p>
        </div>
      </div>
    </aside>
  );
}