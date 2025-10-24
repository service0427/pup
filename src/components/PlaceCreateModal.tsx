import { useState } from 'react';
import { X } from 'lucide-react';

interface PlaceCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function PlaceCreateModal({ isOpen, onClose, onSuccess }: PlaceCreateModalProps) {
  const [formData, setFormData] = useState({
    business_name: '',
    place_url: '',
    place_type: '',
    phone: '',
    address: '',
    remark: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const authData = localStorage.getItem('adr_auth');
      const { token } = authData ? JSON.parse(authData) : {};

      const response = await fetch('http://localhost:3001/api/places', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
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
          business_name: '',
          place_url: '',
          place_type: '',
          phone: '',
          address: '',
          remark: ''
        });
      } else {
        setError(data.message || '플레이스 생성에 실패했습니다.');
      }
    } catch (error) {
      setError('플레이스 생성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose}></div>

        <div className="relative bg-white rounded-lg max-w-2xl w-full p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-semibold">새 플레이스 추가</h2>
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
              {/* 상호명 (필수) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  상호명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.business_name}
                  onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="예: 스타벅스 강남점"
                />
              </div>

              {/* 플레이스 URL (필수) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  네이버 플레이스 URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  required
                  value={formData.place_url}
                  onChange={(e) => setFormData({ ...formData, place_url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="예: https://m.place.naver.com/restaurant/12345678"
                />
                <p className="mt-1 text-xs text-gray-500">
                  네이버 플레이스 URL을 입력하면 자동으로 플레이스 ID가 추출됩니다.
                </p>
              </div>

              {/* 업종 (선택) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  업종
                </label>
                <input
                  type="text"
                  value={formData.place_type}
                  onChange={(e) => setFormData({ ...formData, place_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="예: 카페, 음식점, 병원 등"
                />
              </div>

              {/* 전화번호 (선택) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  전화번호
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="예: 02-1234-5678"
                />
              </div>

              {/* 주소 (선택) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  주소
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="예: 서울시 강남구 ..."
                />
              </div>

              {/* 메모 (선택) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  메모
                </label>
                <textarea
                  value={formData.remark}
                  onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="기타 메모사항을 입력하세요"
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
