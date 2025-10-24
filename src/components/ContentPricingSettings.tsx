import { useState, useEffect } from 'react';
import { Save, DollarSign, FileText, Edit, Loader2, TrendingUp } from 'lucide-react';

interface ContentPricing {
  id: number;
  content_type: string;
  price: number;
  description: string;
  is_active: boolean;
}

export function ContentPricingSettings() {
  const [pricing, setPricing] = useState<ContentPricing[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ price: 0, description: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPricing();
  }, []);

  const fetchPricing = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/api/content-pricing');
      const data = await response.json();

      if (data.success) {
        setPricing(data.data.pricing);
      }
    } catch (error) {
      console.error('가격 정보 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (item: ContentPricing) => {
    setEditingId(item.id);
    setEditForm({
      price: item.price,
      description: item.description
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ price: 0, description: '' });
  };

  const saveEdit = async (id: number) => {
    try {
      setSaving(true);
      const authData = localStorage.getItem('adr_auth');
      const { token } = authData ? JSON.parse(authData) : {};

      const response = await fetch(`http://localhost:3001/api/content-pricing/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      });

      const data = await response.json();

      if (data.success) {
        setPricing(prev => prev.map(item =>
          item.id === id ? { ...item, ...editForm } : item
        ));
        setEditingId(null);
        alert('가격이 성공적으로 수정되었습니다.');
      } else {
        alert(data.message || '가격 수정에 실패했습니다.');
      }
    } catch (error) {
      console.error('가격 수정 실패:', error);
      alert('가격 수정 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const getContentTypeDisplay = (type: string) => {
    switch (type) {
      case 'receipt_review':
        return { name: '영수증 리뷰', icon: FileText, color: 'text-blue-600 bg-blue-100' };
      case 'blog_content':
        return { name: '블로그 컨텐츠', icon: Edit, color: 'text-green-600 bg-green-100' };
      case 'traffic':
        return { name: '트래픽 (조회수)', icon: TrendingUp, color: 'text-purple-600 bg-purple-100' };
      default:
        return { name: type, icon: DollarSign, color: 'text-gray-600 bg-gray-100' };
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">컨텐츠 가격 설정</h3>
        <p className="text-sm text-gray-600 mt-1">각 컨텐츠 유형별 포인트 가격을 설정할 수 있습니다.</p>
      </div>

      <div className="p-6">
        <div className="space-y-4">
          {pricing.map((item) => {
            const display = getContentTypeDisplay(item.content_type);
            const Icon = display.icon;
            const isEditing = editingId === item.id;

            return (
              <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${display.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{display.name}</h4>
                      {!isEditing && (
                        <p className="text-sm text-gray-500">{item.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {!isEditing ? (
                      <>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900">
                            {formatPrice(item.price)}P
                          </div>
                        </div>
                        <button
                          onClick={() => startEdit(item)}
                          className="px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          수정
                        </button>
                      </>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={editForm.price}
                              onChange={(e) => setEditForm(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                              className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              min="0"
                            />
                            <span className="text-sm text-gray-500">P</span>
                          </div>
                          <input
                            type="text"
                            value={editForm.description}
                            onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                            className="w-48 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="설명"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => saveEdit(item.id)}
                            disabled={saving}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                          >
                            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                            저장
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            취소
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 text-amber-600 mt-0.5">💡</div>
            <div className="text-sm text-amber-800">
              <p className="font-medium">가격 변경 안내</p>
              <ul className="mt-1 space-y-1 text-xs">
                <li>• 가격 변경은 즉시 적용됩니다.</li>
                <li>• 진행 중인 주문은 기존 가격으로 처리됩니다.</li>
                <li>• 변경 내역은 시스템에 자동으로 기록됩니다.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}