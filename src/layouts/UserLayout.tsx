import { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  Home,
  User,
  Star,
  Coins,
  Menu,
  X,
  LogOut,
  Bell,
  Settings,
  FileText
} from 'lucide-react';

export function UserLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    window.location.href = '/';  // 강제로 페이지 새로고침하면서 이동
  };

  const menuItems = [
    { path: '/user', icon: Home, label: '대시보드' },
    { path: '/user/works', icon: FileText, label: '작업 선택' },
    { path: '/user/my-works', icon: Star, label: '내 작업' },
    { path: '/user/points', icon: Coins, label: '정산 관리' },
    { path: '/user/profile', icon: User, label: '내 정보' }
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-40 flex flex-col w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:relative lg:transform-none
      `}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">U</span>
            </div>
            <h1 className="ml-3 text-xl font-bold text-gray-900">사용자 포털</h1>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 mt-6 px-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center px-3 py-2.5 mb-1 text-sm rounded-lg transition-colors
                  ${active
                    ? 'bg-green-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                  }
                `}
              >
                <Icon className={`w-5 h-5 mr-3 ${active ? 'text-white' : 'text-gray-600'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User info */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-green-600" />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900">{user?.username || user?.name}</p>
              <p className="text-xs text-gray-500">일반 사용자</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 flex-shrink-0">
          <div className="px-6">
            <div className="flex items-center justify-between h-16">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden"
              >
                <Menu className="w-6 h-6" />
              </button>

              <div className="flex-1" />

              <div className="flex items-center space-x-3">
                <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                  <Bell className="w-5 h-5" />
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                  <Settings className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}