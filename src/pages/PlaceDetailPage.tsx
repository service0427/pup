import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  ChevronDown,
  MapPin,
  Phone,
  Tag,
  TrendingUp,
  FileText,
  Receipt,
  Settings,
  Plus,
  Trash2,
  Image as ImageIcon,
  Clock,
  XCircle,
  CheckCircle,
  AlertCircle,
  Coins,
  RotateCcw
} from 'lucide-react';
import { ReviewCreateModal } from '../components/ReviewCreateModal';
import { ReviewEditModal } from '../components/ReviewEditModal';
import { DeleteRequestModal } from '../components/DeleteRequestModal';

interface Place {
  id: number;
  business_name: string;
  place_url: string;
  place_id: string;
  place_type?: string;
  phone?: string;
  address?: string;
  status: string;
  remark?: string;
  created_at: string;
}

interface Review {
  id?: number;
  review_text: string;
  images: string[];
  auto_generate_image: boolean;
  created_at?: string;
  status?: string;
  point_amount?: number;
  point_status?: string;
  submitted_at?: string;
  approved_at?: string;
  review_status?: string;
  review_url?: string;
  review_url_registered_at?: string;
  deleted_detected_at?: string;
  last_checked_at?: string;
  delete_requested_at?: string;
  delete_request_reason?: string;
  delete_rejected_at?: string;
  delete_rejected_reason?: string;
  delete_rejected_by?: number;
  rejected_reason?: string;
  rejected_at?: string;
  rejected_by?: number;
}

interface PointBalance {
  available_points: number;
  pending_points: number;
  total_earned: number;
  total_spent: number;
}

