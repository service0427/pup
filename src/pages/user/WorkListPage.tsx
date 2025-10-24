import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Edit3,
  MapPin,
  Search,
  AlertCircle
} from 'lucide-react';

interface WorkRequest {
  id: number;
  type: 'receipt_review' | 'blog_post';
  title: string;
  description: string;
  keywords: string[];
  guidelines: string;
  point_value: number;
  receipt?: {
    id: number;
    business_name: string;
    address: string;
    image_url: string;
  };
}

export function WorkListPage() {
  const [works, setWorks] = useState<WorkRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<'all' | 'receipt_review' | 'blog_post'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [claiming, setClaiming] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAvailableWorks();
  }, [selectedType]);

  const fetchAvailableWorks = async () => {
    try {
      setLoading(true);
      const authData = localStorage.getItem('adr_auth');
      const { token } = authData ? JSON.parse(authData) : {};

      const params = new URLSearchParams();
      if (selectedType !== 'all') {
        params.append('type', selectedType);
      }

      const response = await fetch(`http://localhost:3001/api/works/available?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch works');
      }

      const data = await response.json();
      if (data.success) {
        setWorks(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch works:', error);
      // 테스트 데이터
      setWorks([
        {
          id: 1,
          type: 'receipt_review',
          title: '스타벅스 강남점',
          description: '커피 전문점 리뷰 작성',
          keywords: ['스타벅스', '강남', '커피', '카페'],
          guidelines: '매장 분위기와 음료 맛을 중심으로 작성해주세요.',
          point_value: 500,
          receipt: {
            id: 1,
            business_name: '스타벅스 강남점',
            address: '서울시 강남구 테헤란로 123',
            image_url: '/placeholder-receipt.jpg'
          }
        },
        {
          id: 2,
          type: 'blog_post',
          title: '여름 휴가지 추천 BEST 5',
          description: '국내 여름 휴가지 추천 포스팅',
          keywords: ['여름휴가', '국내여행', '휴가지추천'],
          guidelines: '각 장소의 특징과 추천 이유를 상세히 작성해주세요.',
          point_value: 1000
        },
        {
          id: 3,
          type: 'receipt_review',
          title: '김밥천국 서초점',
          description: '분식점 리뷰 작성',
          keywords: ['김밥천국', '서초', '분식', '김밥'],
          guidelines: '메뉴의 맛과 가격대를 중심으로 작성해주세요.',
          point_value: 400,
          receipt: {
            id: 2,
            business_name: '김밥천국 서초점',
            address: '서울시 서초구 서초대로 456',
            image_url: '/placeholder-receipt.jpg'
          }
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimWork = async (workId: number) => {
    try {
      setClaiming(workId);
      const authData = localStorage.getItem('adr_auth');
      const { token } = authData ? JSON.parse(authData) : {};

      const response = await fetch(`http://localhost:3001/api/works/${workId}/claim`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        // 성공 - 작성 페이지로 이동
        navigate(`/user/write/${workId}`);
      } else {
        // 실패 알림
        alert(data.message || '이미 다른 사용자가 선택했습니다.');
        // 목록 새로고침
        fetchAvailableWorks();
      }
    } catch (error) {
      console.error('Failed to claim work:', error);
      alert('작업 선택 중 오류가 발생했습니다.');
    } finally {
      setClaiming(null);
    }
  };

  const filteredWorks = works.filter(work => {
    if (searchTerm && !work.title.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="p-6">
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">작업 선택</h1>
        <p className="mt-1 text-gray-600">
          선택 가능한 작업 목록입니다. 한 번에 하나의 작업만 진행할 수 있습니다.
        </p>
      </div>

      {/* 필터 바 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* 타입 필터 */}
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedType('all')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                selectedType === 'all'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              전체
            </button>
            <button
              onClick={() => setSelectedType('receipt_review')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                selectedType === 'receipt_review'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FileText className="w-4 h-4 inline mr-1" />
              영수증 리뷰
            </button>
            <button
              onClick={() => setSelectedType('blog_post')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                selectedType === 'blog_post'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Edit3 className="w-4 h-4 inline mr-1" />
              블로그 포스팅
            </button>
          </div>

          {/* 검색 */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="제목으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>
      </div>

      {/* 작업 목록 */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          <p className="mt-4 text-gray-600">작업 목록을 불러오는 중...</p>
        </div>
      ) : filteredWorks.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">선택 가능한 작업이 없습니다.</p>
          <p className="text-sm text-gray-500 mt-2">잠시 후 다시 확인해주세요.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWorks.map((work) => (
            <div
              key={work.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition"
            >
              {/* 작업 타입 헤더 */}
              <div className={`px-4 py-2 ${
                work.type === 'receipt_review' ? 'bg-blue-50' : 'bg-purple-50'
              }`}>
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${
                    work.type === 'receipt_review' ? 'text-blue-700' : 'text-purple-700'
                  }`}>
                    {work.type === 'receipt_review' ? '🧾 영수증 리뷰' : '✍️ 블로그 포스팅'}
                  </span>
                  <span className="text-lg font-bold text-green-600">
                    {work.point_value}P
                  </span>
                </div>
              </div>

              {/* 작업 내용 */}
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {work.title}
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  {work.description}
                </p>

                {/* 영수증 정보 */}
                {work.receipt && (
                  <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center text-sm text-gray-600 mb-1">
                      <MapPin className="w-4 h-4 mr-1" />
                      {work.receipt.address}
                    </div>
                  </div>
                )}

                {/* 키워드 */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {work.keywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                    >
                      #{keyword}
                    </span>
                  ))}
                </div>

                {/* 가이드라인 */}
                <div className="text-xs text-gray-500 mb-4">
                  <p className="line-clamp-2">{work.guidelines}</p>
                </div>

                {/* 선택 버튼 */}
                <button
                  onClick={() => handleClaimWork(work.id)}
                  disabled={claiming === work.id}
                  className={`w-full py-2 rounded-lg font-medium transition ${
                    claiming === work.id
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {claiming === work.id ? (
                    <>
                      <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      선택 중...
                    </>
                  ) : (
                    '이 작업 선택하기'
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 안내 메시지 */}
      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">작업 선택 안내</h3>
            <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside space-y-1">
              <li>한 번에 하나의 작업만 진행할 수 있습니다.</li>
              <li>선택 후 24시간 이내에 완료해야 합니다.</li>
              <li>시간 초과 시 자동으로 취소되며 다른 사용자가 선택할 수 있게 됩니다.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}