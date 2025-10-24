import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function AdminLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('아이디와 비밀번호를 입력해주세요.');
      return;
    }

    setLoading(true);

    const result = await login(username, password);

    if (result.success) {
      // 관리자 권한 체크 (개발자 포함)
      if (result.user?.role === 'developer' || result.user?.role === 'admin' || result.user?.role === 'distributor' || result.user?.role === 'advertiser') {
        window.location.href = '/admin';
      } else {
        setError('관리자 권한이 없습니다.');
        setLoading(false);
      }
    } else {
      setError(result.error || '로그인에 실패했습니다.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="flex">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center -mr-2">
                <span className="text-white text-lg">●</span>
              </div>
              <div className="w-10 h-10 bg-white border-2 border-blue-600 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-lg">●</span>
              </div>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Place-UP 관리자</h1>
          <p className="text-gray-600 mt-2">관리자 계정으로 로그인하세요</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              아이디
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="관리자 아이디"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="비밀번호"
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50"
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>

          <div className="text-center mt-4">
            <a
              href="/"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              일반 사용자로 로그인하기
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}