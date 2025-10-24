import { useState } from 'react';
import { X } from 'lucide-react';

interface DayHours {
  day: string;
  startTime: string;
  endTime: string;
  isClosed: boolean;
}

interface HoursModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiptId: number | null;
}

export function HoursModal({ isOpen, onClose, receiptId }: HoursModalProps) {
  const [hours, setHours] = useState<DayHours[]>([
    { day: '일', startTime: '15:00', endTime: '07:00', isClosed: false },
    { day: '월', startTime: '15:00', endTime: '07:00', isClosed: false },
    { day: '화', startTime: '15:00', endTime: '07:00', isClosed: false },
    { day: '수', startTime: '15:00', endTime: '07:00', isClosed: false },
    { day: '목', startTime: '15:00', endTime: '07:00', isClosed: false },
    { day: '금', startTime: '15:00', endTime: '08:00', isClosed: false },
    { day: '토', startTime: '15:00', endTime: '08:00', isClosed: false }
  ]);
  const [holidayClosed, setHolidayClosed] = useState(false);

  const updateHours = (index: number, field: 'startTime' | 'endTime', value: string) => {
    const updated = [...hours];
    updated[index][field] = value;
    setHours(updated);
  };

  const toggleClosed = (index: number) => {
    const updated = [...hours];
    updated[index].isClosed = !updated[index].isClosed;
    // 휴무일이면 시간 초기화
    if (updated[index].isClosed) {
      updated[index].startTime = '';
      updated[index].endTime = '';
    } else {
      // 휴무 해제시 기본 시간 설정
      updated[index].startTime = '09:00';
      updated[index].endTime = '18:00';
    }
    setHours(updated);
  };

  const handleSave = () => {
    // TODO: API 호출로 영업시간 저장
    console.log('Saving hours:', hours);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose}></div>

        <div className="relative bg-white rounded-lg max-w-3xl w-full p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">영업시간 등록/수정</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 영업시간 테이블 */}
          <div className="mb-4">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">요일</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">휴무</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">시작시간</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">마감시간</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {hours.map((hour, index) => {
                  const isWeekend = hour.day === '토' || hour.day === '일';
                  return (
                  <tr key={index}>
                    <td className={`px-4 py-3 text-sm font-medium ${isWeekend ? 'text-red-600' : ''}`}>
                      {hour.day}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={hour.isClosed}
                        onChange={() => toggleClosed(index)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      {hour.isClosed ? (
                        <span className="text-gray-400 text-sm">휴무</span>
                      ) : (
                        <input
                          type="time"
                          value={hour.startTime}
                          onChange={(e) => updateHours(index, 'startTime', e.target.value)}
                          className="px-3 py-1 border border-gray-300 rounded"
                        />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {hour.isClosed ? (
                        <span className="text-gray-400 text-sm">휴무</span>
                      ) : (
                        <input
                          type="time"
                          value={hour.endTime}
                          onChange={(e) => updateHours(index, 'endTime', e.target.value)}
                          className="px-3 py-1 border border-gray-300 rounded"
                        />
                      )}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 공휴일 휴무 설정 */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={holidayClosed}
                onChange={(e) => setHolidayClosed(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">공휴일 휴무</span>
            </label>
          </div>

          <div className="text-sm text-gray-600 mb-4">
            * 24시간 영업인 경우 시작시간 00:00, 마감시간 23:59로 설정하세요.
          </div>

          {/* 버튼 */}
          <div className="flex justify-center gap-2">
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              저장
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