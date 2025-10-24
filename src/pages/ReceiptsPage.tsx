import { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Search,
  Download,
  Trash2,
  Eye,
  Edit,
  AlertCircle,
  MoreVertical,
  Copy,
  Pause,
  Play
} from 'lucide-react';
// import { AdCreateModal } from '../components/AdCreateModal';
// import { AdEditModal } from '../components/AdEditModal';
// import { ReceiptReviewsModal } from '../components/ReceiptReviewsModal';
import { MenuModal } from '../components/MenuModal';
import { HoursModal } from '../components/HoursModal';
import { PointsModal } from '../components/PointsModal';

interface Receipt {
  id: number;
  account_id: string;
  business_name: string;
  place_url: string;
  place_type: string;
  phone?: string;
  address?: string;
  operation_hours?: string;
  description?: string;
  main_keyword?: string;
  sub_keywords?: string;
  image_style?: string;
  tone_manner?: string;
  additional_info?: string;
  place_id?: string;
  daily_limit: number;
  daily_issued: number;
  total_issued: number;
  total_limit?: number;
  remaining_ids: number;
  start_date: string | null;
  end_date: string | null;
  days_remaining: number | null;
  remark: string | null;
  status: string;
  review_count: number;
  created_at: string;
  updated_at?: string;
  tag_type?: string;
  keyword_only?: boolean;
  use_main_keyword?: boolean;
  use_brand_name?: boolean;
  blog_quantity?: number;
  is_reservation_available?: boolean;
  is_delivery_available?: boolean;
  menus?: any[];
  selling_points?: any[];
  image_generate?: boolean;
  place_image_generate?: boolean;
  experience?: string;
  menu_status?: string;
  hours_status?: string;
  intro_status?: string;
  print_status?: string;
}

