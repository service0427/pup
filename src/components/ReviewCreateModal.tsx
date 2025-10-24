import { useState, useEffect } from 'react';
import { X, Plus, Image as ImageIcon, Coins } from 'lucide-react';

interface ReviewFormData {
  review_text: string;
  images: string[];
  auto_generate_image: boolean;
}

interface ReviewCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  placeId: string;
}

export function ReviewCreateModal({ isOpen, onClose, onSuccess, placeId }: ReviewCreateModalProps) {
  const [reviewForms, setReviewForms] = useState<ReviewFormData[]>([
    { review_text: '', images: [], auto_generate_image: false }
  ]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reviewPrice, setReviewPrice] = useState<number>(0);
  const [availablePoints, setAvailablePoints] = useState<number>(0);

  // 리뷰 단가 및 포인트 잔액 조회
  useEffect(() => {
    if (isOpen) {
      fetchPriceAndBalance();
    }
  }, [isOpen]);

  const fetchPriceAndBalance = async () => {
    try {
      const authData = localStorage.getItem('adr_auth');
      const { token } = authData ? JSON.parse(authData) : {};

      // 리뷰 단가 조회
      const priceResponse = await fetch('/api/content-pricing', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const priceData = await priceResponse.json();
      if (priceData.success && priceData.data.pricing) {
        const receiptReview = priceData.data.pricing.find((p: any) => p.content_type === 'receipt_review');
        if (receiptReview) {
          setReviewPrice(receiptReview.price);
        }
      }

      // 포인트 잔액 조회
      const balanceResponse = await fetch('/api/points/balance', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const balanceData = await balanceResponse.json();
      if (balanceData.success) {
        setAvailablePoints(balanceData.data.available_points || 0);
      }
    } catch (error) {
      console.error('Failed to fetch price and balance:', error);
    }
  };

  const handleAddReviewForm = () => {
    setReviewForms([...reviewForms, { review_text: '', images: [], auto_generate_image: false }]);
  };

  const handleRemoveReviewForm = (index: number) => {
    if (reviewForms.length === 1) return;
    setReviewForms(reviewForms.filter((_, i) => i !== index));
  };

  const handleReviewFormChange = (index: number, field: keyof ReviewFormData, value: any) => {
    const newForms = [...reviewForms];
    newForms[index] = { ...newForms[index], [field]: value };
    setReviewForms(newForms);
  };

  const handleImageUpload = async (index: number, file: File) => {
    try {
      setUploading(true);
      const authData = localStorage.getItem('adr_auth');
      const { token } = authData ? JSON.parse(authData) : {};

      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/receipts/upload-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      if (data.success) {
        const newForms = [...reviewForms];
        newForms[index].images = [...newForms[index].images, data.data.url];
        setReviewForms(newForms);
      }
    } catch (error) {
      console.error('Failed to upload image:', error);
      alert('이미지 업로드에 실패했습니다.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = (formIndex: number, imageIndex: number) => {
    const newForms = [...reviewForms];
    newForms[formIndex].images = newForms[formIndex].images.filter((_, i) => i !== imageIndex);
    setReviewForms(newForms);
  };

  const handleSubmit = async (submitForApproval: boolean) => {
    try {
      // 실제 작성된 리뷰만 필터링 (빈 텍스트 제외)
      const validReviews = reviewForms.filter(f => f.review_text.trim());

      if (validReviews.length === 0) {
        alert('최소 1개 이상의 리뷰를 작성해주세요.');
        return;
      }

      // 제출 시 포인트 부족 체크
      if (submitForApproval) {
        const totalPoints = reviewPrice * validReviews.length;
        if (availablePoints < totalPoints) {
          alert(`포인트가 부족합니다!\n필요: ${totalPoints.toLocaleString()}P\n보유: ${availablePoints.toLocaleString()}P\n부족: ${(totalPoints - availablePoints).toLocaleString()}P`);
          return;
        }

        const confirmed = confirm(
          `리뷰 ${validReviews.length}개를 제출하시겠습니까?\n차감 포인트: ${totalPoints.toLocaleString()}P\n남은 포인트: ${(availablePoints - totalPoints).toLocaleString()}P`
        );
        if (!confirmed) return;
      }

      setSubmitting(true);
      const authData = localStorage.getItem('adr_auth');
      const { token } = authData ? JSON.parse(authData) : {};

      const response = await fetch(`/api/receipts/place/${placeId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reviews: validReviews,  // 빈 리뷰 제외하고 전송
          submit: submitForApproval
        })
      });

      const data = await response.json();
      if (data.success) {
        alert(data.message || '리뷰가 등록되었습니다.');
        setReviewForms([{ review_text: '', images: [], auto_generate_image: false }]);
        onSuccess();
        onClose();
      } else {
        alert(data.message || '리뷰 등록에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to submit reviews:', error);
      alert('리뷰 등록에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose}></div>

        <div className="relative bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
          {/* 헤더 */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">리뷰 작성</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 바디 */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-3">
              {reviewForms.map((form, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-600 mt-2">{index + 1}.</span>

                  {/* 텍스트 입력 */}
                  <textarea
                    rows={2}
                    value={form.review_text}
                    onChange={(e) => handleReviewFormChange(index, 'review_text', e.target.value)}
                    placeholder="리뷰 내용을 입력하세요..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />

                  {/* 이미지 업로드 */}
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(index, file);
                        }}
                        className="hidden"
                        disabled={uploading}
                      />
                      <div className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors">
                        <ImageIcon className="w-5 h-5 text-gray-600" />
                      </div>
                    </label>

                    {/* 이미지 미리보기 */}
                    {form.images.length > 0 && (
                      <div className="flex gap-1">
                        {form.images.map((img, imgIndex) => (
                          <div key={imgIndex} className="relative group">
                            <img
                              src={`${img}`}
                              alt="preview"
                              className="w-10 h-10 object-cover rounded cursor-pointer"
                              onClick={() => window.open(`${img}`, '_blank')}
                            />
                            <button
                              onClick={() => handleRemoveImage(index, imgIndex)}
                              className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* AI 생성 체크박스 */}
                  <label className="flex items-center gap-2 cursor-pointer whitespace-nowrap px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={form.auto_generate_image}
                      onChange={(e) => handleReviewFormChange(index, 'auto_generate_image', e.target.checked)}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm text-gray-700 font-medium">AI생성</span>
                  </label>

                  {/* 삭제 버튼 */}
                  {reviewForms.length > 1 && (
                    <button
                      onClick={() => handleRemoveReviewForm(index)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* 리뷰 추가 버튼 */}
            <button
              onClick={handleAddReviewForm}
              className="w-full mt-3 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              리뷰 항목 추가
            </button>
          </div>

          {/* 푸터 */}
          <div className="p-6 border-t border-gray-200">
            {/* 포인트 정보 */}
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-gray-700">
                  <Coins className="w-4 h-4 text-blue-600" />
                  <span>보유 포인트: <span className="font-semibold text-blue-600">{availablePoints.toLocaleString()}P</span></span>
                </div>
                <div className="text-gray-600">
                  리뷰 단가: {reviewPrice.toLocaleString()}P
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-blue-200 flex items-center justify-between text-sm">
                <span className="text-gray-700">
                  필요 포인트 ({reviewForms.filter(f => f.review_text.trim()).length}개 작성):
                </span>
                <span className={`font-semibold text-lg ${
                  availablePoints >= (reviewPrice * reviewForms.filter(f => f.review_text.trim()).length)
                    ? 'text-blue-600'
                    : 'text-red-600'
                }`}>
                  {(reviewPrice * reviewForms.filter(f => f.review_text.trim()).length).toLocaleString()}P
                </span>
              </div>
              {availablePoints < (reviewPrice * reviewForms.filter(f => f.review_text.trim()).length) && (
                <div className="mt-2 text-xs text-red-600 font-medium">
                  ⚠️ 포인트가 {((reviewPrice * reviewForms.filter(f => f.review_text.trim()).length) - availablePoints).toLocaleString()}P 부족합니다
                </div>
              )}
            </div>

            {/* 버튼 */}
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                disabled={submitting}
              >
                취소
              </button>
              <button
                onClick={() => handleSubmit(false)}
                disabled={submitting || uploading}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                {submitting ? '저장 중...' : '임시저장'}
              </button>
              <button
                onClick={() => handleSubmit(true)}
                disabled={submitting || uploading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? '제출 중...' : '제출 (승인 요청)'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
