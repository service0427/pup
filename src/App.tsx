import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AccountsPageV2 } from './pages/AccountsPageV2';
import { PlacesPage } from './pages/PlacesPage';
import { PlaceDetailPage } from './pages/PlaceDetailPage';
import { PointRequestsPage } from './pages/PointRequestsPage';
import { PointManagementPage } from './pages/PointManagementPage';
import { ReviewManagementPage } from './pages/ReviewManagementPage';
import { PointHistoryPage } from './pages/PointHistoryPage';
import { SystemSettingsPage } from './pages/SystemSettingsPage';
import { ProfilePage } from './pages/ProfilePage';
import { WorkListPage } from './pages/user/WorkListPage';
import { MyWorksPage } from './pages/user/MyWorksPage';
import { WritePage } from './pages/user/WritePage';
import { MainLayout } from './layouts/MainLayout';
import { UserLayout } from './layouts/UserLayout';
import { useAuth } from './hooks/useAuth';

// 보호된 라우트 컴포넌트
function ProtectedRoute({ children, allowedRoles, isAdmin = false }: { children: React.ReactNode, allowedRoles?: string[], isAdmin?: boolean }) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    // 관리자 영역 접근 시도면 관리자 로그인 페이지로
    if (isAdmin) {
      return <Navigate to="/admin/login" replace />;
    }
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // 권한이 없으면 적절한 페이지로 리다이렉트
    if (user.role === 'writer') {
      return <Navigate to="/user" replace />;
    } else {
      return <Navigate to="/admin" replace />;
    }
  }

  return <>{children}</>;
}

// 사용자 대시보드 컴포넌트
function UserDashboard() {
  const { user } = useAuth();

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
        <p className="mt-1 text-gray-600">환영합니다, {user?.name || user?.username}님!</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-medium text-gray-600">보유 포인트</h2>
            <span className="text-green-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900">1,250 P</p>
          <p className="text-xs text-gray-500 mt-1">이번 달 +250P</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-medium text-gray-600">작성 리뷰</h2>
            <span className="text-blue-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900">23</p>
          <p className="text-xs text-gray-500 mt-1">이번 달 5건</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-medium text-gray-600">진행중 캠페인</h2>
            <span className="text-purple-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
              </svg>
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900">3</p>
          <p className="text-xs text-gray-500 mt-1">마감 임박 1건</p>
        </div>
      </div>

      {/* 최근 활동 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">최근 활동</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="w-2 h-2 bg-green-600 rounded-full mt-2 mr-3"></div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">포인트 적립</p>
                <p className="text-xs text-gray-500">리뷰 작성 완료 - 카페 A (+50P)</p>
                <p className="text-xs text-gray-400 mt-1">2시간 전</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3"></div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">리뷰 승인</p>
                <p className="text-xs text-gray-500">레스토랑 B 리뷰가 승인되었습니다</p>
                <p className="text-xs text-gray-400 mt-1">5시간 전</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-yellow-600 rounded-full mt-2 mr-3"></div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">캠페인 참여</p>
                <p className="text-xs text-gray-500">새로운 캠페인에 참여하셨습니다</p>
                <p className="text-xs text-gray-400 mt-1">1일 전</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 사용자 프로필 컴포넌트
function UserProfile() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">내 프로필</h1>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <p className="text-gray-600">프로필 정보가 여기에 표시됩니다.</p>
      </div>
    </div>
  );
}

// 사용자 리뷰 컴포넌트
function UserReviews() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">내 리뷰</h1>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <p className="text-gray-600">작성한 리뷰 목록이 여기에 표시됩니다.</p>
      </div>
    </div>
  );
}

// 사용자 포인트 컴포넌트
function UserPoints() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">내 포인트</h1>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <p className="text-gray-600">포인트 내역이 여기에 표시됩니다.</p>
      </div>
    </div>
  );
}

function App() {
  const { isAuthenticated, user } = useAuth();

  return (
    <Router future={{
      v7_startTransition: true,
      v7_relativeSplatPath: true
    }}>
      <Routes>
        {/* 랜딩 페이지 */}
        <Route path="/" element={
          isAuthenticated ? (
            user?.role === 'writer' ? (
              <Navigate to="/user" replace />
            ) : (
              <Navigate to="/admin" replace />
            )
          ) : (
            <LandingPage />
          )
        } />

        {/* Admin 로그인 페이지 */}
        <Route path="/admin/login" element={
          isAuthenticated ? (
            user?.role === 'writer' ? (
              <Navigate to="/user" replace />
            ) : (
              <Navigate to="/admin" replace />
            )
          ) : (
            <AdminLoginPage />
          )
        } />

        {/* Admin 라우트들 */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['developer', 'admin', 'distributor', 'advertiser']} isAdmin={true}>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route index element={<AdminDashboardPage />} />
          <Route path="accounts" element={
            <ProtectedRoute allowedRoles={['developer', 'admin', 'distributor']}>
              <AccountsPageV2 />
            </ProtectedRoute>
          } />
          <Route path="places" element={<PlacesPage />} />
          <Route path="places/:id" element={<PlaceDetailPage />} />
          <Route path="review-management" element={
            <ProtectedRoute allowedRoles={['developer', 'admin']}>
              <ReviewManagementPage />
            </ProtectedRoute>
          } />
          <Route path="points" element={<PointRequestsPage />} />
          <Route path="points-management" element={
            <ProtectedRoute allowedRoles={['developer', 'admin']}>
              <PointManagementPage />
            </ProtectedRoute>
          } />
          <Route path="points-history" element={<PointHistoryPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={
            <ProtectedRoute allowedRoles={['developer', 'admin']}>
              <SystemSettingsPage />
            </ProtectedRoute>
          } />
        </Route>

        {/* User 라우트들 */}
        <Route path="/user" element={
          <ProtectedRoute allowedRoles={['writer']}>
            <UserLayout />
          </ProtectedRoute>
        }>
          <Route index element={<UserDashboard />} />
          <Route path="works" element={<WorkListPage />} />
          <Route path="my-works" element={<MyWorksPage />} />
          <Route path="write/:workId" element={<WritePage />} />
          <Route path="profile" element={<UserProfile />} />
          <Route path="reviews" element={<UserReviews />} />
          <Route path="points" element={<UserPoints />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;