import { useState } from 'react';
import { X, ExternalLink, AlertCircle } from 'lucide-react';

interface ReviewUrlModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  reviewId: number;
  currentUrl?: string;
}

export function ReviewUrlModal({ isOpen, onClose, onSuccess, reviewId, currentUrl }: ReviewUrlModalProps) {
  const [url, setUrl] = useState(currentUrl || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const validateUrl = (url: string): boolean => {
    if (!url.trim()) {
      setError('URL을 입력해주세요.');
      return false;
    }

    // URL 형식 검증
    try {
      const urlObj = new URL(url);
      // 네이버, 구글, 카카오 등 주요 플랫폼 URL인지 확인
      const validDomains = ['naver.com', 'google.com', 'kakao.com', 'map.kakao.com', 'place.map.kakao.com'];
      const isValid = validDomains.some(domain => urlObj.hostname.includes(domain));

      if (!isValid) {
        setError('네이버, 구글, 카카오 등의 리뷰 URL을 입력해주세요.');
        return false;
      }

      setError('');
      return true;
    } catch {
      setError('올바른 URL 형식이 아닙니다.');
      return false;
    }
  };

  const handleSubmit = async () => {
    if (!validateUrl(url)) return;

    try {
      setSubmitting(true);
      const authData = localStorage.getItem('adr_auth');
      const { token } = authData ? JSON.parse(authData) : {};

      const response = await fetch(`/api/receipts/${reviewId}/url`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ review_url: url })
      });

      const data = await response.json();
      if (data.success) {
        alert(currentUrl ? 'URL이 수정되었습니다.' : 'URL이 등록되었습니다.');
        setUrl('');
        onSuccess();
        onClose();
      } else {
        setError(data.message || 'URL 등록에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to submit URL:', error);
      setError('URL 등록 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="fixed inset-0 bg-black/50" onClick={() => !submitting && onClose()}></div>

        <div className="relative bg-white rounded-lg max-w-2xl w-full">
          {/* 헤더 */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              {currentUrl ? '리뷰 URL 수정' : '리뷰 URL 등록'}
            </h2>
            <button
              onClick={() => !submitting && onClose()}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={submitting}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 바디 */}
          <div className="p-6">
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-900">
                  <p className="font-medium mb-1">리뷰 URL 등록 안내</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-800">
                    <li>네이버, 구글, 카카오 등에 실제 게시된 리뷰 URL을 입력해주세요.</li>
                    <li>URL을 등록하면 리뷰 유지 상태를 추적할 수 있습니다.</li>
                    <li>주기적으로 리뷰가 삭제되지 않았는지 확인됩니다.</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                리뷰 URL *
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    setError('');
                  }}
                  placeholder="https://m.place.naver.com/..."
                  className={`flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    error ? 'border-red-300' : 'border-gray-300'
                  }`}
                  disabled={submitting}
                />
                {url && (
                  <button
                    onClick={() => window.open(url, '_blank')}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                    title="새 창에서 열기"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                )}
              </div>
              {error && (
                <p className="mt-2 text-sm text-red-600">{error}</p>
              )}
            </div>

            {currentUrl && (
              <div className="mb-6 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">현재 등록된 URL:</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-900 truncate flex-1">{currentUrl}</p>
                  <button
                    onClick={() => window.open(currentUrl, '_blank')}
                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                    title="현재 URL 확인"
                  >
                    <ExternalLink className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>
            )}

            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-600 font-medium mb-2">지원하는 플랫폼:</p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                  네이버 플레이스
                </span>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                  구글 맵
                </span>
                <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                  카카오 맵
                </span>
              </div>
            </div>
          </div>

          {/* 푸터 */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
            <button
              onClick={() => !submitting && onClose()}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              disabled={submitting}
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || !url.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? '등록 중...' : (currentUrl ? 'URL 수정' : 'URL 등록')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