export function ReceiptsPage() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [showHoursModal, setShowHoursModal] = useState(false);
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [currentReceiptId, setCurrentReceiptId] = useState<number | null>(null);
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchReceipts();
  }, [activeTab]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchReceipts = async () => {
    try {
      setLoading(true);
      const authData = localStorage.getItem('adr_auth');
      const { token } = authData ? JSON.parse(authData) : {};

      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (activeTab !== 'all') params.append('status', activeTab);

      const response = await fetch(`http://localhost:3001/api/receipts?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        const errorData = await response.json();
        if (errorData.message === '토큰이 만료되었습니다.') {
          localStorage.removeItem('adr_auth');
          window.location.href = '/admin/login';
          return;
        }
      }

      const data = await response.json();

      if (data.success) {
        setReceipts(data.data.receipts);
      }
    } catch (error) {
      console.error('Failed to fetch receipts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReceipts();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const authData = localStorage.getItem('adr_auth');
      const { token } = authData ? JSON.parse(authData) : {};

      const response = await fetch(`http://localhost:3001/api/receipts/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchReceipts();
      }
    } catch (error) {
      console.error('Failed to delete receipt:', error);
    }
  };

  const handleEdit = (receipt: Receipt) => {
    // setEditingReceipt(receipt);
    // setShowEditModal(true);
    console.log('Edit modal not implemented', receipt);
    setOpenDropdown(null);
  };

  /* Unused - modal commented out
  const handleEditSave = async (updatedReceipt: Partial<Receipt>) => {
    try {
      const authData = localStorage.getItem('adr_auth');
      const { token } = authData ? JSON.parse(authData) : {};

      const response = await fetch(`http://localhost:3001/api/receipts/${updatedReceipt.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedReceipt)
      });

      if (response.ok) {
        fetchReceipts();
        alert('광고가 수정되었습니다.');
      }
    } catch (error) {
      console.error('Failed to update receipt:', error);
      alert('광고 수정에 실패했습니다.');
    }
  };
  */

  const handleDuplicate = async (receipt: Receipt) => {
    try {
      const authData = localStorage.getItem('adr_auth');
      const { token } = authData ? JSON.parse(authData) : {};

      // 복제할 데이터 준비 (ID 제외)
      const { id, created_at, review_count, days_remaining, ...restReceipt } = receipt;
      const duplicateData = {
        ...restReceipt,
        business_name: `${receipt.business_name} (복사본)`,
        daily_issued: 0,
        total_issued: 0,
        status: 'pending'
      };

      const response = await fetch('http://localhost:3001/api/receipts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(duplicateData)
      });

      if (response.ok) {
        fetchReceipts();
        alert('광고가 복제되었습니다.');
      }
    } catch (error) {
      console.error('Failed to duplicate receipt:', error);
    }
    setOpenDropdown(null);
  };

  const handleToggleStatus = async (receipt: Receipt) => {
    try {
      const authData = localStorage.getItem('adr_auth');
      const { token } = authData ? JSON.parse(authData) : {};

      const newStatus = receipt.status === 'active' ? 'inactive' : 'active';
      const statusText = newStatus === 'active' ? '재개' : '일시정지';

      const response = await fetch(`http://localhost:3001/api/receipts/${receipt.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        fetchReceipts();
        alert(`광고가 ${statusText}되었습니다.`);
      }
    } catch (error) {
      console.error('Failed to toggle status:', error);
    }
    setOpenDropdown(null);
  };

  /* Unused functions
  const getStatusBadge = (status: string) => {
    const badges = {
      active: { bg: 'bg-green-100', text: 'text-green-700', label: '진행' },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: '대기' },
      completed: { bg: 'bg-gray-100', text: 'text-gray-700', label: '종료' },
      inactive: { bg: 'bg-red-100', text: 'text-red-700', label: '정지' }
    };
    const badge = badges[status as keyof typeof badges] || badges.inactive;
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const getUploadStatus = (status: string) => {
    return status === '동록' ? (
      <span className="text-green-600 font-medium">동록</span>
    ) : (
      <span className="text-gray-400">미동록</span>
    );
  };
  */

  const tabs = [
    { key: 'all', label: '전체', count: receipts.length },
    { key: 'pending', label: '대기', count: 0 },
    { key: 'active', label: '진행', count: 23 },
    { key: 'inactive', label: '정지', count: 16 },
    { key: 'completed', label: '종료', count: 64 }
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">영수증 관리</h1>
        <p className="mt-1 text-sm text-gray-600">
          영수증 발행 및 리뷰를 관리합니다.
        </p>
      </div>

      {/* 탭 */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              <span className="ml-2 px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* 검색 및 액션 */}
      <div className="mb-6 flex justify-between items-center">
        <form onSubmit={handleSearch} className="flex-1 max-w-lg">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="영수증 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </form>

        <div className="flex gap-3">
          <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2">
            <Download className="w-5 h-5" />
            액셀 다운
          </button>
          <button
            onClick={() => console.log('Create modal not implemented')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            광고 등록
          </button>
        </div>
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                아이디
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                업체명
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                플레이스 URL
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                유형
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                업로드
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                일반행
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                누적발행
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                잔여ID
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                보고서
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                발행기간
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                수정
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={11} className="text-center py-8 text-gray-500">
                  로딩 중...
                </td>
              </tr>
            ) : receipts.length === 0 ? (
              <tr>
                <td colSpan={11} className="text-center py-8 text-gray-500">
                  영수증이 없습니다.
                </td>
              </tr>
            ) : (
              receipts.map((receipt) => (
                <tr key={receipt.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{receipt.account_id}</div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm text-gray-900">{receipt.business_name}</div>
                  </td>
                  <td className="px-4 py-4">
                    <a
                      href={`https://place.naver.com${receipt.place_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      {receipt.place_url}
                    </a>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{receipt.place_type}</div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => {
                          setCurrentReceiptId(receipt.id);
                          setShowMenuModal(true);
                        }}
                        className={`px-2 py-1 text-xs rounded ${
                          receipt.menu_status === '동록'
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        메뉴
                      </button>
                      <button
                        onClick={() => {
                          setCurrentReceiptId(receipt.id);
                          setShowHoursModal(true);
                        }}
                        className={`px-2 py-1 text-xs rounded ${
                          receipt.hours_status === '동록'
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        영업시간
                      </button>
                      <button
                        onClick={() => {
                          setCurrentReceiptId(receipt.id);
                          setShowPointsModal(true);
                        }}
                        className={`px-2 py-1 text-xs rounded ${
                          receipt.intro_status === '동록'
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        소구점
                      </button>
                      <button
                        disabled
                        className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-400 cursor-not-allowed"
                      >
                        인쇄
                      </button>
                      <button
                        disabled
                        className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-700 hover:bg-blue-200"
                      >
                        업로드
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                      receipt.daily_issued >= receipt.daily_limit ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {receipt.daily_issued} / {receipt.daily_limit}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                      receipt.total_limit && receipt.total_issued >= receipt.total_limit ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {receipt.total_issued} / {receipt.total_limit || 0}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="inline-flex px-3 py-1 text-sm rounded-full bg-blue-100 text-blue-700 font-medium">
                      {receipt.remaining_ids}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <button
                      onClick={() => {
                        console.log('Reviews modal not implemented', receipt);
                      }}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                  </td>
                  <td className="px-4 py-4">
                    {receipt.start_date && receipt.end_date ? (
                      <div className="text-sm">
                        <div className="text-gray-900">
                          {new Date(receipt.start_date).toLocaleDateString()} ~ {new Date(receipt.end_date).toLocaleDateString()}
                        </div>
                        {receipt.days_remaining !== null && (
                          <div className={`text-xs ${receipt.days_remaining <= 3 ? 'text-red-600' : 'text-gray-500'}`}>
                            {receipt.days_remaining}일 남음
                          </div>
                        )}
                      </div>
                    ) : (
                      receipt.remark && (
                        <div className="text-xs text-orange-600 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {receipt.remark}
                        </div>
                      )
                    )}
                  </td>
                  <td className="px-4 py-4 text-center relative">
                    <button
                      onClick={() => setOpenDropdown(openDropdown === receipt.id ? null : receipt.id)}
                      className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {/* 드롭다운 메뉴 */}
                    {openDropdown === receipt.id && (
                      <div
                        ref={dropdownRef}
                        className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10"
                      >
                        <button
                          onClick={() => handleEdit(receipt)}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 first:rounded-t-lg flex items-center gap-2"
                        >
                          <Edit className="w-4 h-4" />
                          광고수정
                        </button>
                        <button
                          onClick={() => handleDuplicate(receipt)}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                        >
                          <Copy className="w-4 h-4" />
                          광고복제
                        </button>
                        <button
                          onClick={() => handleToggleStatus(receipt)}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                        >
                          {receipt.status === 'active' ? (
                            <>
                              <Pause className="w-4 h-4" />
                              일시정지
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4" />
                              재개
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => {
                            handleDelete(receipt.id);
                            setOpenDropdown(null);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 last:rounded-b-lg flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          광고삭제
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 모달들 */}
      {/* <AdCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          fetchReceipts();
        }}
      /> */}

      {/* <ReceiptReviewsModal
        isOpen={showReviewsModal}
        onClose={() => {
          setShowReviewsModal(false);
          setSelectedReceipt(null);
        }}
        receipt={selectedReceipt}
      /> */}

      <MenuModal
        isOpen={showMenuModal}
        onClose={() => {
          setShowMenuModal(false);
          setCurrentReceiptId(null);
        }}
        receiptId={currentReceiptId}
      />

      <HoursModal
        isOpen={showHoursModal}
        onClose={() => {
          setShowHoursModal(false);
          setCurrentReceiptId(null);
        }}
        receiptId={currentReceiptId}
      />

      <PointsModal
        isOpen={showPointsModal}
        onClose={() => {
          setShowPointsModal(false);
          setCurrentReceiptId(null);
        }}
        receiptId={currentReceiptId}
      />

      {/* <AdEditModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingReceipt(null);
        }}
        receipt={editingReceipt}
        onSave={handleEditSave}
      /> */}
    </div>
  );
}