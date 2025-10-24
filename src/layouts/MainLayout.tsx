import { useState, useEffect } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { DeveloperSwitchButton } from '../components/DeveloperSwitchButton';
import {
  Users,
  MapPin,
  Bell,
  User,
  Menu,
  X,
  LogOut,
  Home,
  BarChart3,
  Settings,
  AlertCircle,
  ArrowLeft,
  Coins,
  CheckCircle
} from 'lucide-react';

export function MainLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pointBalance, setPointBalance] = useState<number | null>(null);

  useEffect(() => {
    if (user?.role === 'advertiser' || user?.role === 'writer') {
      fetchPointBalance();
    }
  }, [user]);

  const fetchPointBalance = async () => {
    try {
      const authData = localStorage.getItem('adr_auth');
      const { token } = authData ? JSON.parse(authData) : {};

      const response = await fetch('http://localhost:3001/api/points/balance', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        setPointBalance(data.data.available_points);
      }
    } catch (error) {
      console.error('Failed to fetch point balance:', error);
    }
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = '/';  // 강제로 페이지 새로고침하면서 이동
  };

  const menuItems: Array<{ path?: string; icon?: any; label: string; type?: 'section' }> = [
    // 메인
    { path: '/admin', icon: Home, label: '대시보드' },

    ...(user?.role !== 'advertiser' ? [
    { path: '/admin/accounts', icon: Users, label: '계정 관리' }
    ]: []), 

    // 빈 줄 구분
    { type: 'section', label: '' },

    // 플레이스/리뷰
    { path: '/admin/places', icon: MapPin, label: '플레이스 관리' },
    ...(user?.role === 'admin' || user?.role === 'developer' ? [
      { path: '/admin/review-management', icon: CheckCircle, label: '리뷰 관리' }
    ] : []),

    // 빈 줄 구분
    { type: 'section', label: '' },

    // 포인트
    ...(user?.role === 'admin' || user?.role === 'developer' ? [
      { path: '/admin/points-management', icon: Coins, label: '포인트 지급' }
    ] : []),
    // { path: '/admin/points', icon: CreditCard, label: '포인트 요청' },  // 임시 비활성화
    { path: '/admin/points-history', icon: BarChart3, label: '포인트 내역' },

    // 빈 줄 구분
    { type: 'section', label: '' },

    // 내 정보 (모든 사용자)
    { path: '/admin/profile', icon: User, label: '내 정보' },

    // 시스템 설정 (개발자만)
    ...(user?.role === 'developer' ? [
      { path: '/admin/settings', icon: Settings, label: '시스템 설정' }
    ] : [])
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <DeveloperSwitchButton />
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
        fixed inset-y-0 left-0 z-40 flex flex-col w-64 bg-gray-50 border-r border-gray-200 transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:relative lg:transform-none
      `}>
        <div className="flex items-center justify-between h-20 px-4 bg-white border-b border-gray-200">
          <div className="flex items-center">
            <div className="flex">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center -mr-2">
                <span className="text-white text-lg">●</span>
              </div>
              <div className="w-10 h-10 bg-white border-2 border-blue-600 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-lg">●</span>
              </div>
            </div>
            <h1 className="ml-3 text-xl font-bold text-gray-900">Place-UP</h1>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 mt-4 px-3 overflow-y-auto">
          {menuItems.map((item, index) => {
            // 섹션 헤더인 경우
            if (item.type === 'section') {
              // 빈 줄 구분인 경우
              if (!item.label) {
                return <div key={`section-${index}`} className="h-6" />;
              }
              return (
                <div key={`section-${index}`} className="mt-6 mb-3 px-1">
                  <p className="text-xs font-medium text-gray-500">
                    {item.label}
                  </p>
                </div>
              );
            }

            // 메뉴 아이템인 경우
            const Icon = item.icon;
            const active = isActive(item.path!);
            return (
              <Link
                key={item.path}
                to={item.path!}
                className={`
                  flex items-center px-3 py-2.5 mb-1 text-sm rounded-lg transition-colors
                  ${active
                    ? 'bg-blue-600 text-white font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                  }
                `}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                  active ? 'bg-blue-700' : 'bg-gray-100'
                }`}>
                  <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-gray-600'}`} />
                </div>
                <span className="text-base">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          {/* 포인트 정보 (광고주/작성자만) */}
          {(user?.role === 'advertiser' || user?.role === 'writer') && pointBalance !== null && (
            <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-blue-600" />
                  <span className="text-xs text-blue-600 font-medium">보유 포인트</span>
                </div>
                <span className="text-sm font-bold text-blue-700">
                  {pointBalance.toLocaleString()}P
                </span>
              </div>
            </div>
          )}

          {/* 사용자 정보 */}
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              user?.role === 'developer' ? 'bg-purple-500' : 'bg-gray-300'
            }`}>
              <User className={`w-5 h-5 ${user?.role === 'developer' ? 'text-white' : 'text-gray-600'}`} />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900">{user?.username || 'Guest'}</p>
              <p className="text-xs text-gray-500">
                {user?.role === 'developer' ? '🔧 개발자' :
                 user?.role === 'admin' ? '최고관리자' :
                 user?.role === 'distributor' ? '총판' :
                 user?.role === 'advertiser' ? '광고주' :
                 user?.role === 'writer' ? '작성자' : '사용자'}
              </p>
            </div>
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

              <div className="flex-1">
                {/* 개발자 권한 표시 */}
                {user?.role === 'developer' && !user?.switched_from && (
                  <div className="flex items-center bg-purple-50 border border-purple-200 rounded-lg px-3 py-1.5 ml-4">
                    <span className="text-sm text-purple-800 font-bold">
                      🔧 개발자 모드 활성화
                    </span>
                  </div>
                )}

                {/* 사용자 전환 상태 표시 */}
                {user?.switched_from && (
                  <div className="flex items-center bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 ml-4">
                    <AlertCircle className="w-4 h-4 text-amber-600 mr-2" />
                    <span className="text-sm text-amber-800 font-medium">
                      개발자 전환 모드: {user.name} ({user.username})
                    </span>
                    <button
                      onClick={async () => {
                        if (confirm('원래 개발자 계정으로 복귀하시겠습니까?')) {
                          try {
                            const authData = localStorage.getItem('adr_auth');
                            const { token } = authData ? JSON.parse(authData) : {};

                            const response = await fetch('http://localhost:3001/api/auth/switch-back', {
                              method: 'POST',
                              headers: {
                                'Authorization': `Bearer ${token}`
                              }
                            });

                            const data = await response.json();

                            if (data.success) {
                              // 원래 계정 정보로 재로그인
                              localStorage.setItem('adr_auth', JSON.stringify({
                                user: data.data.user,
                                token: data.data.token,
                                sessionId: data.data.sessionId
                              }));

                              localStorage.setItem('adr_token', data.data.token);
                              window.location.reload();
                            }
                          } catch (error) {
                            console.error('계정 복귀 실패:', error);
                            alert('계정 복귀 중 오류가 발생했습니다.');
                          }
                        }
                      }}
                      className="ml-3 p-1 hover:bg-amber-200 rounded transition-colors"
                      title="개발자 계정으로 복귀"
                    >
                      <ArrowLeft className="w-4 h-4 text-amber-700" />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-3">
                <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                  <Bell className="w-5 h-5" />
                </button>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                  title="로그아웃"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
    </>
  );
}