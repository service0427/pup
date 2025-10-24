import { useState } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToSignup: () => void;
}

export function LoginModal({ isOpen, onClose, onSwitchToSignup }: LoginModalProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('아이디를 입력해주세요.');
      return;
    }

    if (!password.trim()) {
      setError('비밀번호를 입력해주세요.');
      return;
    }

    setLoading(true);

    const result = await login(username, password);

    if (result.success) {
      onClose(); // 모달 닫기

      // setTimeout을 사용해서 모달이 닫힌 후 이동
      setTimeout(() => {
        // writer 권한은 사용자 페이지로
        if (result.user?.role === 'writer') {
          window.location.href = '/user';
        }
        // developer, admin, distributor, advertiser는 관리자 페이지로
        else if (result.user?.role === 'developer' || result.user?.role === 'admin' || result.user?.role === 'distributor' || result.user?.role === 'advertiser') {
          window.location.href = '/admin';
        }
        // 기본값 (혹시 모를 경우)
        else {
          window.location.href = '/user';
        }
      }, 100);
    } else {
      setError(result.error || '로그인에 실패했습니다.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 배경 오버레이 */}
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />

      {/* 모달 */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold">로그인</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 폼 영역 */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 아이디 */}
            <div>
              <input
                type="text"
                placeholder="아이디"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* 비밀번호 */}
            <div>
              <input
                type="password"
                placeholder="비밀번호"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* 에러 메시지 */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* 버튼 */}
            <div className="space-y-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50"
              >
                {loading ? '로그인 중...' : '로그인'}
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">또는</span>
                </div>
              </div>

              <button
                type="button"
                onClick={onSwitchToSignup}
                className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
              >
                회원가입
              </button>
            </div>

            {/* 관리자 로그인 링크 */}
            <div className="text-center pt-4 border-t">
              <a
                href="/admin/login"
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                관리자 로그인은 여기를 클릭하세요
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}