import { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

interface MenuItem {
  name: string;
  price: string;
  description: string;
}

interface MenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiptId?: number | null;
}

export function MenuModal({ isOpen, onClose }: MenuModalProps) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([
    { name: '', price: '', description: '' }
  ]);
  const [searchTerm, setSearchTerm] = useState('');

  const addMenuItem = () => {
    setMenuItems([...menuItems, { name: '', price: '', description: '' }]);
  };

  const removeMenuItem = (index: number) => {
    setMenuItems(menuItems.filter((_, i) => i !== index));
  };

  const updateMenuItem = (index: number, field: keyof MenuItem, value: string) => {
    const updated = [...menuItems];
    updated[index][field] = value;
    setMenuItems(updated);
  };

  const handleSave = () => {
    // TODO: API 호출로 메뉴 저장
    console.log('Saving menu items:', menuItems);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose}></div>

        <div className="relative bg-white rounded-lg max-w-3xl w-full p-6 max-h-[80vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">메뉴 등록/수정</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 검색 */}
          <div className="mb-4 flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="검색:"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select className="px-3 py-2 border border-gray-300 rounded-lg">
              <option>10개씩 보기</option>
              <option>20개씩 보기</option>
              <option>50개씩 보기</option>
            </select>
          </div>

          {/* 메뉴 테이블 */}
          <div className="flex-1 overflow-auto mb-4">
            <table className="min-w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">메뉴명</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">금액</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">메뉴코드 (선택)</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">삭제</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {menuItems.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-gray-500">
                      데이터가 없습니다
                    </td>
                  </tr>
                ) : (
                  menuItems.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => updateMenuItem(index, 'name', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded"
                          placeholder="메뉴명을 입력해주세요."
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={item.price}
                          onChange={(e) => updateMenuItem(index, 'price', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded"
                          placeholder="금액을 입력해주세요."
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateMenuItem(index, 'description', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded"
                          placeholder="POS 코드 또는 관리번호 (선택)"
                        />
                      </td>
                      <td className="px-4 py-2 text-center">
                        <button
                          onClick={() => removeMenuItem(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
                <tr>
                  <td colSpan={4} className="px-4 py-2">
                    <button
                      onClick={addMenuItem}
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                    >
                      <Plus className="w-4 h-4" />
                      메뉴 추가
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 페이지네이션 */}
          <div className="text-sm text-gray-600 text-center mb-4">
            0개 중 0~0 표시
          </div>

          {/* 버튼 */}
          <div className="flex justify-center gap-2">
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              등록
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