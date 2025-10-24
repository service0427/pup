import { useState, useEffect } from 'react';
import {
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  DollarSign,
  User,
  MessageSquare,
  Filter,
  Search,
  Loader2,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface WorkReview {
  work_history_id: number;
  work_id: number;
  worker_id: number;
  status: string;
  completed_at: string;
  review_url: string;
  notes: string;
  points_earned: number;
  work_title: string;
  work_description: string;
  point_value: number;
  work_type: string;
  worker_username: string;
  worker_name: string;
  creator_username: string;
  creator_name: string;
  review_status: 'not_reviewed' | 'pending' | 'approved' | 'rejected';
  review_id: number | null;
  review_notes: string | null;
  points_to_award: number | null;
  reviewed_at: string | null;
  reviewer_name: string | null;
}

export function WorkReviewsPage() {
  const { user } = useAuth();
  const [pendingWorks, setPendingWorks] = useState<WorkReview[]>([]);
  const [completedWorks, setCompletedWorks] = useState<WorkReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedWork, setSelectedWork] = useState<WorkReview | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // 검토 폼
  const [reviewForm, setReviewForm] = useState({
    status: 'approved' as 'approved' | 'rejected',
    review_notes: '',
    points_to_award: ''
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (activeTab === 'pending') {
      fetchPendingWorks();
    } else {
      fetchCompletedWorks();
    }
  }, [activeTab]);

  const fetchPendingWorks = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/work-reviews/pending', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adr_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPendingWorks(data.data.works);
      }
    } catch (error) {
      console.error('검수 대기 목록 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompletedWorks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const response = await fetch(`/api/work-reviews/completed?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adr_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCompletedWorks(data.data);
      }
    } catch (error) {
      console.error('검수 완료 목록 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const reviewWork = async () => {
    if (!selectedWork) return;

    try {
      setSubmitting(true);
      const response = await fetch(`/api/work-reviews/${selectedWork.work_history_id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adr_token')}`
        },
        body: JSON.stringify({
          status: reviewForm.status,
          review_notes: reviewForm.review_notes || undefined,
          points_to_award: reviewForm.points_to_award ? parseInt(reviewForm.points_to_award) : undefined
        })
      });

      if (response.ok) {
        const result = await response.json();
        setShowReviewModal(false);
        setSelectedWork(null);
        setReviewForm({ status: 'approved', review_notes: '', points_to_award: '' });

        // 목록 새로고침
        if (activeTab === 'pending') {
          fetchPendingWorks();
        } else {
          fetchCompletedWorks();
        }

        alert(`${result.data.worker_name}님의 작업이 ${reviewForm.status === 'approved' ? '승인' : '반려'}되었습니다.`);
      } else {
        const error = await response.json();
        alert(error.message || '작업 검수에 실패했습니다.');
      }
    } catch (error) {
      console.error('작업 검수 실패:', error);
      alert('작업 검수 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      not_reviewed: { bg: 'bg-gray-100', text: 'text-gray-700', icon: Clock, label: '미검수' },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Clock, label: '검수중' },
      approved: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle, label: '승인' },
      rejected: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle, label: '반려' }
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

  const getWorkTypeBadge = (type: string) => {
    const badges = {
      receipt_review: { bg: 'bg-blue-100', text: 'text-blue-700', label: '영수증 리뷰' },
      blog_post: { bg: 'bg-purple-100', text: 'text-purple-700', label: '블로그 포스트' }
    };
    const badge = badges[type as keyof typeof badges] || { bg: 'bg-gray-100', text: 'text-gray-700', label: type };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${badge.bg} ${badge.text}`}>
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

  const currentWorks = activeTab === 'pending' ? pendingWorks : completedWorks;

  const filteredWorks = currentWorks.filter(work => {
    const matchesSearch =
      work.work_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      work.worker_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      work.worker_username.toLowerCase().includes(searchTerm.toLowerCase());

    if (activeTab === 'completed' && statusFilter !== 'all') {
      return matchesSearch && work.review_status === statusFilter;
    }

    return matchesSearch;
  });

  const canReview = ['admin', 'distributor', 'advertiser'].includes(user?.role || '');

  if (!canReview) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">접근 권한이 없습니다</h3>
          <p className="text-gray-500">작업 검수는 관리자, 총판, 광고주만 가능합니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">작업 검수</h1>
        <p className="text-gray-600">작성자가 완료한 작업을 검수하고 승인/반려할 수 있습니다.</p>
      </div>

      {/* 탭 */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('pending')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'pending'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              검수 대기
              {pendingWorks.length > 0 && (
                <span className="ml-2 bg-blue-100 text-blue-600 py-0.5 px-2 rounded-full text-xs">
                  {pendingWorks.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'completed'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              검수 완료
            </button>
          </nav>
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
                placeholder="작업 제목이나 작성자명으로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
              />
            </div>

            {/* 상태 필터 (완료 탭에서만) */}
            {activeTab === 'completed' && (
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                >
                  <option value="all">전체 상태</option>
                  <option value="approved">승인</option>
                  <option value="rejected">반려</option>
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 작업 목록 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : filteredWorks.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {activeTab === 'pending' ? '검수 대기 중인 작업이 없습니다' : '검수 완료된 작업이 없습니다'}
            </h3>
            <p className="text-gray-500">
              {activeTab === 'pending' ? '작성자들이 작업을 완료하면 여기에 표시됩니다.' : '아직 검수 완료된 작업이 없습니다.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">작업 정보</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">작성자</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">포인트</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">완료일</th>
                  {activeTab === 'completed' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">검수일</th>
                  )}
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredWorks.map((work) => (
                  <tr key={work.work_history_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-medium text-gray-900">{work.work_title}</h3>
                          {getWorkTypeBadge(work.work_type)}
                        </div>
                        <p className="text-xs text-gray-500 max-w-xs truncate" title={work.work_description}>
                          {work.work_description}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="w-4 h-4 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{work.worker_name}</div>
                          <div className="text-sm text-gray-500">@{work.worker_username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <DollarSign className="w-4 h-4 text-gray-400 mr-1" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {formatAmount(work.point_value)} P
                          </div>
                          {activeTab === 'completed' && work.points_to_award !== work.point_value && (
                            <div className="text-xs text-orange-600">
                              실제: {formatAmount(work.points_to_award || 0)} P
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(work.review_status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(work.completed_at)}
                    </td>
                    {activeTab === 'completed' && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {work.reviewed_at ? formatDate(work.reviewed_at) : '-'}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedWork(work);
                            setShowDetailModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="상세 보기"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {work.review_url && (
                          <a
                            href={work.review_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-600 hover:text-green-900"
                            title="결과물 보기"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                        {activeTab === 'pending' && work.review_status === 'not_reviewed' && (
                          <button
                            onClick={() => {
                              setSelectedWork(work);
                              setReviewForm({
                                status: 'approved',
                                review_notes: '',
                                points_to_award: work.point_value.toString()
                              });
                              setShowReviewModal(true);
                            }}
                            className="text-orange-600 hover:text-orange-900"
                            title="검수하기"
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

      {/* 작업 검수 모달 */}
      {showReviewModal && selectedWork && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">작업 검수</h3>

            <div className="space-y-4">
              {/* 작업 정보 */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">{selectedWork.work_title}</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>작성자: {selectedWork.worker_name} (@{selectedWork.worker_username})</div>
                  <div>완료일: {formatDate(selectedWork.completed_at)}</div>
                  <div>예정 포인트: {formatAmount(selectedWork.point_value)} P</div>
                  {selectedWork.review_url && (
                    <div>
                      결과물: <a href={selectedWork.review_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        링크 보기 <ExternalLink className="w-3 h-3 inline ml-1" />
                      </a>
                    </div>
                  )}
                  {selectedWork.notes && (
                    <div className="mt-2">
                      <div className="font-medium">작성자 메모:</div>
                      <div className="bg-white p-2 rounded border text-sm">{selectedWork.notes}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* 검수 폼 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">검수 결과</label>
                <div className="flex gap-4 mb-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="approved"
                      checked={reviewForm.status === 'approved'}
                      onChange={(e) => setReviewForm(prev => ({ ...prev, status: e.target.value as 'approved' | 'rejected' }))}
                      className="mr-2"
                    />
                    <CheckCircle className="w-4 h-4 text-green-600 mr-1" />
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
                    <XCircle className="w-4 h-4 text-red-600 mr-1" />
                    반려
                  </label>
                </div>

                {/* 포인트 조정 (승인 시만) */}
                {reviewForm.status === 'approved' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">지급 포인트</label>
                    <input
                      type="number"
                      value={reviewForm.points_to_award}
                      onChange={(e) => setReviewForm(prev => ({ ...prev, points_to_award: e.target.value }))}
                      className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                      max={selectedWork.point_value}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      기본값: {formatAmount(selectedWork.point_value)} P (조정 가능)
                    </p>
                  </div>
                )}

                {/* 검수 의견 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    검수 의견 {reviewForm.status === 'rejected' && <span className="text-red-500">(반려 시 필수)</span>}
                  </label>
                  <textarea
                    value={reviewForm.review_notes}
                    onChange={(e) => setReviewForm(prev => ({ ...prev, review_notes: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="검수 의견을 입력하세요"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowReviewModal(false);
                  setSelectedWork(null);
                  setReviewForm({ status: 'approved', review_notes: '', points_to_award: '' });
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={reviewWork}
                disabled={submitting || (reviewForm.status === 'rejected' && !reviewForm.review_notes.trim())}
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

      {/* 상세 보기 모달 */}
      {showDetailModal && selectedWork && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">작업 상세 정보</h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">작업 제목</label>
                  <div className="text-sm text-gray-900">{selectedWork.work_title}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">작업 유형</label>
                  <div>{getWorkTypeBadge(selectedWork.work_type)}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">작성자</label>
                  <div className="text-sm text-gray-900">{selectedWork.worker_name} (@{selectedWork.worker_username})</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">포인트</label>
                  <div className="text-sm text-gray-900">{formatAmount(selectedWork.point_value)} P</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">완료일</label>
                  <div className="text-sm text-gray-900">{formatDate(selectedWork.completed_at)}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
                  <div>{getStatusBadge(selectedWork.review_status)}</div>
                </div>
              </div>

              {selectedWork.work_description && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">작업 설명</label>
                  <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedWork.work_description}</div>
                </div>
              )}

              {selectedWork.review_url && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">결과물</label>
                  <a
                    href={selectedWork.review_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-blue-600 hover:text-blue-900"
                  >
                    링크 보기 <ExternalLink className="w-4 h-4 ml-1" />
                  </a>
                </div>
              )}

              {selectedWork.notes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">작성자 메모</label>
                  <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedWork.notes}</div>
                </div>
              )}

              {selectedWork.review_status !== 'not_reviewed' && (
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-2">검수 정보</h4>
                  <div className="space-y-2">
                    {selectedWork.reviewer_name && (
                      <div className="text-sm">
                        <span className="font-medium">검수자:</span> {selectedWork.reviewer_name}
                      </div>
                    )}
                    {selectedWork.reviewed_at && (
                      <div className="text-sm">
                        <span className="font-medium">검수일:</span> {formatDate(selectedWork.reviewed_at)}
                      </div>
                    )}
                    {selectedWork.points_to_award !== null && (
                      <div className="text-sm">
                        <span className="font-medium">지급 포인트:</span> {formatAmount(selectedWork.points_to_award)} P
                      </div>
                    )}
                    {selectedWork.review_notes && (
                      <div>
                        <div className="text-sm font-medium mb-1">검수 의견:</div>
                        <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedWork.review_notes}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedWork(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}