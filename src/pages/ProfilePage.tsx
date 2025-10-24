import { useState, useEffect } from 'react';
import { User, Lock, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export function ProfilePage() {
  const { user } = useAuth();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 이름 변경
  const [name, setName] = useState('');
  const [nameLoading, setNameLoading] = useState(false);

  // 비밀번호 변경
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string>('');
  const [passwordSuccess, setPasswordSuccess] = useState<string>('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
    }
  }, [user]);

  // 메시지 자동 제거
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleNameUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setMessage({ type: 'error', text: '이름을 입력해주세요.' });
      return;
    }

    setNameLoading(true);
    try {
      const authData = localStorage.getItem('adr_auth');
      const { token } = authData ? JSON.parse(authData) : {};

      const response = await fetch('/api/profile/update-name', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name })
      });

      const data = await response.json();

      if (data.success) {
        // localStorage의 user 정보 업데이트
        const authData = localStorage.getItem('adr_auth');
        if (authData) {
          const parsed = JSON.parse(authData);
          parsed.user.name = name;
          localStorage.setItem('adr_auth', JSON.stringify(parsed));
        }

        setMessage({ type: 'success', text: '이름이 성공적으로 변경되었습니다.' });
        // 페이지 새로고침하여 사이드바의 이름도 업데이트
        setTimeout(() => window.location.reload(), 1000);
      } else {
        setMessage({ type: 'error', text: data.message || '이름 변경에 실패했습니다.' });
      }
    } catch (error) {
      console.error('이름 변경 실패:', error);
      setMessage({ type: 'error', text: '이름 변경 중 오류가 발생했습니다.' });
    } finally {
      setNameLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    // 메시지 초기화
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      const errorMsg = '모든 비밀번호 필드를 입력해주세요.';
      setPasswordError(errorMsg);
      setMessage({ type: 'error', text: errorMsg });
      return;
    }

    if (newPassword !== confirmPassword) {
      const errorMsg = '새 비밀번호가 일치하지 않습니다.';
      setPasswordError(errorMsg);
      setMessage({ type: 'error', text: errorMsg });
      return;
    }

    if (newPassword.length < 4) {
      const errorMsg = '비밀번호는 최소 4자 이상이어야 합니다.';
      setPasswordError(errorMsg);
      setMessage({ type: 'error', text: errorMsg });
      return;
    }

    setPasswordLoading(true);
    try {
      const authData = localStorage.getItem('adr_auth');
      const { token } = authData ? JSON.parse(authData) : {};

      const response = await fetch('/api/profile/update-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });

      const data = await response.json();

      if (data.success) {
        const successMsg = '비밀번호가 성공적으로 변경되었습니다.';
        setPasswordSuccess(successMsg);
        setMessage({ type: 'success', text: successMsg });
        setPasswordError('');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        const errorMsg = data.message || '비밀번호 변경에 실패했습니다.';
        setPasswordError(errorMsg);
        setPasswordSuccess('');
        setMessage({ type: 'error', text: errorMsg });
      }
    } catch (error) {
      console.error('비밀번호 변경 실패:', error);
      const errorMsg = '비밀번호 변경 중 오류가 발생했습니다.';
      setPasswordError(errorMsg);
      setPasswordSuccess('');
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setPasswordLoading(false);
    }
  };

  const getRoleLabel = (role?: string) => {
    const roleLabels: Record<string, string> = {
      developer: '🔧 개발자',
      admin: '최고관리자',
      distributor: '총판',
      advertiser: '광고주',
      writer: '작성자'
    };
    return roleLabels[role || ''] || '사용자';
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">내 정보</h1>
        <p className="text-gray-600">프로필 정보를 관리할 수 있습니다.</p>
      </div>

      {/* 메시지 알림 */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
          message.type === 'success'
            ? 'bg-green-50 border border-green-200'
            : 'bg-red-50 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600" />
          )}
          <p className={`text-sm font-medium ${
            message.type === 'success' ? 'text-green-800' : 'text-red-800'
          }`}>
            {message.text}
          </p>
        </div>
      )}

      <div className="space-y-6">
        {/* 현재 정보 카드 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              user?.role === 'developer' ? 'bg-purple-100' : 'bg-blue-100'
            }`}>
              <User className={`w-6 h-6 ${
                user?.role === 'developer' ? 'text-purple-600' : 'text-blue-600'
              }`} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">계정 정보</h3>
              <p className="text-sm text-gray-600">현재 로그인한 계정의 정보입니다.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500">아이디</label>
              <p className="mt-1 text-sm font-medium text-gray-900">{user?.username || '-'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">이름</label>
              <p className="mt-1 text-sm font-medium text-gray-900">{user?.name || '-'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">역할</label>
              <p className="mt-1 text-sm font-medium text-gray-900">{getRoleLabel(user?.role)}</p>
            </div>
          </div>
        </div>

        {/* 이름 변경 카드 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <User className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">이름 변경</h3>
              <p className="text-sm text-gray-600">표시될 이름을 변경할 수 있습니다.</p>
            </div>
          </div>

          <form onSubmit={handleNameUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                새로운 이름
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="이름을 입력하세요"
              />
            </div>

            <button
              type="submit"
              disabled={nameLoading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="w-4 h-4" />
              {nameLoading ? '저장 중...' : '이름 변경'}
            </button>
          </form>
        </div>

        {/* 비밀번호 변경 카드 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
              <Lock className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">비밀번호 변경</h3>
              <p className="text-sm text-gray-600">보안을 위해 주기적으로 비밀번호를 변경하세요.</p>
            </div>
          </div>

          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            {/* 성공 메시지 */}
            {passwordSuccess && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <p className="text-sm font-medium text-green-800">{passwordSuccess}</p>
              </div>
            )}

            {/* 에러 메시지 */}
            {passwordError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-sm font-medium text-red-800">{passwordError}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                현재 비밀번호
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  setPasswordError('');
                  setPasswordSuccess('');
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="현재 비밀번호를 입력하세요"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                새 비밀번호
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setPasswordError('');
                  setPasswordSuccess('');
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="새 비밀번호를 입력하세요 (최소 4자)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                새 비밀번호 확인
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setPasswordError('');
                  setPasswordSuccess('');
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="새 비밀번호를 다시 입력하세요"
              />
            </div>

            <button
              type="submit"
              disabled={passwordLoading}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Lock className="w-4 h-4" />
              {passwordLoading ? '변경 중...' : '비밀번호 변경'}
            </button>
          </form>
        </div>
      </div>

      {/* 하단 안내 */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="w-5 h-5 text-blue-600 mt-0.5">ℹ️</div>
          <div className="text-sm text-blue-800">
            <p className="font-medium">프로필 변경 안내</p>
            <ul className="mt-1 space-y-1 text-xs">
              <li>• 이름은 시스템 전체에서 표시되는 이름입니다.</li>
              <li>• 비밀번호는 최소 4자 이상이어야 하며, 안전한 비밀번호를 사용하세요.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
