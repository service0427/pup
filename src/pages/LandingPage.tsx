import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Menu,
  X,
  Users,
  FileText,
  CreditCard,
  ChevronRight,
  UserPlus,
  LogIn,
  Check,
  ArrowRight,
  Star,
  TrendingUp,
  Shield
} from 'lucide-react';
import { SignupModal } from '../components/SignupModal';
import { LoginModal } from '../components/LoginModal';

export function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // /admin에서 리다이렉트된 경우 자동으로 로그인 모달 열기
  useEffect(() => {
    if (location.state?.isAdminLogin) {
      setShowLoginModal(true);
      // state 초기화
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* 헤더 */}
      <header className="fixed top-0 w-full bg-white/95 backdrop-blur-md border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* 로고 */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-3">
                <div className="flex">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center -mr-2">
                    <span className="text-white text-sm">●</span>
                  </div>
                  <div className="w-8 h-8 bg-white border-2 border-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-sm">●</span>
                  </div>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Place-UP</h1>
                  <p className="text-xs text-gray-500">플레이스 광고 시스템</p>
                </div>
              </Link>
            </div>

            {/* 데스크탑 네비게이션 */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition">기능</a>
              <a href="#steps" className="text-gray-600 hover:text-gray-900 transition">이용방법</a>
              <a href="#benefits" className="text-gray-600 hover:text-gray-900 transition">혜택</a>
            </nav>

            {/* 버튼 그룹 */}
            <div className="hidden md:flex items-center space-x-4">
              <Link
                to="/admin/login"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                로그인
              </Link>
            </div>

            {/* 모바일 메뉴 버튼 */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* 모바일 메뉴 */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200">
            <nav className="px-4 py-6 space-y-4">
              <a href="#features" className="block text-gray-600 hover:text-gray-900">기능</a>
              <a href="#steps" className="block text-gray-600 hover:text-gray-900">이용방법</a>
              <a href="#benefits" className="block text-gray-600 hover:text-gray-900">혜택</a>
              <div className="pt-4 border-t border-gray-200 space-y-3">
                <Link to="/admin/login" className="block text-center py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  로그인
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* 히어로 섹션 */}
      <section className="pt-24 pb-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12 lg:py-20">
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
              Easy Management!<br />
              <span className="text-blue-600">Place-UP 시스템</span>으로 스마트한 샵 관리
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              영수증 관리부터 리뷰 모니터링까지!
              체계적인 시스템으로 효율적인 샵 운영을 시작하세요.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/admin/login"
                className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 inline-flex items-center justify-center"
              >
                <LogIn className="w-5 h-5 inline mr-2" />
                로그인
              </Link>
            </div>
          </div>

          {/* 통계 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-3xl font-bold text-gray-900">1,250+</span>
              </div>
              <h3 className="font-semibold text-gray-900">등록된 샵</h3>
              <p className="text-sm text-gray-500 mt-1">신뢰할 수 있는 파트너</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <FileText className="w-6 h-6 text-green-600" />
                </div>
                <span className="text-3xl font-bold text-gray-900">25,000+</span>
              </div>
              <h3 className="font-semibold text-gray-900">관리된 리뷰</h3>
              <p className="text-sm text-gray-500 mt-1">실시간 모니터링 중</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <CreditCard className="w-6 h-6 text-purple-600" />
                </div>
                <span className="text-3xl font-bold text-gray-900">24/7</span>
              </div>
              <h3 className="font-semibold text-gray-900">실시간 관리</h3>
              <p className="text-sm text-gray-500 mt-1">언제 어디서나 접근</p>
            </div>
          </div>
        </div>
      </section>

      {/* 이용 방법 섹션 */}
      <section id="steps" className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              간단한 4단계로 시작하세요
            </h2>
            <p className="text-lg text-gray-600">
              복잡한 과정 없이 바로 효율적인 샵 관리가 가능합니다
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Step 1 */}
            <div className="relative">
              <div className="bg-blue-50 p-6 rounded-xl border-2 border-blue-200 hover:border-blue-400 transition">
                <div className="text-4xl font-bold text-blue-600 mb-4">01</div>
                <h3 className="text-xl font-semibold mb-3">로그인</h3>
                <p className="text-gray-600 mb-4">
                  계정 정보로 Place-UP 시스템에 접속하세요.
                </p>
                <Link to="/admin/login" className="text-blue-600 font-medium hover:text-blue-700 inline-flex items-center">
                  로그인하기 <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
              <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                <ChevronRight className="w-8 h-8 text-gray-300" />
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="bg-green-50 p-6 rounded-xl border-2 border-green-200 hover:border-green-400 transition">
                <div className="text-4xl font-bold text-green-600 mb-4">02</div>
                <h3 className="text-xl font-semibold mb-3">샵 정보 등록</h3>
                <p className="text-gray-600 mb-4">
                  관리할 샵의 정보와 영수증을 등록합니다.
                </p>
                <span className="text-green-600 font-medium inline-flex items-center">
                  안전한 관리 <Shield className="w-4 h-4 ml-1" />
                </span>
              </div>
              <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                <ChevronRight className="w-8 h-8 text-gray-300" />
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className="bg-purple-50 p-6 rounded-xl border-2 border-purple-200 hover:border-purple-400 transition">
                <div className="text-4xl font-bold text-purple-600 mb-4">03</div>
                <h3 className="text-xl font-semibold mb-3">리뷰 모니터링</h3>
                <p className="text-gray-600 mb-4">
                  작성된 리뷰를 실시간으로 확인하고 관리합니다.
                </p>
                <span className="text-purple-600 font-medium inline-flex items-center">
                  실시간 추적 <Star className="w-4 h-4 ml-1" />
                </span>
              </div>
              <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                <ChevronRight className="w-8 h-8 text-gray-300" />
              </div>
            </div>

            {/* Step 4 */}
            <div className="relative">
              <div className="bg-yellow-50 p-6 rounded-xl border-2 border-yellow-200 hover:border-yellow-400 transition">
                <div className="text-4xl font-bold text-yellow-600 mb-4">04</div>
                <h3 className="text-xl font-semibold mb-3">통계 확인</h3>
                <p className="text-gray-600 mb-4">
                  대시보드에서 리뷰 현황과 통계를 확인합니다.
                </p>
                <span className="text-yellow-600 font-medium inline-flex items-center">
                  데이터 분석 <TrendingUp className="w-4 h-4 ml-1" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 기능 섹션 */}
      <section id="features" className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Place-UP 시스템의 핵심 기능
            </h2>
            <p className="text-lg text-gray-600">
              효율적인 리뷰 관리를 위한 모든 것
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">계정 관리</h3>
              <p className="text-gray-600">
                사용자와 광고주 계정을 체계적으로 관리하고 권한을 부여합니다.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">영수증 관리</h3>
              <p className="text-gray-600">
                샵별 영수증을 등록하고 발행 현황을 관리합니다.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Star className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">리뷰 추적</h3>
              <p className="text-gray-600">
                작성된 리뷰의 상태를 실시간으로 모니터링하고 관리합니다.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                <CreditCard className="w-6 h-6 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">포인트 시스템</h3>
              <p className="text-gray-600">
                포인트 지급과 차감을 투명하게 관리하고 내역을 확인합니다.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">실시간 통계</h3>
              <p className="text-gray-600">
                대시보드를 통해 샵 운영 현황과 리뷰 통계를 한눈에 확인합니다.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">보안 시스템</h3>
              <p className="text-gray-600">
                개인정보를 암호화하여 안전하게 보호합니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA 섹션 */}
      <section className="py-16 px-4 bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            지금 바로 시작하세요!
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            효율적인 샵 관리와 체계적인 리뷰 시스템을 경험해보세요
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/admin/login"
              className="px-8 py-4 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition font-semibold text-lg shadow-xl"
            >
              로그인
            </Link>
          </div>
        </div>
      </section>

      {/* 푸터 */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white font-semibold mb-4">Place-UP 시스템</h3>
              <p className="text-sm">
                광고 리뷰 관리의 새로운 기준
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">서비스</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">영수증 관리</a></li>
                <li><a href="#" className="hover:text-white transition">리뷰 모니터링</a></li>
                <li><a href="#" className="hover:text-white transition">계정 관리</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">고객지원</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">이용가이드</a></li>
                <li><a href="#" className="hover:text-white transition">FAQ</a></li>
                <li><a href="#" className="hover:text-white transition">문의하기</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">법적고지</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">이용약관</a></li>
                <li><a href="#" className="hover:text-white transition">개인정보처리방침</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm">
            <p>&copy; 2024 Place-UP System. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* 회원가입 모달 */}
      <SignupModal
        isOpen={showSignupModal}
        onClose={() => setShowSignupModal(false)}
        onSwitchToLogin={() => {
          setShowSignupModal(false);
          setShowLoginModal(true);
        }}
      />

      {/* 로그인 모달 */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSwitchToSignup={() => {
          setShowLoginModal(false);
          setShowSignupModal(true);
        }}
      />
    </div>
  );
}