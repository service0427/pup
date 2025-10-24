import { useState, useEffect } from 'react';
import { Search, RefreshCw, CheckCircle, XCircle, Eye, Clock, MapPin, Sparkles, Trash2 } from 'lucide-react';

interface Review {
  id: number;
  place_id: number;
  place_name: string;
  address: string;
  advertiser_name: string;
  review_text: string;
  images: string[];
  auto_generate_image: boolean;
  point_amount: number;
  point_status: string;
  review_status: string;
  review_url?: string;
  review_url_registered_at?: string;
  deleted_detected_at?: string;
  submitted_at: string;
  created_at: string;
  delete_requested_at?: string;
  delete_request_reason?: string;
}

export function ReviewManagementPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'delete'>('pending');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [allReviews, setAllReviews] = useState<Review[]>([]); // 전체 리뷰 (카운트용)
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [editingStatus, setEditingStatus] = useState(false);
  const [newReviewStatus, setNewReviewStatus] = useState('');
  const [postedDate, setPostedDate] = useState('');
  const [deletedDate, setDeletedDate] = useState('');

  useEffect(() => {
    fetchReviews();
    fetchAllReviewsForCount();
  }, [activeTab]);

  const fetchAllReviewsForCount = async () => {
    try {
      const authData = localStorage.getItem('adr_auth');
      const { token } = authData ? JSON.parse(authData) : {};

      const response = await fetch('/api/receipts/admin/all', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        setAllReviews(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch all reviews for count:', error);
    }
  };

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const authData = localStorage.getItem('adr_auth');
      const { token } = authData ? JSON.parse(authData) : {};

      let endpoint = '';
      if (activeTab === 'all') {
        endpoint = '/api/receipts/admin/all';
      } else if (activeTab === 'pending') {
        endpoint = '/api/receipts/admin/pending';
      } else if (activeTab === 'delete') {
        endpoint = '/api/receipts/admin/delete-requests';
      }

      const response = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        setReviews(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    if (!confirm('이 리뷰를 승인하시겠습니까?')) return;

    try {
      setProcessing(true);
      const authData = localStorage.getItem('adr_auth');
      const { token } = authData ? JSON.parse(authData) : {};

      const response = await fetch(`/api/receipts/${id}/approve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        alert(data.message);
        setShowDetailModal(false);
        setSelectedReview(null);
        setEditingStatus(false);
        setNewReviewStatus('');
        setPostedDate('');
        setDeletedDate('');
        fetchReviews();
        fetchAllReviewsForCount();
      } else {
        alert(data.message || '승인에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to approve:', error);
      alert('승인 처리 중 오류가 발생했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (id: number) => {
    if (!rejectReason.trim()) {
      alert('반려 사유를 입력해주세요.');
      return;
    }

    if (!confirm('이 리뷰를 반려하시겠습니까? 포인트가 환불됩니다.')) return;

    try {
      setProcessing(true);
      const authData = localStorage.getItem('adr_auth');
      const { token } = authData ? JSON.parse(authData) : {};

      const response = await fetch(`/api/receipts/${id}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: rejectReason })
      });

      const data = await response.json();
      if (data.success) {
        alert(data.message);
        setShowDetailModal(false);
        setSelectedReview(null);
        setRejecting(false);
        setRejectReason('');
        setEditingStatus(false);
        setNewReviewStatus('');
        setPostedDate('');
        setDeletedDate('');
        fetchReviews();
        fetchAllReviewsForCount();
      } else {
        alert(data.message || '반려에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to reject:', error);
      alert('반려 처리 중 오류가 발생했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  const handleApproveDelete = async (id: number) => {
    if (!confirm('이 리뷰의 삭제를 승인하시겠습니까?')) return;

    try {
      setProcessing(true);
      const authData = localStorage.getItem('adr_auth');
      const { token } = authData ? JSON.parse(authData) : {};

      const response = await fetch(`/api/receipts/${id}/approve-delete`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        alert(data.message || '삭제가 승인되었습니다.');
        setShowDetailModal(false);
        setSelectedReview(null);
        setEditingStatus(false);
        setNewReviewStatus('');
        setPostedDate('');
        setDeletedDate('');
        fetchReviews();
        fetchAllReviewsForCount();
      } else {
        alert(data.message || '삭제 승인에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to approve delete:', error);
      alert('삭제 승인 처리 중 오류가 발생했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectDelete = async (id: number) => {
    if (!rejectReason.trim()) {
      alert('거부 사유를 입력해주세요.');
      return;
    }

    if (!confirm('이 삭제 요청을 거부하시겠습니까?')) return;

    try {
      setProcessing(true);
      const authData = localStorage.getItem('adr_auth');
      const { token } = authData ? JSON.parse(authData) : {};

      const response = await fetch(`/api/receipts/${id}/reject-delete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: rejectReason })
      });

      const data = await response.json();
      if (data.success) {
        alert(data.message || '삭제 요청이 거부되었습니다.');
        setShowDetailModal(false);
        setSelectedReview(null);
        setRejecting(false);
        setRejectReason('');
        setEditingStatus(false);
        setNewReviewStatus('');
        setPostedDate('');
        setDeletedDate('');
        fetchReviews();
        fetchAllReviewsForCount();
      } else {
        alert(data.message || '삭제 거부에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to reject delete:', error);
      alert('삭제 거부 처리 중 오류가 발생했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdateReviewStatus = async (id: number) => {
    if (!newReviewStatus) {
      alert('리뷰 상태를 선택해주세요.');
      return;
    }

    // posted 상태인데 게시일이 없으면 경고
    if (newReviewStatus === 'posted' && !postedDate) {
      alert('게시일을 입력해주세요.');
      return;
    }

    // deleted 상태인데 삭제일이 없으면 경고
    if ((newReviewStatus === 'deleted_by_request' || newReviewStatus === 'deleted_by_system') && !deletedDate) {
      alert('삭제일을 입력해주세요.');
      return;
    }

    if (!confirm('리뷰 상태를 변경하시겠습니까?')) return;

    try {
      setProcessing(true);
      const authData = localStorage.getItem('adr_auth');
      const { token } = authData ? JSON.parse(authData) : {};

      const response = await fetch(`/api/receipts/${id}/update-review-status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          review_status: newReviewStatus,
          review_url_registered_at: newReviewStatus === 'posted' ? postedDate : null,
          deleted_detected_at: (newReviewStatus === 'deleted_by_request' || newReviewStatus === 'deleted_by_system') ? deletedDate : null
        })
      });

      const data = await response.json();
      if (data.success) {
        alert('리뷰 상태가 변경되었습니다.');
        setEditingStatus(false);
        setNewReviewStatus('');
        setPostedDate('');
        setDeletedDate('');
        fetchReviews();
        fetchAllReviewsForCount();
        // 모달 닫지 않고 데이터만 업데이트
        if (selectedReview) {
          setSelectedReview({
            ...selectedReview,
            review_status: newReviewStatus,
            review_url_registered_at: newReviewStatus === 'posted' ? postedDate : selectedReview.review_url_registered_at,
            deleted_detected_at: (newReviewStatus === 'deleted_by_request' || newReviewStatus === 'deleted_by_system') ? deletedDate : selectedReview.deleted_detected_at
          });
        }
      } else {
        alert(data.message || '리뷰 상태 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to update review status:', error);
      alert('리뷰 상태 변경 중 오류가 발생했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) {
      alert('승인할 리뷰를 선택해주세요.');
      return;
    }

    if (!confirm(`선택한 ${selectedIds.length}개의 리뷰를 승인하시겠습니까?`)) return;

    try {
      setProcessing(true);
      const authData = localStorage.getItem('adr_auth');
      const { token } = authData ? JSON.parse(authData) : {};

      let successCount = 0;
      let failCount = 0;

      for (const id of selectedIds) {
        try {
          const response = await fetch(`/api/receipts/${id}/approve`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
          });

          const data = await response.json();
          if (data.success) {
            successCount++;
          } else {
            failCount++;
          }
        } catch (error) {
          failCount++;
        }
      }

      alert(`승인 완료: ${successCount}개\n실패: ${failCount}개`);
      setSelectedIds([]);
      fetchReviews();
      fetchAllReviewsForCount();
    } catch (error) {
      console.error('Failed to bulk approve:', error);
      alert('일괄 승인 처리 중 오류가 발생했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  const handleBulkApproveDelete = async () => {
    if (selectedIds.length === 0) {
      alert('삭제 승인할 리뷰를 선택해주세요.');
      return;
    }

    if (!confirm(`선택한 ${selectedIds.length}개의 삭제 요청을 승인하시겠습니까?`)) return;

    try {
      setProcessing(true);
      const authData = localStorage.getItem('adr_auth');
      const { token } = authData ? JSON.parse(authData) : {};

      let successCount = 0;
      let failCount = 0;

      for (const id of selectedIds) {
        try {
          const response = await fetch(`/api/receipts/${id}/approve-delete`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
          });

          const data = await response.json();
          if (data.success) {
            successCount++;
          } else {
            failCount++;
          }
        } catch (error) {
          failCount++;
        }
      }

      alert(`삭제 승인 완료: ${successCount}개\n실패: ${failCount}개`);
      setSelectedIds([]);
      fetchReviews();
      fetchAllReviewsForCount();
    } catch (error) {
      console.error('Failed to bulk approve delete:', error);
      alert('일괄 삭제 승인 처리 중 오류가 발생했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredReviews.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredReviews.map(r => r.id));
    }
  };

  const toggleSelect = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const filteredReviews = reviews.filter(review => {
    // 검색어 필터
    const matchesSearch = review.place_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.advertiser_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.review_text.toLowerCase().includes(searchTerm.toLowerCase());

    // 전체 탭에서만 상태 필터 적용
    if (activeTab === 'all' && statusFilter !== 'all') {
      return matchesSearch && review.point_status === statusFilter;
    }

    return matchesSearch;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDisplayStatus = (pointStatus: string, reviewStatus: string) => {
    let label = '';
    let color = '';
    let bgColor = '';

    // point_status를 우선 체크
    if (pointStatus === 'pending') {
      label = '승인 대기중';
      color = 'text-yellow-700';
      bgColor = 'bg-yellow-100';
    } else if (pointStatus === 'rejected') {
      label = '반려됨';
      color = 'text-red-700';
      bgColor = 'bg-red-100';
    } else if (pointStatus === 'cancelled') {
      label = '취소됨';
      color = 'text-gray-700';
      bgColor = 'bg-gray-100';
    } else if (pointStatus === 'approved') {
      // point_status가 approved인 경우 review_status 확인
      if (reviewStatus === 'awaiting_post') {
        label = '게시 대기';
        color = 'text-blue-700';
        bgColor = 'bg-blue-100';
      } else if (reviewStatus === 'posted') {
        label = '게시중';
        color = 'text-green-700';
        bgColor = 'bg-green-100';
      } else if (reviewStatus === 'deleted_by_system') {
        label = '시스템 삭제';
        color = 'text-gray-700';
        bgColor = 'bg-gray-100';
      } else if (reviewStatus === 'deleted_by_request') {
        label = '요청 삭제';
        color = 'text-red-700';
        bgColor = 'bg-red-100';
      } else if (reviewStatus === 'expired') {
        label = '만료됨';
        color = 'text-orange-700';
        bgColor = 'bg-orange-100';
      } else {
        label = reviewStatus || '알 수 없음';
        color = 'text-gray-700';
        bgColor = 'bg-gray-100';
      }
    } else {
      label = pointStatus || '알 수 없음';
      color = 'text-gray-700';
      bgColor = 'bg-gray-100';
    }

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${bgColor} ${color}`}>
        {label}
      </span>
    );
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">리뷰 관리</h1>
        <p className="mt-1 text-gray-600">전체 리뷰를 관리하고 승인/삭제 요청을 처리하세요</p>
      </div>

      {/* 탭 메뉴 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button
              onClick={() => {
                setActiveTab('all');
                setSelectedIds([]);
              }}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'all'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              전체 ({allReviews.length})
            </button>
            <button
              onClick={() => {
                setActiveTab('pending');
                setSelectedIds([]);
              }}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'pending'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              승인요청 ({allReviews.filter(r => r.point_status === 'pending').length})
            </button>
            <button
              onClick={() => {
                setActiveTab('delete');
                setSelectedIds([]);
              }}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'delete'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              삭제요청 ({allReviews.filter(r => r.delete_requested_at).length})
            </button>
          </nav>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="장소명, 광고주, 리뷰 내용으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {activeTab === 'pending' && selectedIds.length > 0 && (
            <button
              onClick={handleBulkApprove}
              disabled={processing}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              선택 승인 ({selectedIds.length})
            </button>
          )}
          {activeTab === 'delete' && selectedIds.length > 0 && (
            <button
              onClick={handleBulkApproveDelete}
              disabled={processing}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              선택 삭제승인 ({selectedIds.length})
            </button>
          )}
          <button
            onClick={fetchReviews}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            새로고침
          </button>
        </div>

        {/* 전체 탭에서만 상태 필터 표시 */}
        {activeTab === 'all' && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">상태:</span>
            {['all', 'draft', 'pending', 'approved', 'cancelled', 'refunded'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  statusFilter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status === 'all' ? '전체' :
                 status === 'draft' ? '임시저장' :
                 status === 'pending' ? '승인대기' :
                 status === 'approved' ? '승인완료' :
                 status === 'cancelled' ? '취소됨' :
                 status === 'refunded' ? '환불됨' : status}
                {status !== 'all' && ` (${allReviews.filter(r => r.point_status === status).length})`}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">승인 대기</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">{allReviews.filter(r => r.point_status === 'pending').length}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">선택됨</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{selectedIds.length}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">AI 이미지</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">{reviews.filter(r => r.auto_generate_image).length}</p>
            </div>
            <Sparkles className="w-8 h-8 text-purple-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">총 포인트</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{reviews.reduce((sum, r) => sum + r.point_amount, 0).toLocaleString()}P</p>
            </div>
            <div className="text-green-600 text-2xl font-bold">₩</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {activeTab !== 'all' && (
                  <th className="px-6 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === filteredReviews.length && filteredReviews.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">장소명</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">광고주</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">리뷰</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">리뷰상태</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">포인트</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">제출일</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={activeTab === 'all' ? 7 : 8} className="px-6 py-8 text-center text-gray-500">로딩 중...</td></tr>
              ) : filteredReviews.length === 0 ? (
                <tr><td colSpan={activeTab === 'all' ? 7 : 8} className="px-6 py-8 text-center text-gray-500">승인 대기 중인 리뷰가 없습니다.</td></tr>
              ) : (
                filteredReviews.map((review) => (
                  <tr key={review.id} className="hover:bg-gray-50">
                    {activeTab !== 'all' && (
                      <td className="px-6 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(review.id)}
                          onChange={() => toggleSelect(review.id)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </td>
                    )}
                    <td className="px-6 py-4 text-sm">
                      <p className="font-medium text-gray-900">{review.place_name}</p>
                      <p className="text-gray-500 text-xs truncate max-w-xs">{review.address}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{review.advertiser_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs">
                      <div className="flex items-center gap-2">
                        <p className="truncate flex-1">{review.review_text}</p>
                        {review.auto_generate_image && (
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium flex items-center gap-1 flex-shrink-0">
                            <Sparkles className="w-3 h-3" />
                            AI
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {getDisplayStatus(review.point_status, review.review_status)}
                    </td>
                    <td className="px-6 py-4 text-sm text-right">
                      <span className="font-semibold text-blue-600">{review.point_amount.toLocaleString()}P</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{formatDate(review.submitted_at || review.created_at)}</td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => {
                          setSelectedReview(review);
                          setShowDetailModal(true);
                          setEditingStatus(false);
                          setNewReviewStatus('');
                          setPostedDate('');
                          setDeletedDate('');
                        }}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-1 mx-auto"
                      >
                        <Eye className="w-4 h-4" />
                        보기
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 상세 모달 */}
      {showDetailModal && selectedReview && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => {
              if (!processing) {
                setShowDetailModal(false);
                setEditingStatus(false);
                setNewReviewStatus('');
                setPostedDate('');
                setDeletedDate('');
              }
            }}></div>
            <div className="relative bg-white rounded-lg max-w-3xl w-full max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between p-6 border-b">
                <div>
                  <h2 className="text-xl font-semibold">리뷰 상세</h2>
                  <p className="text-sm text-gray-600 mt-1">#{selectedReview.id} · {selectedReview.place_name}</p>
                </div>
                <button onClick={() => {
                  if (!processing) {
                    setShowDetailModal(false);
                    setEditingStatus(false);
                    setNewReviewStatus('');
                    setPostedDate('');
                    setDeletedDate('');
                  }
                }} className="p-1 hover:bg-gray-100 rounded">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-600 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{selectedReview.place_name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{selectedReview.address}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <span className="text-gray-600">광고주: <span className="font-medium">{selectedReview.advertiser_name}</span></span>
                        <span className="text-blue-600 font-semibold">{selectedReview.point_amount.toLocaleString()}P</span>
                        {getDisplayStatus(selectedReview.point_status, selectedReview.review_status)}
                      </div>
                      {selectedReview.review_url && (
                        <div className="mt-2">
                          <a
                            href={selectedReview.review_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                          >
                            리뷰 URL 보기 →
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">리뷰 내용</label>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-900 whitespace-pre-wrap">{selectedReview.review_text}</p>
                  </div>
                </div>

                {selectedReview.images && selectedReview.images.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">리뷰 이미지</label>
                      {selectedReview.auto_generate_image && (
                        <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          AI 자동 생성 이미지
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {selectedReview.images.map((img, idx) => (
                        <img
                          key={idx}
                          src={`${img}`}
                          alt={`리뷰 이미지 ${idx + 1}`}
                          className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-75 transition-opacity"
                          onClick={() => window.open(`${img}`, '_blank')}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* 리뷰 상태 관리 */}
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-blue-900">리뷰 상태 관리</label>
                    {!editingStatus && selectedReview.point_status === 'approved' && (
                      <button
                        onClick={() => {
                          setEditingStatus(true);
                          setNewReviewStatus(selectedReview.review_status);
                          // 기존 날짜가 있으면 자동 입력 (YYYY-MM-DD 형식)
                          if (selectedReview.review_url_registered_at) {
                            const date = new Date(selectedReview.review_url_registered_at);
                            const formatted = date.toISOString().slice(0, 10);
                            setPostedDate(formatted);
                          }
                          if (selectedReview.deleted_detected_at) {
                            const date = new Date(selectedReview.deleted_detected_at);
                            const formatted = date.toISOString().slice(0, 10);
                            setDeletedDate(formatted);
                          }
                        }}
                        className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                      >
                        상태 변경
                      </button>
                    )}
                  </div>

                  {editingStatus ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">리뷰 상태</label>
                        <select
                          value={newReviewStatus}
                          onChange={(e) => setNewReviewStatus(e.target.value)}
                          className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                          <option value="">선택하세요</option>
                          <option value="awaiting_post">게시대기</option>
                          <option value="posted">게시중</option>
                          <option value="deleted_by_system">시스템삭제</option>
                          <option value="deleted_by_request">요청삭제</option>
                          <option value="expired">만료됨</option>
                        </select>
                      </div>

                      {/* 게시중 상태일 때 게시일 입력 */}
                      {newReviewStatus === 'posted' && (
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">게시일 *</label>
                          <input
                            type="date"
                            value={postedDate}
                            onChange={(e) => setPostedDate(e.target.value)}
                            className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          />
                        </div>
                      )}

                      {/* 삭제 상태일 때 삭제일 입력 */}
                      {(newReviewStatus === 'deleted_by_system' || newReviewStatus === 'deleted_by_request') && (
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">삭제일 *</label>
                          <input
                            type="date"
                            value={deletedDate}
                            onChange={(e) => setDeletedDate(e.target.value)}
                            className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          />
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingStatus(false);
                            setNewReviewStatus('');
                            setPostedDate('');
                            setDeletedDate('');
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
                        >
                          취소
                        </button>
                        <button
                          onClick={() => handleUpdateReviewStatus(selectedReview.id)}
                          disabled={processing}
                          className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
                        >
                          저장
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-blue-800">
                      <p>현재 상태: {getDisplayStatus(selectedReview.point_status, selectedReview.review_status)}</p>
                      {selectedReview.review_url_registered_at && (
                        <p className="mt-1 text-xs">
                          게시일: {new Date(selectedReview.review_url_registered_at).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                        </p>
                      )}
                      {selectedReview.deleted_detected_at && (
                        <p className="mt-1 text-xs">
                          삭제일: {new Date(selectedReview.deleted_detected_at).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                        </p>
                      )}
                      {selectedReview.review_url && (
                        <p className="mt-1 text-xs">
                          URL: <a href={selectedReview.review_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{selectedReview.review_url}</a>
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* 광고주가 작성한 삭제 요청 사유 표시 */}
                {selectedReview.delete_request_reason && (
                  <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <label className="block text-sm font-medium text-orange-900 mb-2">광고주 삭제 요청 사유</label>
                    <p className="text-sm text-orange-800">{selectedReview.delete_request_reason}</p>
                  </div>
                )}

                {/* 승인/반려 입력 영역 */}
                {rejecting && (
                  <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <label className="block text-sm font-medium text-red-900 mb-2">
                      {selectedReview.delete_requested_at ? '삭제 거부 사유 *' : '반려 사유 *'}
                    </label>
                    <textarea
                      rows={3}
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder={selectedReview.delete_requested_at ? '삭제 거부 사유를 입력하세요...' : '반려 사유를 입력하세요...'}
                      className="w-full px-3 py-2 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 p-6 border-t">
                <button
                  onClick={() => {
                    if (!processing) {
                      setShowDetailModal(false);
                      setEditingStatus(false);
                      setNewReviewStatus('');
                      setPostedDate('');
                      setDeletedDate('');
                    }
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  disabled={processing}
                >
                  닫기
                </button>

                {/* 승인 대기중인 리뷰: 승인/반려 버튼 */}
                {selectedReview.point_status === 'pending' && (
                  !rejecting ? (
                    <>
                      <button
                        onClick={() => setRejecting(true)}
                        disabled={processing}
                        className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 disabled:opacity-50 flex items-center gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        반려
                      </button>
                      <button
                        onClick={() => handleApprove(selectedReview.id)}
                        disabled={processing}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        승인
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setRejecting(false);
                          setRejectReason('');
                        }}
                        disabled={processing}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                      >
                        취소
                      </button>
                      <button
                        onClick={() => handleReject(selectedReview.id)}
                        disabled={processing}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        반려 확정
                      </button>
                    </>
                  )
                )}

                {/* 삭제 요청된 리뷰: 삭제 승인/거부 버튼 */}
                {selectedReview.delete_requested_at && (
                  !rejecting ? (
                    <>
                      <button
                        onClick={() => setRejecting(true)}
                        disabled={processing}
                        className="px-4 py-2 border border-orange-300 text-orange-700 rounded-lg hover:bg-orange-50 disabled:opacity-50 flex items-center gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        삭제 거부
                      </button>
                      <button
                        onClick={() => handleApproveDelete(selectedReview.id)}
                        disabled={processing}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        삭제 승인
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setRejecting(false);
                          setRejectReason('');
                        }}
                        disabled={processing}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                      >
                        취소
                      </button>
                      <button
                        onClick={() => handleRejectDelete(selectedReview.id)}
                        disabled={processing}
                        className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        거부 확정
                      </button>
                    </>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
