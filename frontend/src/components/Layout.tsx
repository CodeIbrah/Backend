import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  LayoutDashboard, Users, Activity, BarChart3, FileText,
  HeartPulse, CreditCard, Settings, LogOut, Menu, X,
  Bell, Search, ChevronDown, Shield,
} from 'lucide-react';
import { Avatar, AvatarFallback, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '../components/ui';

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
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <TooltipProvider>
      <div className="flex h-screen bg-background">
        <aside className={`${collapsed ? 'w-[72px]' : 'w-[260px]'} bg-card border-r border-border flex flex-col transition-all duration-300 ease-in-out flex-shrink-0`}>
          <div className="flex items-center h-16 px-4 border-b border-border">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-white" />
              </div>
              {!collapsed && <span className="text-lg font-bold text-foreground truncate">Admin Panel</span>}
            </div>
            <button onClick={() => setCollapsed(!collapsed)} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">
              {collapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4" />}
            </button>
          </div>

          <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
            {navItems.map(({ path, icon: Icon, label }) => {
              const active = location.pathname === path;
              return (
                <Tooltip key={path} delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Link
                      to={path}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative ${active ? 'bg-indigo-600/10 text-indigo-400' : 'text-muted-foreground hover:bg-accent hover:text-foreground'}`}
                    >
                      {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-indigo-500 rounded-r" />}
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      {!collapsed && <span className="text-sm font-medium">{label}</span>}
                    </Link>
                  </TooltipTrigger>
                  {collapsed && <TooltipContent side="right">{label}</TooltipContent>}
                </Tooltip>
              );
            })}
          </nav>

          <div className="p-3 border-t border-border">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-accent transition-colors">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-indigo-600/20 text-indigo-400 text-sm font-medium">
                      {user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  {!collapsed && (
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-medium text-foreground truncate">{user?.name || user?.email}</p>
                      <p className="text-xs text-muted-foreground truncate">{user?.role}</p>
                    </div>
                  )}
                  {!collapsed && <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium text-foreground">{user?.name || 'User'}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-400 focus:text-red-400">
                  <LogOut className="w-4 h-4 mr-2" />Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </aside>

        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 bg-card/80 backdrop-blur-sm border-b border-border flex items-center justify-between px-6 flex-shrink-0">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative max-w-md flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="text" placeholder="Search anything..." className="w-full bg-background border border-input rounded-lg pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="relative p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
              </button>
            </div>
          </header>

          <main className="flex-1 overflow-auto p-6">
            <div className="max-w-7xl mx-auto animate-fade-in">{children}</div>
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
