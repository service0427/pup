import { useState, useEffect } from 'react';
import {
  Search,
  Download,
  Trash2,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { DeleteRequestModal } from '../components/DeleteRequestModal';

interface Review {
  id: number;
  receipt_id: number;
  advertiser_name: string;  // 광고주명
  review_content: string;  // 게시물 내용
  review_url: string;  // 게시물 주소
  review_date: string;  // 리뷰 작성 일시
  delete_requested: boolean;  // 삭제요청 상태
  delete_request_date?: string;
  delete_request_reason?: string;
  status: string;
  created_at: string;
}

export function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);

  useEffect(() => {
    fetchReviews();
  }, [currentPage, itemsPerPage, startDate, endDate]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const authData = localStorage.getItem('adr_auth');
      const { token } = authData ? JSON.parse(authData) : {};

      if (!token) {
        console.error('No token found in localStorage');
        setLoading(false);
        return;
      }
      console.log('Token found:', token.substring(0, 20) + '...');

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        start_date: startDate,
        end_date: endDate
      });

      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await fetch(`/api/reviews?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        console.error('Failed to fetch reviews:', response.status, response.statusText);
        const errorData = await response.json();
        console.error('Error details:', errorData);

        // 토큰 만료 시 로그인 페이지로 리다이렉트
        if (response.status === 401 && errorData.message === '토큰이 만료되었습니다.') {
          localStorage.removeItem('adr_auth');
          window.location.href = '/admin/login';
        }
        return;
      }

      const data = await response.json();

      if (data.success) {
        setReviews(data.data.reviews || []);
        setTotalItems(data.data.total || 0);
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRequestClick = (review: Review) => {
    if (review.delete_requested) {
      // 이미 요청된 경우 취소
      handleDeleteRequestSubmit(review.id, null, '', true);
    } else {
      // 새로 요청하는 경우 모달 열기
      setSelectedReview(review);
      setShowDeleteModal(true);
    }
  };

  const handleDeleteRequestSubmit = async (reviewId: number, date: string | null, reason: string, isCancel: boolean = false) => {
    try {
      const authData = localStorage.getItem('adr_auth');
      const { token } = authData ? JSON.parse(authData) : {};

      const response = await fetch(`/api/reviews/${reviewId}/delete-request`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          delete_requested: !isCancel,
          delete_request_date: date,
          delete_request_reason: reason
        })
      });

      if (response.ok) {
        fetchReviews(); // 리스트 새로고침
        if (!isCancel) {
          alert('삭제 요청이 접수되었습니다.');
        } else {
          alert('삭제 요청이 취소되었습니다.');
        }
      }
    } catch (error) {
      console.error('Failed to update delete request:', error);
      alert('삭제 요청 처리 중 오류가 발생했습니다.');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchReviews();
  };

  const handleExcelDownload = () => {
    // TODO: 엑셀 다운로드 기능 구현
    const authData = localStorage.getItem('adr_auth');
    const { token } = authData ? JSON.parse(authData) : {};

    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
      format: 'excel'
    });

    window.open(`/api/reviews/export?${params}&token=${token}`, '_blank');
  };

  const handleDateClick = (date: string) => {
    setStartDate(date);
    setEndDate(date);
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <div className="p-6">
      {/* 헤더 */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">포스트 관리</h1>
          <p className="mt-1 text-sm text-gray-600">
            포스트 작성내역(영수증 리뷰)
          </p>
        </div>
        <button
          onClick={handleExcelDownload}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Download className="w-5 h-5" />
          엑셀 다운
        </button>
      </div>

      {/* 날짜 필터 */}
      <div className="bg-white rounded-lg shadow mb-6 p-4">
        <div className="flex items-end gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                시작일
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                종료일
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          {/* 빠른 날짜 설정 버튼들 */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                const today = new Date().toISOString().split('T')[0];
                setStartDate(today);
                setEndDate(today);
              }}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
            >
              오늘
            </button>
            <button
              onClick={() => {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = yesterday.toISOString().split('T')[0];
                setStartDate(yesterdayStr);
                setEndDate(yesterdayStr);
              }}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
            >
              어제
            </button>
            <button
              onClick={() => {
                const today = new Date();
                const weekAgo = new Date();
                weekAgo.setDate(today.getDate() - 7);
                setStartDate(weekAgo.toISOString().split('T')[0]);
                setEndDate(today.toISOString().split('T')[0]);
              }}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
            >
              일주일
            </button>
            <button
              onClick={() => {
                const today = new Date();
                const monthAgo = new Date();
                monthAgo.setMonth(today.getMonth() - 1);
                setStartDate(monthAgo.toISOString().split('T')[0]);
                setEndDate(today.toISOString().split('T')[0]);
              }}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
            >
              한달
            </button>
          </div>
        </div>
      </div>

      {/* 검색 및 표시 개수 */}
      <div className="mb-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(parseInt(e.target.value));
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="10">10개씩 보기</option>
            <option value="25">25개씩 보기</option>
            <option value="50">50개씩 보기</option>
            <option value="100">100개씩 보기</option>
          </select>
        </div>

        <form onSubmit={handleSearch} className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </form>
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                광고주명
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                게시물 내용
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                게시물 주소
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                일시
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                삭제요청
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-gray-500">
                  로딩 중...
                </td>
              </tr>
            ) : reviews.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-gray-500">
                  데이터가 없습니다
                </td>
              </tr>
            ) : (
              reviews.map((review) => (
                <tr key={review.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <a
                      href={`/receipts?search=${review.advertiser_name}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {review.advertiser_name}
                    </a>
                  </td>
                  <td className="px-4 py-4">
                    <a
                      href={review.review_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 line-clamp-2"
                    >
                      {review.review_content}
                    </a>
                  </td>
                  <td className="px-4 py-4">
                    <a
                      href={review.review_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <span className="truncate max-w-xs">
                        {review.review_url}
                      </span>
                      <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    </a>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleDateClick(review.review_date.split(' ')[0])}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {review.review_date}
                    </button>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <button
                      onClick={() => handleDeleteRequestClick(review)}
                      className={`inline-flex items-center gap-1 px-3 py-1 text-sm border rounded ${
                        review.delete_requested
                          ? 'bg-red-100 text-red-700 border-red-300 hover:bg-red-200'
                          : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                      }`}
                    >
                      {review.delete_requested ? (
                        <>
                          <RefreshCw className="w-4 h-4" />
                          요청됨
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4" />
                          삭제요청
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-gray-700">
          {totalItems} 개 중 {((currentPage - 1) * itemsPerPage) + 1} ~ {Math.min(currentPage * itemsPerPage, totalItems)} 표시
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-4 py-2 text-sm rounded ${
              currentPage === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            이전
          </button>

          {/* 페이지 번호들 */}
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const pageNum = Math.max(1, currentPage - 2) + i;
            if (pageNum > totalPages) return null;

            return (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`px-4 py-2 text-sm rounded ${
                  pageNum === currentPage
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {pageNum}
              </button>
            );
          }).filter(Boolean)}

          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`px-4 py-2 text-sm rounded ${
              currentPage === totalPages
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            다음
          </button>
        </div>
      </div>

      {/* 삭제 요청 모달 */}
      {selectedReview && (
        <DeleteRequestModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedReview(null);
          }}
          onSuccess={() => {
            fetchReviews();
            setShowDeleteModal(false);
            setSelectedReview(null);
          }}
          reviewId={selectedReview.id}
          placeName={selectedReview.advertiser_name}
        />
      )}
    </div>
  );
}