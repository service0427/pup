import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface DeleteRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  reviewId: number;
  placeName: string;
}

export function DeleteRequestModal({
  isOpen,
  onClose,
  onSuccess,
  reviewId,
  placeName
}: DeleteRequestModalProps) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setError('삭제 사유를 입력해주세요.');
      return;
    }

    if (reason.trim().length < 10) {
      setError('삭제 사유를 10자 이상 입력해주세요.');
      return;
    }

    try {
      setSubmitting(true);
      const authData = localStorage.getItem('adr_auth');
      const { token } = authData ? JSON.parse(authData) : {};

      const response = await fetch(`http://localhost:3001/api/receipts/${reviewId}/request-delete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: reason.trim() })
      });

      const data = await response.json();
      if (data.success) {
        alert('삭제 요청이 완료되었습니다. 관리자 승인 후 처리됩니다.');
        setReason('');
        onSuccess();
        onClose();
      } else {
        setError(data.message || '삭제 요청에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to submit delete request:', error);
      setError('삭제 요청 중 오류가 발생했습니다.');
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
              리뷰 삭제 요청
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
            {/* 경고 메시지 */}
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-red-900 mb-2">⚠️ 중요 안내사항</p>
                  <ul className="text-sm text-red-800 space-y-1">
                    <li>• <strong>승인된 리뷰를 삭제하는 경우 사용된 포인트는 환불되지 않습니다.</strong></li>
                    <li>• 관리자의 승인 후에 삭제가 처리됩니다.</li>
                    <li>• 삭제 사유는 관리자에게 전달되며, 필수로 입력해야 합니다.</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 플레이스 정보 */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">삭제 요청 대상</p>
              <p className="font-medium text-gray-900">{placeName}</p>
            </div>

            {/* 삭제 사유 입력 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                삭제 사유 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  setError('');
                }}
                placeholder="리뷰 삭제가 필요한 구체적인 사유를 입력해주세요. (최소 10자 이상)"
                rows={4}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none ${
                  error ? 'border-red-300' : 'border-gray-300'
                }`}
                disabled={submitting}
              />
              <div className="flex justify-between items-center mt-1">
                {error && (
                  <p className="text-sm text-red-600">{error}</p>
                )}
                <p className="text-xs text-gray-500 ml-auto">
                  {reason.length} / 최소 10자
                </p>
              </div>
            </div>

            {/* 확인 체크박스 */}
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={reason.trim().length >= 10}
                  disabled={true}
                  className="mt-1"
                />
                <span className="text-sm text-yellow-900">
                  위 안내사항을 확인했으며, <strong>포인트가 환불되지 않는다는 것에 동의합니다.</strong>
                </span>
              </label>
            </div>
          </div>

          {/* 푸터 */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
            <button
              onClick={() => !submitting && onClose()}
              className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              disabled={submitting}
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || !reason.trim() || reason.trim().length < 10}
              className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? '요청 중...' : '삭제 요청'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}