export function PlaceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [place, setPlace] = useState<Place | null>(null);
  const [allPlaces, setAllPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showPlaceDropdown, setShowPlaceDropdown] = useState(false);

  // 영수증(리뷰) 관련 상태
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);
  const [showDeleteRequestModal, setShowDeleteRequestModal] = useState(false);
  const [deletingReviewId, setDeletingReviewId] = useState<number | null>(null);

  // 포인트 관련 상태
  const [pointBalance, setPointBalance] = useState<PointBalance | null>(null);
  const [pointTransactions, setPointTransactions] = useState<any[]>([]);

  // 날짜 차이 계산 헬퍼 함수
  const calculateDaysDifference = (startDate: string, endDate?: string): number => {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  useEffect(() => {
    fetchPlace();
    fetchAllPlaces();
    fetchReviews();
    fetchPointBalance();
  }, [id]);

  const fetchPlace = async () => {
    try {
      const authData = localStorage.getItem('adr_auth');
      const { token } = authData ? JSON.parse(authData) : {};

      const response = await fetch(`http://localhost:3001/api/places/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setPlace(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch place:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllPlaces = async () => {
    try {
      const authData = localStorage.getItem('adr_auth');
      const { token } = authData ? JSON.parse(authData) : {};

      const response = await fetch('http://localhost:3001/api/places', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setAllPlaces(data.data.places);
      }
    } catch (error) {
      console.error('Failed to fetch all places:', error);
    }
  };

  const handlePlaceChange = (placeId: number) => {
    navigate(`/admin/places/${placeId}`);
    setShowPlaceDropdown(false);
  };

  const fetchPointBalance = async () => {
    try {
      const authData = localStorage.getItem('adr_auth');
      const { token } = authData ? JSON.parse(authData) : {};

      // 잔액 조회
      const balanceResponse = await fetch('http://localhost:3001/api/points/balance', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const balanceData = await balanceResponse.json();
      if (balanceData.success) {
        setPointBalance(balanceData.data);
      }

      // 거래 내역 조회 (사용/회수 분리용)
      const txParams = new URLSearchParams();
      txParams.append('limit', '1000');

      const txResponse = await fetch(`http://localhost:3001/api/points/transactions?${txParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const txData = await txResponse.json();
      if (txData.success) {
        setPointTransactions(txData.data.transactions);
      }
    } catch (error) {
      console.error('Failed to fetch point balance:', error);
    }
  };

  const fetchReviews = async () => {
    try {
      const authData = localStorage.getItem('adr_auth');
      const { token } = authData ? JSON.parse(authData) : {};

      const response = await fetch(`http://localhost:3001/api/receipts/place/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setReviews(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    }
  };

  const handleDeleteReview = async (reviewId: number) => {
    if (!confirm('이 리뷰를 삭제하시겠습니까?')) return;

    try {
      const authData = localStorage.getItem('adr_auth');
      const { token } = authData ? JSON.parse(authData) : {};

      const response = await fetch(`http://localhost:3001/api/receipts/${reviewId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        fetchReviews();
      }
    } catch (error) {
      console.error('Failed to delete review:', error);
      alert('리뷰 삭제에 실패했습니다.');
    }
  };

  const handleCancelReview = async (reviewId: number, pointAmount: number) => {
    if (!confirm(`리뷰 제출을 취소하시겠습니까?\n포인트 ${pointAmount}P가 환불됩니다.`)) return;

    try {
      const authData = localStorage.getItem('adr_auth');
      const { token } = authData ? JSON.parse(authData) : {};

      const response = await fetch(`http://localhost:3001/api/receipts/${reviewId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        alert(data.message || '리뷰가 취소되었습니다.');
        fetchReviews();
        fetchPointBalance();
      } else {
        alert(data.message || '리뷰 취소에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to cancel review:', error);
      alert('리뷰 취소에 실패했습니다.');
    }
  };

  const handleResubmitReview = async (reviewId: number, pointAmount: number) => {
    if (!confirm(`리뷰를 다시 제출하시겠습니까?\n포인트 ${pointAmount}P가 차감됩니다.`)) return;

    try {
      const authData = localStorage.getItem('adr_auth');
      const { token } = authData ? JSON.parse(authData) : {};

      const response = await fetch(`http://localhost:3001/api/receipts/${reviewId}/resubmit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        alert(data.message || '리뷰가 재제출되었습니다.');
        fetchReviews();
        fetchPointBalance();
      } else {
        alert(data.message || '리뷰 재제출에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to resubmit review:', error);
      alert('리뷰 재제출에 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (!place) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">플레이스를 찾을 수 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* 헤더 */}
      <div className="bg-white rounded-lg shadow-sm mb-6">
        {/* 상단 네비게이션 */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/admin/places')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>목록으로</span>
              </button>

              <div className="h-6 w-px bg-gray-300"></div>

              <h1 className="text-2xl font-bold text-gray-900">{place.business_name}</h1>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(`/admin/places`)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                수정
              </button>

              {/* 플레이스 선택 드롭다운 */}
              <div className="relative">
                <button
                  onClick={() => setShowPlaceDropdown(!showPlaceDropdown)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                >
                  <span>플레이스 선택</span>
                  <ChevronDown className="w-4 h-4" />
                </button>

                {showPlaceDropdown && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-10 max-h-96 overflow-y-auto">
                    <div className="p-2">
                      <input
                        type="text"
                        placeholder="플레이스 검색..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="py-1">
                      {allPlaces.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => handlePlaceChange(p.id)}
                          className={`w-full text-left px-4 py-2 hover:bg-gray-100 ${
                            p.id === place.id ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                          }`}
                        >
                          {p.id === place.id && <span className="mr-2">✓</span>}
                          {p.business_name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 플레이스 기본 정보 */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-6 text-sm text-gray-600">
            {place.address && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{place.address}</span>
              </div>
            )}
            {place.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>{place.phone}</span>
              </div>
            )}
            {place.place_type && (
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4" />
                <span>{place.place_type}</span>
              </div>
            )}
          </div>
        </div>

        {/* 탭 메뉴 */}
        <div className="px-6">
          <nav className="flex gap-8 border-b border-gray-200">
            {/* 탭 순서 변경: 배열 순서를 바꾸면 탭 순서가 바뀜 */}
            {[
              { key: 'dashboard', label: '대시보드' },
              { key: 'receipt', label: '영수증' },
              { key: 'traffic', label: '트래픽' },
              { key: 'blog', label: '블로그' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* 탭 컨텐츠 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        {activeTab === 'dashboard' && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-6">대시보드</h2>

            {/* 포인트 정보 카드 */}
            {pointBalance && (
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                      <Coins className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-700">보유 포인트</h3>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{pointBalance.available_points.toLocaleString()}P</div>
                  <p className="text-xs text-gray-600 mt-1">사용 가능</p>
                </div>

                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-6 border border-yellow-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
                      <Clock className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-700">대기 포인트</h3>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{pointBalance.pending_points.toLocaleString()}P</div>
                  <p className="text-xs text-gray-600 mt-1">승인 대기 중</p>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-700">총 적립</h3>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{pointBalance.total_earned.toLocaleString()}P</div>
                  <p className="text-xs text-gray-600 mt-1">누적 적립액</p>
                </div>

                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-6 border border-indigo-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center">
                      <Receipt className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-700">총 사용</h3>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {reviews
                      .filter(r => r.point_status === 'approved')
                      .reduce((sum, r) => sum + (r.point_amount || 0), 0)
                      .toLocaleString()}P
                  </div>
                  <p className="text-xs text-gray-600 mt-1">승인된 리뷰 사용</p>
                </div>

                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-6 border border-red-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                      <XCircle className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-700">총 회수</h3>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {pointTransactions
                      .filter(tx => tx.transaction_type === 'admin_subtract')
                      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0)
                      .toLocaleString()}P
                  </div>
                  <p className="text-xs text-gray-600 mt-1">관리자 회수</p>
                </div>
              </div>
            )}

            {/* 대시보드 카드들 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* 트래픽 카드 */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">트래픽</h3>
                  </div>
                  <button
                    onClick={() => setActiveTab('traffic')}
                    className="p-1 hover:bg-blue-200 rounded transition-colors"
                    title="설정"
                  >
                    <Settings className="w-4 h-4 text-blue-600" />
                  </button>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">-</div>
                <p className="text-sm text-gray-600">설정되지 않음</p>
              </div>

              {/* 블로그 카드 */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">블로그</h3>
                  </div>
                  <button
                    onClick={() => setActiveTab('blog')}
                    className="p-1 hover:bg-green-200 rounded transition-colors"
                    title="설정"
                  >
                    <Settings className="w-4 h-4 text-green-600" />
                  </button>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">-</div>
                <p className="text-sm text-gray-600">설정되지 않음</p>
              </div>

              {/* 영수증 카드 */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                      <Receipt className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">영수증</h3>
                  </div>
                  <button
                    onClick={() => setActiveTab('receipt')}
                    className="p-1 hover:bg-purple-200 rounded transition-colors"
                    title="설정"
                  >
                    <Settings className="w-4 h-4 text-purple-600" />
                  </button>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{reviews.length}개</div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="text-green-600">승인 {reviews.filter(r => r.point_status === 'approved').length}</span>
                  <span className="text-yellow-600">대기 {reviews.filter(r => r.point_status === 'pending').length}</span>
                  <span className="text-gray-600">임시 {reviews.filter(r => r.point_status === 'draft').length}</span>
                  <span className="text-red-600">반려 {reviews.filter(r => r.point_status === 'rejected').length}</span>
                  <span className="text-orange-600">삭제요청 {reviews.filter(r => r.delete_requested_at).length}</span>
                </div>
              </div>
            </div>

            {/* 최근 활동 */}
            <div>
              <h3 className="text-md font-semibold text-gray-900 mb-4">최근 리뷰 활동</h3>
              {reviews.length === 0 ? (
                <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500">
                  활동 내역이 없습니다.
                </div>
              ) : (
                <div className="space-y-2">
                  {reviews.slice(0, 5).map((review) => (
                    <div key={review.id} className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm text-gray-900 line-clamp-1 whitespace-pre-wrap">{review.review_text}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-gray-500">
                              {new Date(review.created_at || '').toLocaleDateString('ko-KR')}
                            </span>
                            {review.point_amount && (
                              <span className="text-xs font-semibold text-blue-600">
                                {review.point_amount}P
                              </span>
                            )}
                          </div>
                        </div>
                        <div>
                          {review.point_status === 'draft' && (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">임시</span>
                          )}
                          {review.point_status === 'pending' && (
                            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs">대기</span>
                          )}
                          {review.point_status === 'approved' && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">승인</span>
                          )}
                          {review.point_status === 'cancelled' && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">취소</span>
                          )}
                          {review.point_status === 'rejected' && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">반려</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {reviews.length > 5 && (
                    <button
                      onClick={() => setActiveTab('receipt')}
                      className="w-full py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      전체 보기 ({reviews.length}개)
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'traffic' && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-6">트래픽 관리</h2>
            <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
              트래픽 설정 기능이 곧 제공됩니다.
            </div>
          </div>
        )}

        {activeTab === 'blog' && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-6">블로그 관리</h2>
            <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
              블로그 설정 기능이 곧 제공됩니다.
            </div>
          </div>
        )}

        {activeTab === 'receipt' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">리뷰 관리</h2>
              <button
                onClick={() => setShowReviewModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                리뷰 작성
              </button>
            </div>

            {/* 통계 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <h3 className="text-sm font-semibold text-gray-700">게시중</h3>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {reviews.filter(r => r.review_status === 'posted').length}개
                </div>
                <p className="text-xs text-gray-600 mt-1">정상 게시 중</p>
              </div>

              <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="w-5 h-5 text-red-600" />
                  <h3 className="text-sm font-semibold text-gray-700">삭제됨</h3>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {reviews.filter(r => r.review_status === 'deleted_by_system' || r.review_status === 'deleted_by_request').length}개
                </div>
                <p className="text-xs text-gray-600 mt-1">삭제 감지 또는 요청</p>
              </div>

              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-yellow-600" />
                  <h3 className="text-sm font-semibold text-gray-700">게시 대기</h3>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {reviews.filter(r => r.review_status === 'awaiting_post').length}개
                </div>
                <p className="text-xs text-gray-600 mt-1">승인됨, 게시 확인 중</p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Receipt className="w-5 h-5 text-blue-600" />
                  <h3 className="text-sm font-semibold text-gray-700">전체</h3>
                </div>
                <div className="text-2xl font-bold text-gray-900">{reviews.length}개</div>
                <p className="text-xs text-gray-600 mt-1">총 리뷰 수</p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                <div className="flex items-center gap-2 mb-2">
                  <Coins className="w-5 h-5 text-purple-600" />
                  <h3 className="text-sm font-semibold text-gray-700">사용 포인트</h3>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {reviews
                    .filter(r => r.point_status === 'approved')
                    .reduce((sum, r) => sum + (r.point_amount || 0), 0)
                    .toLocaleString()}P
                </div>
                <p className="text-xs text-gray-600 mt-1">승인된 리뷰</p>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-orange-600" />
                  <h3 className="text-sm font-semibold text-gray-700">대기 포인트</h3>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {reviews
                    .filter(r => r.point_status === 'pending')
                    .reduce((sum, r) => sum + (r.point_amount || 0), 0)
                    .toLocaleString()}P
                </div>
                <p className="text-xs text-gray-600 mt-1">승인 대기중</p>
              </div>
            </div>

            {/* 리뷰 목록 */}
            <div className="space-y-3">
              {reviews.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-500">
                  등록된 리뷰가 없습니다.
                </div>
              ) : (
                reviews.map((review, index) => (
                  <div key={review.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    {/* 2단 컬럼 레이아웃 */}
                    <div className="flex gap-6">
                      {/* 왼쪽: 메타 정보 영역 (고정 너비) */}
                      <div className="w-[500px] flex-shrink-0 space-y-2">
                        {/* 번호 + 날짜 (한 줄) */}
                        <div className="flex items-center gap-2">
                          <span className="flex items-center justify-center w-7 h-7 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold flex-shrink-0">
                            #{index + 1}
                          </span>
                          <div className="flex items-center gap-1.5 text-xs text-gray-600">
                            <Clock className="w-3.5 h-3.5" />
                            <span>
                              {new Date(review.created_at || '').toLocaleString('ko-KR', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </div>

                        {/* 이미지 개수 + AI 배지 + 포인트 (한 줄) */}
                        <div className="flex items-center gap-2">
                          {review.images && review.images.length > 0 && (
                            <div className="flex items-center gap-1 text-xs text-gray-600">
                              <ImageIcon className="w-3.5 h-3.5" />
                              <span>이미지 {review.images.length}개</span>
                            </div>
                          )}
                          {review.auto_generate_image && (
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                              ✨ AI 생성
                            </span>
                          )}
                          {review.point_amount && review.point_amount > 0 && (
                            <div className="flex items-center gap-1 text-xs text-gray-700 font-medium">
                              <Coins className="w-3.5 h-3.5" />
                              <span>{review.point_amount}P</span>
                            </div>
                          )}
                        </div>

                        {/* 포인트 상태 + 리뷰 상태 배지 (한 줄) */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* 포인트 상태 */}
                          {review.point_status === 'draft' && (
                            <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium flex items-center gap-1">
                              <Edit className="w-3.5 h-3.5" />
                              임시저장
                            </span>
                          )}
                          {review.point_status === 'pending' && (
                            <span className="px-2.5 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-medium flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5" />
                              승인대기
                            </span>
                          )}
                          {review.point_status === 'approved' && (
                            <span className="px-2.5 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5" />
                              승인완료
                            </span>
                          )}
                          {review.point_status === 'cancelled' && (
                            <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded text-xs font-medium flex items-center gap-1">
                              <XCircle className="w-3.5 h-3.5" />
                              취소됨
                            </span>
                          )}
                          {review.point_status === 'rejected' && (
                            <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded text-xs font-medium flex items-center gap-1">
                              <XCircle className="w-3.5 h-3.5" />
                              반려됨
                            </span>
                          )}
                          {review.point_status === 'refunded' && (
                            <span className="px-2.5 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium flex items-center gap-1">
                              <XCircle className="w-3.5 h-3.5" />
                              자동환불
                            </span>
                          )}

                          {/* 리뷰 상태 (승인 완료시만) - 날짜 정보 가로 배치 */}
                          {review.point_status === 'approved' && (
                            <>
                              {review.review_status === 'posted' && review.review_url_registered_at && (
                                <>
                                  <span className="px-2.5 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold flex items-center gap-1">
                                    <CheckCircle className="w-3.5 h-3.5" />
                                    ✅ 게시중 · {calculateDaysDifference(review.review_url_registered_at)}일째
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    📅 {new Date(review.review_url_registered_at).toLocaleDateString('ko-KR')}~
                                  </span>
                                </>
                              )}
                              {review.review_status === 'deleted_by_system' && review.deleted_detected_at && review.review_url_registered_at && (
                                <>
                                  <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded text-xs font-semibold flex items-center gap-1">
                                    <XCircle className="w-3.5 h-3.5" />
                                    ⚠️ 삭제됨 · {calculateDaysDifference(review.review_url_registered_at, review.deleted_detected_at)}일간
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    📅 {new Date(review.review_url_registered_at).toLocaleDateString('ko-KR')} ~ {new Date(review.deleted_detected_at).toLocaleDateString('ko-KR')}
                                  </span>
                                </>
                              )}
                              {review.review_status === 'deleted_by_request' && review.deleted_detected_at && review.review_url_registered_at && (
                                <>
                                  <span className="px-2.5 py-1 bg-orange-100 text-orange-700 rounded text-xs font-semibold flex items-center gap-1">
                                    <XCircle className="w-3.5 h-3.5" />
                                    🗑️ 요청삭제 · {calculateDaysDifference(review.review_url_registered_at, review.deleted_detected_at)}일간
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    📅 {new Date(review.review_url_registered_at).toLocaleDateString('ko-KR')} ~ {new Date(review.deleted_detected_at).toLocaleDateString('ko-KR')}
                                  </span>
                                </>
                              )}
                              {review.review_status === 'awaiting_post' && (
                                <span className="px-2.5 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-semibold flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5" />
                                  ⏳ 게시 대기
                                </span>
                              )}
                            </>
                          )}
                        </div>

                        {/* 반려 사유 표시 */}
                        {review.point_status === 'rejected' && review.rejected_reason && (
                          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs">
                            <span className="font-semibold text-red-900">반려 사유:</span>
                            <p className="text-red-800 mt-1">{review.rejected_reason}</p>
                          </div>
                        )}

                        {/* 삭제 요청 거부 사유 표시 */}
                        {review.delete_rejected_at && review.delete_rejected_reason && (
                          <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-xs">
                            <span className="font-semibold text-orange-900">삭제 요청 거부 사유:</span>
                            <p className="text-orange-800 mt-1">{review.delete_rejected_reason}</p>
                            <p className="text-orange-600 text-xs mt-1">
                              {new Date(review.delete_rejected_at).toLocaleString('ko-KR')}
                            </p>
                          </div>
                        )}

                        {/* 액션 버튼들 */}
                        <div className="flex gap-2 pt-1.5 border-t border-gray-200">
                          {/* 승인 대기중: 제출 취소 버튼 */}
                          {review.point_status === 'pending' && (
                            <button
                              onClick={() => handleCancelReview(review.id!, review.point_amount || 0)}
                              className="px-2.5 py-1.5 text-xs border border-orange-300 text-orange-600 rounded hover:bg-orange-50 flex items-center gap-1"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              제출 취소
                            </button>
                          )}

                          {/* 취소됨 또는 반려됨: 재제출 버튼 */}
                          {(review.point_status === 'cancelled' || review.point_status === 'rejected') && (
                            <button
                              onClick={() => handleResubmitReview(review.id!, review.point_amount || 0)}
                              className="px-2.5 py-1.5 text-xs border border-blue-300 text-blue-600 rounded hover:bg-blue-50 flex items-center gap-1"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              재제출
                            </button>
                          )}

                          {/* 승인 완료 + 게시중: 리뷰 삭제 신청 */}
                          {review.point_status === 'approved' && review.review_status === 'posted' && (
                            <>
                              {review.delete_requested_at ? (
                                <div className="px-2.5 py-1.5 text-xs bg-orange-100 text-orange-700 rounded flex items-center gap-1">
                                  <AlertCircle className="w-3.5 h-3.5" />
                                  삭제 신청됨
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setDeletingReviewId(review.id!);
                                    setShowDeleteRequestModal(true);
                                  }}
                                  className="px-2.5 py-1.5 text-xs border border-red-300 text-red-600 rounded hover:bg-red-50 flex items-center gap-1"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  {review.delete_rejected_at ? '재신청' : '리뷰 삭제 신청'}
                                </button>
                              )}
                            </>
                          )}

                          {/* 수정 버튼 */}
                          {review.point_status !== 'approved' && (
                            <button
                              onClick={() => {
                                setEditingReviewId(review.id!);
                                setShowEditModal(true);
                              }}
                              className="px-2.5 py-1.5 text-xs border border-gray-300 text-gray-700 rounded hover:bg-gray-50 flex items-center gap-1"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              수정
                            </button>
                          )}

                          {/* 삭제 버튼: draft, cancelled, rejected, 삭제된 리뷰 */}
                          {(review.point_status === 'draft' ||
                            review.point_status === 'cancelled' ||
                            review.point_status === 'rejected' ||
                            review.review_status === 'deleted_by_system' ||
                            review.review_status === 'deleted_by_request') && (
                            <button
                              onClick={() => handleDeleteReview(review.id!)}
                              className="px-2.5 py-1.5 text-xs bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-1"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              삭제
                            </button>
                          )}
                        </div>
                      </div>

                      {/* 구분선 */}
                      <div className="w-px bg-gray-200 flex-shrink-0"></div>

                      {/* 오른쪽: 리뷰 콘텐츠 영역 (유동 너비) */}
                      <div className="flex-1 min-w-0">
                        {/* 리뷰 내용 */}
                        <div className="mb-4 max-h-60 overflow-y-auto">
                          <p className="text-base text-gray-900 leading-relaxed whitespace-pre-wrap">
                            {review.review_text}
                          </p>
                        </div>

                        {/* 이미지 미리보기 */}
                        {review.images && review.images.length > 0 && (
                          <div className="flex gap-2 flex-wrap">
                            {review.images.slice(0, 6).map((img, idx) => (
                              <div key={idx} className="relative">
                                <img
                                  src={`http://localhost:3001${img}`}
                                  alt="review"
                                  className="w-24 h-24 object-cover rounded-lg cursor-pointer hover:opacity-75 border border-gray-200"
                                  onClick={() => window.open(`http://localhost:3001${img}`, '_blank')}
                                />
                                {idx === 5 && review.images.length > 6 && (
                                  <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center text-white text-sm font-semibold">
                                    +{review.images.length - 6}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* 리뷰 작성 모달 */}
      <ReviewCreateModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        onSuccess={() => {
          fetchReviews();
        }}
        placeId={id!}
      />

      {/* 리뷰 수정 모달 */}
      <ReviewEditModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingReviewId(null);
        }}
        onSuccess={() => {
          fetchReviews();
        }}
        reviewId={editingReviewId}
      />

      {/* 삭제 요청 모달 */}
      <DeleteRequestModal
        isOpen={showDeleteRequestModal}
        onClose={() => {
          setShowDeleteRequestModal(false);
          setDeletingReviewId(null);
        }}
        onSuccess={() => {
          fetchReviews();
          fetchPointBalance();
        }}
        reviewId={deletingReviewId!}
        placeName={place.business_name}
      />
    </div>
  );
}
