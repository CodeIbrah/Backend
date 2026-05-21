import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  LayoutDashboard, Users, Activity, BarChart3, FileText,
  HeartPulse, CreditCard, Settings, LogOut, Menu, X,
  Bell, Search, ChevronDown, Shield,
} from 'lucide-react';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/users', icon: Users, label: 'Users' },
  { path: '/activity', icon: Activity, label: 'Activity' },
  { path: '/analytics', icon: BarChart3, label: 'Analytics' },
  { path: '/reports', icon: FileText, label: 'Reports' },
  { path: '/health', icon: HeartPulse, label: 'Health' },
  { path: '/payments', icon: CreditCard, label: 'Payments' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  useEffect(() => {
    setUserMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-[#0a0a0f]">
      {/* Sidebar */}
      <aside className={`${collapsed ? 'w-[72px]' : 'w-[260px]'} bg-[#0a0a0f] border-r border-[#2a2a3e] flex flex-col transition-all duration-300 ease-in-out flex-shrink-0`}>
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b border-[#2a2a3e]">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-white" />
            </div>
            {!collapsed && <span className="text-lg font-bold text-white truncate">Admin Panel</span>}
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg hover:bg-[#1a1a2e] text-[#6a6a82] hover:text-white transition-colors flex-shrink-0"
          >
            {collapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4" />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map(({ path, icon: Icon, label }) => {
            const active = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative
                  ${active
                    ? 'bg-indigo-600/10 text-indigo-400'
                    : 'text-[#6a6a82] hover:bg-[#1a1a2e] hover:text-white'
                  }
                `}
              >
                {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-indigo-500 rounded-r" />}
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span className="text-sm font-medium">{label}</span>}
                {collapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-[#1a1a2e] border border-[#2a2a3e] rounded-md text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                    {label}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-[#2a2a3e]">
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-[#1a1a2e] transition-colors"
            >
              <div className="w-8 h-8 bg-indigo-600/20 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-medium text-indigo-400">
                  {user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              {!collapsed && (
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium text-white truncate">{user?.name || user?.email}</p>
                  <p className="text-xs text-[#6a6a82] truncate">{user?.role}</p>
                </div>
              )}
              {!collapsed && <ChevronDown className="w-4 h-4 text-[#6a6a82] flex-shrink-0" />}
            </button>

            {userMenuOpen && !collapsed && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-[#12121a] border border-[#2a2a3e] rounded-lg shadow-xl animate-fade-in">
                <div className="p-3 border-b border-[#2a2a3e]">
                  <p className="text-sm font-medium text-white">{user?.name || 'User'}</p>
                  <p className="text-xs text-[#6a6a82]">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-[#0a0a0f]/80 backdrop-blur-sm border-b border-[#2a2a3e] flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6a6a82]" />
              <input
                type="text"
                placeholder="Search anything..."
                className="w-full bg-[#12121a] border border-[#2a2a3e] rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-[#6a6a82] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-lg hover:bg-[#1a1a2e] text-[#6a6a82] hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
