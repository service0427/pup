import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  CheckCircle,
  AlertTriangle,
  FileText,
  Edit3,
  ArrowRight,
  Calendar,
  TrendingUp
} from 'lucide-react';

interface MyWork {
  id: number;
  type: 'receipt_review' | 'blog_post';
  title: string;
  description: string;
  point_value: number;
  status: 'in_progress' | 'completed' | 'expired' | 'cancelled';
  assigned_at: string;
  expires_at: string;
  completed_at?: string;
  review_url?: string;
}

interface WorkStats {
  today_count: number;
  week_count: number;
  total_points: number;
  daily_limit: number;
  weekly_limit: number;
}

export function MyWorksPage() {
  const [currentWork, setCurrentWork] = useState<MyWork | null>(null);
  const [completedWorks, setCompletedWorks] = useState<MyWork[]>([]);
  const [stats, setStats] = useState<WorkStats>({
    today_count: 0,
    week_count: 0,
    total_points: 0,
    daily_limit: 5,
    weekly_limit: 20
  });
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyWorks();
    const interval = setInterval(updateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchMyWorks = async () => {
    try {
      setLoading(true);
      const authData = localStorage.getItem('adr_auth');
      const { token } = authData ? JSON.parse(authData) : {};

      const response = await fetch('http://localhost:3001/api/works/my', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch my works');
      }

      const data = await response.json();
      if (data.success) {
        setCurrentWork(data.data.current || null);
        setCompletedWorks(data.data.completed || []);
        setStats(data.data.stats || stats);
      }
    } catch (error) {
      console.error('Failed to fetch my works:', error);
      // 테스트 데이터
      setCurrentWork({
        id: 1,
        type: 'receipt_review',
        title: '스타벅스 강남점',
        description: '커피 전문점 리뷰 작성',
        point_value: 500,
        status: 'in_progress',
        assigned_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        expires_at: new Date(Date.now() + 22 * 60 * 60 * 1000).toISOString()
      });

      setCompletedWorks([
        {
          id: 2,
          type: 'blog_post',
          title: '봄 나들이 추천 장소',
          description: '봄철 나들이 장소 추천 포스팅',
          point_value: 1000,
          status: 'completed',
          assigned_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          expires_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          completed_at: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000).toISOString(),
          review_url: 'https://blog.naver.com/example'
        }
      ]);

      setStats({
        today_count: 2,
        week_count: 8,
        total_points: 3500,
        daily_limit: 5,
        weekly_limit: 20
      });
    } finally {
      setLoading(false);
    }
  };

  const updateTimeLeft = () => {
    if (currentWork?.expires_at) {
      const now = new Date().getTime();
      const expires = new Date(currentWork.expires_at).getTime();
      const diff = expires - now;

      if (diff > 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${hours}시간 ${minutes}분 ${seconds}초`);
      } else {
        setTimeLeft('만료됨');
      }
    }
  };

  const handleAbandonWork = async () => {
    if (!currentWork) return;

    if (!confirm('정말로 이 작업을 포기하시겠습니까?')) return;

    try {
      const authData = localStorage.getItem('adr_auth');
      const { token } = authData ? JSON.parse(authData) : {};

      const response = await fetch(`http://localhost:3001/api/works/${currentWork.id}/abandon`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        alert('작업을 포기했습니다.');
        setCurrentWork(null);
        fetchMyWorks();
      }
    } catch (error) {
      console.error('Failed to abandon work:', error);
      alert('작업 포기 중 오류가 발생했습니다.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">완료</span>;
      case 'in_progress':
        return <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">진행중</span>;
      case 'expired':
        return <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full">만료</span>;
      case 'cancelled':
        return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">취소</span>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        <p className="mt-4 text-gray-600">내 작업을 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">내 작업</h1>
        <p className="mt-1 text-gray-600">진행 중인 작업과 완료한 작업을 확인하세요.</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">오늘 작성</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.today_count} / {stats.daily_limit}
              </p>
            </div>
            <Calendar className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">이번주 작성</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.week_count} / {stats.weekly_limit}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">누적 포인트</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.total_points.toLocaleString()}P
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">작업 가능</p>
              <p className="text-2xl font-bold text-gray-900">
                {currentWork ? '진행중' : '가능'}
              </p>
            </div>
            {currentWork ? (
              <AlertTriangle className="w-8 h-8 text-yellow-600" />
            ) : (
              <CheckCircle className="w-8 h-8 text-green-600" />
            )}
          </div>
        </div>
      </div>

      {/* 현재 진행 중인 작업 */}
      {currentWork && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4">진행 중인 작업</h2>
          <div className="bg-white rounded-lg border-2 border-blue-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {currentWork.type === 'receipt_review' ? (
                    <FileText className="w-5 h-5 text-blue-600" />
                  ) : (
                    <Edit3 className="w-5 h-5 text-purple-600" />
                  )}
                  <h3 className="text-lg font-semibold">{currentWork.title}</h3>
                  {getStatusBadge(currentWork.status)}
                </div>
                <p className="text-gray-600">{currentWork.description}</p>
                <p className="text-lg font-bold text-green-600 mt-2">{currentWork.point_value}P</p>
              </div>
            </div>

            {/* 남은 시간 */}
            <div className="bg-yellow-50 p-4 rounded-lg mb-4">
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-yellow-600 mr-2" />
                <span className="text-sm text-yellow-800">
                  남은 시간: <strong>{timeLeft}</strong>
                </span>
              </div>
            </div>

            {/* 액션 버튼 */}
            <div className="flex gap-3">
              <button
                onClick={() => navigate(`/user/write/${currentWork.id}`)}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium flex items-center justify-center"
              >
                작성하러 가기
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
              <button
                onClick={handleAbandonWork}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
              >
                작업 포기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 작업 선택 버튼 (진행중인 작업이 없을 때) */}
      {!currentWork && (
        <div className="mb-6 p-6 bg-green-50 border border-green-200 rounded-lg text-center">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
          <p className="text-green-800 mb-4">현재 진행 중인 작업이 없습니다.</p>
          <button
            onClick={() => navigate('/user/works')}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
          >
            새 작업 선택하기
          </button>
        </div>
      )}

      {/* 완료한 작업 목록 */}
      <div>
        <h2 className="text-lg font-semibold mb-4">완료한 작업</h2>
        {completedWorks.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <p className="text-gray-500">아직 완료한 작업이 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {completedWorks.map((work) => (
              <div key={work.id} className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {work.type === 'receipt_review' ? (
                        <FileText className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Edit3 className="w-4 h-4 text-purple-600" />
                      )}
                      <h3 className="font-medium">{work.title}</h3>
                      {getStatusBadge(work.status)}
                    </div>
                    <p className="text-sm text-gray-600">{work.description}</p>
                    {work.review_url && (
                      <a
                        href={work.review_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline mt-1 inline-block"
                      >
                        작성한 리뷰 보기 →
                      </a>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">{work.point_value}P</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {work.completed_at && new Date(work.completed_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}