import { useState, useEffect } from 'react';
import { X, Image as ImageIcon } from 'lucide-react';

interface ReviewEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  reviewId: number | null;
}

export function ReviewEditModal({ isOpen, onClose, onSuccess, reviewId }: ReviewEditModalProps) {
  const [formData, setFormData] = useState({
    review_text: '',
    images: [] as string[],
    auto_generate_image: false
  });
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && reviewId) {
      fetchReviewData();
    }
  }, [isOpen, reviewId]);

  const fetchReviewData = async () => {
    try {
      const authData = localStorage.getItem('adr_auth');
      const { token } = authData ? JSON.parse(authData) : {};

      const response = await fetch(`http://localhost:3001/api/receipts/${reviewId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setFormData({
          review_text: data.data.review_text || '',
          images: data.data.images || [],
          auto_generate_image: data.data.auto_generate_image || false
        });
      }
    } catch (error) {
      console.error('Failed to fetch review data:', error);
    }
  };

  const handleImageUpload = async (file: File) => {
    try {
      setUploading(true);
      const authData = localStorage.getItem('adr_auth');
      const { token } = authData ? JSON.parse(authData) : {};

      const formDataUpload = new FormData();
      formDataUpload.append('image', file);

      const response = await fetch('http://localhost:3001/api/receipts/upload-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataUpload
      });

      const data = await response.json();
      if (data.success) {
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, data.data.url]
        }));
      }
    } catch (error) {
      console.error('Failed to upload image:', error);
      alert('이미지 업로드에 실패했습니다.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = (imageIndex: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== imageIndex)
    }));
  };

  const handleSubmit = async () => {
    try {
      if (!formData.review_text.trim()) {
        alert('리뷰 내용을 입력해주세요.');
        return;
      }

      setSubmitting(true);
      const authData = localStorage.getItem('adr_auth');
      const { token } = authData ? JSON.parse(authData) : {};

      const response = await fetch(`http://localhost:3001/api/receipts/${reviewId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (data.success) {
        alert('리뷰가 수정되었습니다.');
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Failed to update review:', error);
      alert('리뷰 수정에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose}></div>

        <div className="relative bg-white rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
          {/* 헤더 */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">리뷰 수정</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 바디 */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-4">
              {/* 리뷰 내용 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  리뷰 내용 <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={6}
                  value={formData.review_text}
                  onChange={(e) => setFormData({ ...formData, review_text: e.target.value })}
                  placeholder="리뷰 내용을 입력하세요..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* 이미지 업로드 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이미지 (선택)
                </label>
                <div className="flex items-start gap-3">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file);
                      }}
                      className="hidden"
                      disabled={uploading}
                    />
                    <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 flex items-center justify-center transition-colors">
                      <ImageIcon className="w-6 h-6 text-gray-400" />
                    </div>
                  </label>

                  {/* 이미지 미리보기 */}
                  {formData.images.map((img, idx) => (
                    <div key={idx} className="relative group">
                      <img
                        src={`http://localhost:3001${img}`}
                        alt="preview"
                        className="w-20 h-20 object-cover rounded-lg cursor-pointer border border-gray-200"
                        onClick={() => window.open(`http://localhost:3001${img}`, '_blank')}
                      />
                      <button
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI 생성 */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.auto_generate_image}
                    onChange={(e) => setFormData({ ...formData, auto_generate_image: e.target.checked })}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm text-gray-700">AI 이미지 자동 생성</span>
                </label>
              </div>
            </div>
          </div>

          {/* 푸터 */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              disabled={submitting}
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || uploading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? '수정 중...' : '수정'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
