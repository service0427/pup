import { useState, useRef } from 'react';
import { X, Upload, Eye } from 'lucide-react';

interface Point {
  id?: number;
  content: string;
  createdAt: string;
  imageUrl?: string;
}

interface PointsModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiptId?: number | null;
}

export function PointsModal({ isOpen, onClose }: PointsModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<{ id?: number, file?: File, url?: string } | null>(null);
  const [newPointContent, setNewPointContent] = useState('');
  const [points, setPoints] = useState<Point[]>([
    {
      id: 1,
      content: '시골벅적한 곳 좋아하는 편인데 여긴 떡이네요. 음식 퀄리티도 기대 이상이고, 직원분들 빠르게 챙겨줘서 편했습니다. 방이동에서 찾은 보물 같은 술집이에요.',
      createdAt: '보기',
      imageUrl: undefined
    },
    {
      id: 2,
      content: '진짜 옷다 보니 시간 순삭! 술자리 분위기 이렇게 신나는데는 드물어요. 매뉴도 다 맛있고 부담 없는 가격이라 자주 올 듯요~',
      createdAt: '보기'
    },
    {
      id: 3,
      content: '팀원들이랑 갈이 갔는데 다들 홀이 나서 웃음소리 끊이질 않았네요. 음식도 푸짐하고 술컵 분위기가 확실히 신나는 데라서 좋았습니다.',
      createdAt: '보기'
    },
    {
      id: 4,
      content: '친구들이랑 첫 술집 가본 긴데 분위기 펄어요 다들 떠들어도 어색하지 않고 재미있었음. 안주도 맛있고 가격도 괜찮아서 자주 올 듯!',
      createdAt: '보기'
    },
    {
      id: 5,
      content: '처음에는 너무 시끄럽지 않을까 걱정했는데, 막상 들어가 보니 오히려 편하고 즐거운 분위기였어요. 직원 응대도 친절하고 전체적으로 만족했습니다.',
      createdAt: '보기'
    }
  ]);
  const [searchTerm, setSearchTerm] = useState('');

  const deletePoint = (id?: number) => {
    if (id) {
      setPoints(points.filter(p => p.id !== id));
    }
  };

  const handleImageUpload = (pointId?: number) => {
    setSelectedImage({ id: pointId });
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && selectedImage) {
      const url = URL.createObjectURL(file);

      if (selectedImage.id) {
        // 기존 포인트에 이미지 추가
        setPoints(points.map(p =>
          p.id === selectedImage.id
            ? { ...p, imageUrl: url }
            : p
        ));
      }
      setSelectedImage(null);
    }
    event.target.value = ''; // 파일 입력 초기화
  };

  const addNewPoint = () => {
    if (newPointContent.trim()) {
      const newPoint: Point = {
        id: Date.now(), // 임시 ID
        content: newPointContent,
        createdAt: '보기',
        imageUrl: undefined
      };
      setPoints([...points, newPoint]);
      setNewPointContent('');
    }
  };

  const handleSave = () => {
    // TODO: API 호출로 소구점 저장
    console.log('Saving points:', points);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose}></div>

        <div className="relative bg-white rounded-lg max-w-5xl w-full p-6 max-h-[80vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">소구점 등록/수정</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 검색 */}
          <div className="mb-4 flex gap-4">
            <select className="px-3 py-2 border border-gray-300 rounded-lg">
              <option>10개씩 보기</option>
              <option>20개씩 보기</option>
              <option>50개씩 보기</option>
            </select>
            <div className="flex-1">
              <input
                type="text"
                placeholder="검색:"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* 소구점 테이블 */}
          <div className="flex-1 overflow-auto mb-4">
            <table className="min-w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">문구</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase" style={{ width: '100px' }}>사진</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase" style={{ width: '100px' }}>삭제</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {points.map((point) => (
                  <tr key={point.id}>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900 whitespace-pre-wrap">
                        {point.content}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      {point.imageUrl ? (
                        <button
                          onClick={() => window.open(point.imageUrl, '_blank')}
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                        >
                          <Eye className="w-4 h-4" />
                          보기
                        </button>
                      ) : (
                        <button
                          onClick={() => handleImageUpload(point.id)}
                          className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-800 text-sm"
                        >
                          <Upload className="w-4 h-4" />
                          업로드
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button
                        onClick={() => deletePoint(point.id)}
                        className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
                {points.length === 0 && (
                  <tr>
                    <td colSpan={3} className="text-center py-8 text-gray-500">
                      데이터가 없습니다
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* 새 소구점 추가 영역 */}
          <div className="border-t pt-4 mb-4">
            <div className="mb-2">
              <textarea
                value={newPointContent}
                onChange={(e) => setNewPointContent(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="새로운 소구점을 입력하세요..."
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={addNewPoint}
                disabled={!newPointContent.trim()}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                소구점 추가
              </button>
            </div>
          </div>

          {/* 숨겨진 파일 입력 */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* 버튼 */}
          <div className="flex justify-center gap-2">
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              등기
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}