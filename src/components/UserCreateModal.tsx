import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface UserCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentUser?: {
    role: string;
    id: number;
    name?: string;
    username?: string;
  };
}

export function UserCreateModal({ isOpen, onClose, onSuccess }: UserCreateModalProps) {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    role: 'advertiser',  // 자동으로 광고주로 설정
    parent_id: ''  // 자동으로 최상위로 설정
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      // 역할과 상위 사용자는 자동으로 설정되므로 fetchPotentialParents 불필요
      // 모달이 열릴 때마다 초기화
      setFormData({
        username: '',
        password: '',
        name: '',
        role: 'advertiser',
        parent_id: ''
      });
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const authData = localStorage.getItem('adr_auth');
      const { token } = authData ? JSON.parse(authData) : {};

      // parent_id가 빈 문자열이면 null로 처리
      const submitData = {
        ...formData,
        parent_id: formData.parent_id || null
      };

      const response = await fetch('http://localhost:3001/api/users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
      });

      const data = await response.json();

      // 토큰 만료 체크
      if (!response.ok && data.message === '토큰이 만료되었습니다.') {
        localStorage.removeItem('adr_auth');
        window.location.href = '/admin/login';
        return;
      }

      if (data.success) {
        onSuccess();
        onClose();
        setFormData({
          username: '',
          password: '',
          name: '',
          role: 'advertiser',
          parent_id: ''
        });
      } else {
        setError(data.message || '사용자 생성에 실패했습니다.');
      }
    } catch (error) {
      setError('사용자 생성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose}></div>

        <div className="relative bg-white rounded-lg max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-semibold">새 사용자 추가</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  아이디 *
                </label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="영문, 숫자 조합"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  비밀번호 *
                </label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="최소 6자 이상"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  이름 *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="실명 입력"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? '생성 중...' : '생성'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}