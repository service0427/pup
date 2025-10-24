import { useState, useEffect } from 'react';
import {
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Calendar,
  DollarSign,
  User,
  MessageSquare,
  Filter,
  Search,
  Loader2,
  AlertCircle,
  X
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface PointRequest {
  id: number;
  requested_amount: number;
  purpose: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  reviewed_at: string | null;
  review_notes: string | null;
  requester_username: string;
  requester_name: string;
  requester_role: string;
  reviewer_username: string | null;
  reviewer_name: string | null;
}

export function PointRequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<PointRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PointRequest | null>(null);
  const [userBalance, setUserBalance] = useState<{available_points: number, total_earned: number} | null>(null);

  // 새 요청 생성 폼
  const [newRequest, setNewRequest] = useState({
    requested_amount: '',
    purpose: ''
  });

  // 검토 폼
  const [reviewForm, setReviewForm] = useState({
    status: 'approved' as 'approved' | 'rejected',
    review_notes: ''
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchRequests();
    if (user?.role === 'distributor' || user?.role === 'advertiser') {
      fetchUserBalance();
    }
  }, [statusFilter, user]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const response = await fetch(`http://localhost:3001/api/point-requests?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adr_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRequests(data.data.requests);
      }
    } catch (error) {
      console.error('포인트 요청 목록 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserBalance = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/users/${user?.id}/balance`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adr_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUserBalance(data.data);
      }
    } catch (error) {
      console.error('포인트 잔액 조회 실패:', error);
    }
  };

  const createRequest = async () => {
    try {
      setSubmitting(true);
      const response = await fetch('http://localhost:3001/api/point-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adr_token')}`
        },
        body: JSON.stringify({
          requested_amount: parseInt(newRequest.requested_amount),
          purpose: newRequest.purpose
        })
      });

      if (response.ok) {
        setShowCreateModal(false);
        setNewRequest({ requested_amount: '', purpose: '' });
        fetchRequests();
        alert('포인트 요청이 생성되었습니다.');
      } else {
        const error = await response.json();
        alert(error.message || '포인트 요청 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('포인트 요청 생성 실패:', error);
      alert('포인트 요청 생성 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const reviewRequest = async () => {
    if (!selectedRequest) return;

    try {
      setSubmitting(true);
      const response = await fetch(`http://localhost:3001/api/point-requests/${selectedRequest.id}/review`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adr_token')}`
        },
        body: JSON.stringify(reviewForm)
      });

      if (response.ok) {
        setShowReviewModal(false);
        setSelectedRequest(null);
        setReviewForm({ status: 'approved', review_notes: '' });
        fetchRequests();
        alert(`포인트 요청이 ${reviewForm.status === 'approved' ? '승인' : '반려'}되었습니다.`);
      } else {
        const error = await response.json();
        alert(error.message || '포인트 요청 검토에 실패했습니다.');
      }
    } catch (error) {
      console.error('포인트 요청 검토 실패:', error);
      alert('포인트 요청 검토 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Clock, label: '대기중' },
      approved: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle, label: '승인됨' },
      rejected: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle, label: '반려됨' }
    };
    const badge = badges[status as keyof typeof badges];
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        <Icon className="w-3 h-3 mr-1" />
        {badge.label}
      </span>
    );
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR');
  };

  const filteredRequests = requests.filter(request =>
    request.purpose.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.requester_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canCreateRequest = user?.role === 'distributor' || user?.role === 'developer';
  const canReviewRequest = user?.role === 'admin' || user?.role === 'developer';

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">포인트 관리</h1>
            <p className="text-gray-600">
              {user?.role === 'developer' && '모든 포인트 요청을 관리하고 검토할 수 있습니다.'}
              {user?.role === 'admin' && '포인트 요청을 검토하고 승인/반료할 수 있습니다.'}
              {user?.role === 'distributor' && '포인트 요청을 생성하고 내 요청 내역을 확인할 수 있습니다.'}
              {user?.role === 'advertiser' && '내 포인트 내역을 확인할 수 있습니다.'}
            </p>
          </div>

          {/* 포인트 잔액 표시 (총판, 광고주) */}
          {(user?.role === 'distributor' || user?.role === 'advertiser') && userBalance && (
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg shadow-lg">
              <div className="text-center">
                <div className="text-sm opacity-90 mb-1">보유 포인트</div>
                <div className="text-3xl font-bold">{formatAmount(userBalance.available_points)}P</div>
                <div className="text-xs opacity-75 mt-1">
                  누적 획득: {formatAmount(userBalance.total_earned)}P
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 컨트롤 바 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* 검색 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="목적이나 요청자명으로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
              />
            </div>

            {/* 상태 필터 */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="all">전체 상태</option>
                <option value="pending">대기중</option>
                <option value="approved">승인됨</option>
                <option value="rejected">반려됨</option>
              </select>
            </div>
          </div>

          {/* 새 요청 생성 버튼 (총판만) */}
          {canCreateRequest && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              새 포인트 요청
            </button>
          )}
        </div>
      </div>

      {/* 요청 목록 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">포인트 요청이 없습니다</h3>
            <p className="text-gray-500">
              {canCreateRequest ? '새 포인트 요청을 생성해보세요.' : '아직 등록된 포인트 요청이 없습니다.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">요청자</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">요청 금액</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">목적</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">요청일</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">검토일</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="w-4 h-4 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{request.requester_name}</div>
                          <div className="text-sm text-gray-500">@{request.requester_username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <DollarSign className="w-4 h-4 text-gray-400 mr-1" />
                        <span className="text-sm font-medium text-gray-900">
                          {formatAmount(request.requested_amount)} P
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate" title={request.purpose}>
                        {request.purpose}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(request.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(request.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {request.reviewed_at ? formatDate(request.reviewed_at) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowDetailModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="상세 보기"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {canReviewRequest && request.status === 'pending' && (
                          <button
                            onClick={() => {
                              setSelectedRequest(request);
                              setShowReviewModal(true);
                            }}
                            className="text-green-600 hover:text-green-900"
                            title="검토하기"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 새 요청 생성 모달 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">새 포인트 요청</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">요청 포인트</label>
                <input
                  type="number"
                  value={newRequest.requested_amount}
                  onChange={(e) => setNewRequest(prev => ({ ...prev, requested_amount: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="요청할 포인트를 입력하세요"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">요청 목적</label>
                <textarea
                  value={newRequest.purpose}
                  onChange={(e) => setNewRequest(prev => ({ ...prev, purpose: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="포인트 요청 목적을 상세히 입력하세요 (최소 10자)"
                  rows={3}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {newRequest.purpose.length}/10 (최소 10자 이상)
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={createRequest}
                disabled={submitting || !newRequest.requested_amount || newRequest.purpose.length < 10}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : '요청 생성'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 상세 보기 모달 */}
      {showDetailModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold">포인트 요청 상세 정보</h3>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedRequest(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">요청자</div>
                  <div className="font-medium">{selectedRequest.requester_name}</div>
                  <div className="text-sm text-gray-500">@{selectedRequest.requester_username}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {selectedRequest.requester_role === 'distributor' && '총판'}
                    {selectedRequest.requester_role === 'admin' && '관리자'}
                    {selectedRequest.requester_role === 'developer' && '개발자'}
                  </div>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">요청 포인트</div>
                  <div className="text-xl font-bold text-blue-600">
                    {formatAmount(selectedRequest.requested_amount)} P
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">요청 목적</div>
                <div className="text-sm">{selectedRequest.purpose}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">상태</div>
                  <div>{getStatusBadge(selectedRequest.status)}</div>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">요청일시</div>
                  <div className="text-sm">{formatDate(selectedRequest.created_at)}</div>
                </div>
              </div>

              {selectedRequest.reviewed_at && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">검토 정보</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-xs text-gray-500 mb-1">검토자</div>
                      <div className="font-medium">{selectedRequest.reviewer_name || '-'}</div>
                      {selectedRequest.reviewer_username && (
                        <div className="text-sm text-gray-500">@{selectedRequest.reviewer_username}</div>
                      )}
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-xs text-gray-500 mb-1">검토일시</div>
                      <div className="text-sm">{formatDate(selectedRequest.reviewed_at)}</div>
                    </div>
                  </div>

                  {selectedRequest.review_notes && (
                    <div className="bg-gray-50 p-3 rounded-lg mt-3">
                      <div className="text-xs text-gray-500 mb-1">검토 의견</div>
                      <div className="text-sm">{selectedRequest.review_notes}</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              {canReviewRequest && selectedRequest.status === 'pending' && (
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setShowReviewModal(true);
                  }}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  검토하기
                </button>
              )}
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedRequest(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 요청 검토 모달 */}
      {showReviewModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">포인트 요청 검토</h3>

            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm text-gray-600">요청자: {selectedRequest.requester_name}</div>
                <div className="text-sm text-gray-600">요청 포인트: {formatAmount(selectedRequest.requested_amount)} P</div>
                <div className="text-sm text-gray-600 mt-2">목적:</div>
                <div className="text-sm text-gray-900">{selectedRequest.purpose}</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">검토 결과</label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="approved"
                      checked={reviewForm.status === 'approved'}
                      onChange={(e) => setReviewForm(prev => ({ ...prev, status: e.target.value as 'approved' | 'rejected' }))}
                      className="mr-2"
                    />
                    승인
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="rejected"
                      checked={reviewForm.status === 'rejected'}
                      onChange={(e) => setReviewForm(prev => ({ ...prev, status: e.target.value as 'approved' | 'rejected' }))}
                      className="mr-2"
                    />
                    반려
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">검토 의견 (선택사항)</label>
                <textarea
                  value={reviewForm.review_notes}
                  onChange={(e) => setReviewForm(prev => ({ ...prev, review_notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="검토 의견을 입력하세요"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowReviewModal(false);
                  setSelectedRequest(null);
                  setReviewForm({ status: 'approved', review_notes: '' });
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={reviewRequest}
                disabled={submitting}
                className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors ${
                  reviewForm.status === 'approved'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                } disabled:bg-gray-300 disabled:cursor-not-allowed`}
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                ) : (
                  reviewForm.status === 'approved' ? '승인' : '반려'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}