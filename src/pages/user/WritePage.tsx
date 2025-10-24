import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  Edit3,
  Link,
  Clock,
  AlertCircle,
  CheckCircle,
  Image,
  MapPin,
  Calendar,
  Hash
} from 'lucide-react';

interface WorkDetail {
  id: number;
  type: 'receipt_review' | 'blog_post';
  title: string;
  description: string;
  keywords: string[];
  guidelines: string;
  point_value: number;
  expires_at: string;
  receipt?: {
    id: number;
    business_name: string;
    address: string;
    date: string;
    amount: number;
    image_url: string;
    main_keyword: string;
    sub_keywords: string[];
  };
}

export function WritePage() {
  const { workId } = useParams();
  const navigate = useNavigate();
  const [work, setWork] = useState<WorkDetail | null>(null);
  const [reviewUrl, setReviewUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    if (workId) {
      fetchWorkDetail(parseInt(workId));
    }
    const interval = setInterval(updateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [workId]);

  const fetchWorkDetail = async (id: number) => {
    try {
      setLoading(true);
      const authData = localStorage.getItem('adr_auth');
      const { token } = authData ? JSON.parse(authData) : {};

      const response = await fetch(`http://localhost:3001/api/works/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch work detail');
      }

      const data = await response.json();
      if (data.success) {
        setWork(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch work detail:', error);
      // 테스트 데이터
      setWork({
        id: 1,
        type: 'receipt_review',
        title: '스타벅스 강남점',
        description: '커피 전문점 리뷰 작성',
        keywords: ['스타벅스', '강남', '커피', '카페'],
        guidelines: '매장 분위기와 음료 맛을 중심으로 작성해주세요. 최소 300자 이상 작성하고, 사진을 3장 이상 포함해주세요.',
        point_value: 500,
        expires_at: new Date(Date.now() + 22 * 60 * 60 * 1000).toISOString(),
        receipt: {
          id: 1,
          business_name: '스타벅스 강남점',
          address: '서울시 강남구 테헤란로 123',
          date: '2024-01-20',
          amount: 8500,
          image_url: '/api/placeholder/400/600',
          main_keyword: '스타벅스',
          sub_keywords: ['아메리카노', '카페라떼', '디저트']
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const updateTimeLeft = () => {
    if (work?.expires_at) {
      const now = new Date().getTime();
      const expires = new Date(work.expires_at).getTime();
      const diff = expires - now;

      if (diff > 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeLeft(`${hours}시간 ${minutes}분`);
      } else {
        setTimeLeft('만료됨');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reviewUrl.trim()) {
      alert('블로그 URL을 입력해주세요.');
      return;
    }

    if (!reviewUrl.includes('blog.naver.com') && !reviewUrl.includes('tistory.com')) {
      alert('네이버 블로그 또는 티스토리 URL을 입력해주세요.');
      return;
    }

    setSubmitting(true);

    try {
      const authData = localStorage.getItem('adr_auth');
      const { token } = authData ? JSON.parse(authData) : {};

      const response = await fetch(`http://localhost:3001/api/works/${workId}/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          review_url: reviewUrl,
          notes: notes
        })
      });

      const data = await response.json();

      if (data.success) {
        alert('작성이 완료되었습니다!');
        navigate('/user/my-works');
      } else {
        alert(data.message || '제출 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('Failed to submit work:', error);
      alert('제출 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        <p className="mt-4 text-gray-600">작업 정보를 불러오는 중...</p>
      </div>
    );
  }

  if (!work) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-600">작업을 찾을 수 없습니다.</p>
        <button
          onClick={() => navigate('/user/my-works')}
          className="mt-4 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
        >
          내 작업으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* 헤더 */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/user/my-works')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          내 작업으로 돌아가기
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{work.title}</h1>
            <p className="mt-1 text-gray-600">{work.description}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-green-600">{work.point_value}P</p>
            <div className="flex items-center text-sm text-yellow-600 mt-1">
              <Clock className="w-4 h-4 mr-1" />
              남은 시간: {timeLeft}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 왼쪽: 작업 정보 */}
        <div className="space-y-6">
          {/* 작업 타입 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              {work.type === 'receipt_review' ? (
                <>
                  <FileText className="w-5 h-5 text-blue-600 mr-2" />
                  <span className="font-semibold text-blue-600">영수증 리뷰</span>
                </>
              ) : (
                <>
                  <Edit3 className="w-5 h-5 text-purple-600 mr-2" />
                  <span className="font-semibold text-purple-600">블로그 포스팅</span>
                </>
              )}
            </div>

            {/* 영수증 정보 */}
            {work.receipt && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">영수증 정보</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div className="flex items-center text-sm">
                      <MapPin className="w-4 h-4 text-gray-500 mr-2" />
                      <span>{work.receipt.address}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Calendar className="w-4 h-4 text-gray-500 mr-2" />
                      <span>{work.receipt.date}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <span className="font-medium">결제 금액: {work.receipt.amount.toLocaleString()}원</span>
                    </div>
                  </div>
                </div>

                {/* 영수증 이미지 */}
                <div>
                  <h3 className="font-semibold mb-2">영수증 이미지</h3>
                  <div className="bg-gray-100 rounded-lg p-4 text-center">
                    <Image className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">영수증 이미지</p>
                    <button className="mt-2 text-blue-600 hover:underline text-sm">
                      이미지 크게 보기
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 키워드 */}
            <div>
              <h3 className="font-semibold mb-2">필수 키워드</h3>
              <div className="flex flex-wrap gap-2">
                {work.keywords.map((keyword, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm flex items-center"
                  >
                    <Hash className="w-3 h-3 mr-1" />
                    {keyword}
                  </span>
                ))}
              </div>
            </div>

            {/* 작성 가이드라인 */}
            <div>
              <h3 className="font-semibold mb-2">작성 가이드라인</h3>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">{work.guidelines}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 오른쪽: 제출 폼 */}
        <div>
          <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">작성 완료 제출</h2>

            {/* URL 입력 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                블로그 URL <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="url"
                  value={reviewUrl}
                  onChange={(e) => setReviewUrl(e.target.value)}
                  placeholder="https://blog.naver.com/..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                네이버 블로그 또는 티스토리 URL을 입력해주세요.
              </p>
            </div>

            {/* 메모 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                메모 (선택)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="작성 시 특이사항이나 메모를 입력해주세요."
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* 체크리스트 */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium mb-3">제출 전 확인사항</h3>
              <div className="space-y-2">
                <label className="flex items-start">
                  <input type="checkbox" className="mt-1 mr-2" />
                  <span className="text-sm text-gray-700">
                    필수 키워드를 모두 포함했습니다.
                  </span>
                </label>
                <label className="flex items-start">
                  <input type="checkbox" className="mt-1 mr-2" />
                  <span className="text-sm text-gray-700">
                    가이드라인에 맞게 작성했습니다.
                  </span>
                </label>
                {work.type === 'receipt_review' && (
                  <label className="flex items-start">
                    <input type="checkbox" className="mt-1 mr-2" />
                    <span className="text-sm text-gray-700">
                      영수증 정보와 일치하는 내용을 작성했습니다.
                    </span>
                  </label>
                )}
              </div>
            </div>

            {/* 제출 버튼 */}
            <button
              type="submit"
              disabled={submitting}
              className={`w-full py-3 rounded-lg font-medium transition ${
                submitting
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {submitting ? (
                <>
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  제출 중...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 inline mr-2" />
                  작성 완료 제출
                </>
              )}
            </button>
          </form>

          {/* 주의사항 */}
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">주의사항</h3>
                <ul className="mt-2 text-sm text-red-700 list-disc list-inside space-y-1">
                  <li>제출 후에는 수정이 불가능합니다.</li>
                  <li>허위 작성 시 포인트가 지급되지 않습니다.</li>
                  <li>시간 초과 시 자동으로 작업이 취소됩니다.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}