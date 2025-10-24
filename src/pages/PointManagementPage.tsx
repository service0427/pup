import { useState, useEffect } from 'react';
import { Search, RefreshCw, Coins, Plus, Minus, AlertTriangle, History, X } from 'lucide-react';

interface UserBalance {
  id: number;
  user_id: number;
  username: string;
  name: string;
  role: string;
  available_points: number;
  pending_points: number;
  total_earned: number;
  total_spent: number;
}

interface PointTransaction {
  id: number;
  user_id: number;
  transaction_type: string;
  amount: number;
  balance_before: number;
  balance_after: number;
  description: string;
  processor_name: string;
  created_at: string;
}

interface PointAdjustModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: UserBalance | null;
}

function PointAdjustModal({ isOpen, onClose, onSuccess, user }: PointAdjustModalProps) {
  const [addAmount, setAddAmount] = useState('');
  const [subtractAmount, setSubtractAmount] = useState('');
  const [description, setDescription] = useState('');
  const [enableSubtract, setEnableSubtract] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAddAmount('');
      setSubtractAmount('');
      setDescription('');
      setEnableSubtract(false);
    }
  }, [isOpen]);

  const handleAdjust = async (isAdd: boolean) => {
    const amount = isAdd ? parseInt(addAmount) : -parseInt(subtractAmount);

    if (!amount || amount === 0) {
      alert('포인트를 입력해주세요.');
      return;
    }

    if (!description.trim()) {
      alert('사유를 입력해주세요.');
      return;
    }

    if (!isAdd && parseInt(subtractAmount) > user!.available_points) {
      alert(`보유 포인트(${user!.available_points}P)보다 많이 차감할 수 없습니다.`);
      return;
    }

    const confirmed = confirm(
      `${user!.name}님에게 포인트를 ${isAdd ? '지급' : '차감'}하시겠습니까?\n` +
      `${isAdd ? '+' : '-'}${Math.abs(amount).toLocaleString()}P\n` +
      `사유: ${description}`
    );

    if (!confirmed) return;

    try {
      setSubmitting(true);
      const authData = localStorage.getItem('adr_auth');
      const { token } = authData ? JSON.parse(authData) : {};

      const response = await fetch('http://localhost:3001/api/points/adjust', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: user!.user_id,
          amount,
          description
        })
      });

      const data = await response.json();
      if (data.success) {
        alert(data.message);
        onSuccess();
        onClose();
      } else {
        alert(data.message || '포인트 조정에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to adjust points:', error);
      alert('포인트 조정에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose}></div>

        <div className="relative bg-white rounded-lg max-w-md w-full">
          {/* 헤더 */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">포인트 지급/차감</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 바디 */}
          <div className="p-6 space-y-4">
            {/* 사용자 정보 */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm text-gray-600">대상 사용자</p>
                  <p className="text-lg font-semibold text-gray-900">{user.name} ({user.username})</p>
                  <p className="text-sm text-gray-500">{user.role}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">현재 보유</p>
                  <p className="text-2xl font-bold text-blue-600">{user.available_points.toLocaleString()}P</p>
                </div>
              </div>
            </div>

            {/* 포인트 지급 */}
            <div className="p-4 border-2 border-blue-200 rounded-lg bg-blue-50">
              <div className="flex items-center gap-2 mb-3">
                <Plus className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-blue-900">포인트 지급</h3>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={addAmount}
                  onChange={(e) => setAddAmount(e.target.value)}
                  placeholder="지급할 포인트"
                  className="flex-1 px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={submitting}
                />
                <span className="text-blue-600 font-medium">P</span>
                <button
                  onClick={() => handleAdjust(true)}
                  disabled={submitting || !addAmount || !description}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  지급
                </button>
              </div>
            </div>

            {/* 포인트 차감 */}
            <div className="p-4 border-2 border-red-200 rounded-lg bg-red-50">
              <div className="flex items-center gap-2 mb-3">
                <Minus className="w-5 h-5 text-red-600" />
                <h3 className="font-semibold text-red-900">포인트 차감</h3>
                <AlertTriangle className="w-4 h-4 text-red-600 ml-auto" />
              </div>

              <label className="flex items-center gap-2 mb-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableSubtract}
                  onChange={(e) => setEnableSubtract(e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm text-red-700 font-medium">차감 모드 활성화 (주의!)</span>
              </label>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={subtractAmount}
                  onChange={(e) => setSubtractAmount(e.target.value)}
                  placeholder="차감할 포인트"
                  disabled={!enableSubtract || submitting}
                  className="flex-1 px-3 py-2 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                <span className="text-red-600 font-medium">P</span>
                <button
                  onClick={() => handleAdjust(false)}
                  disabled={!enableSubtract || submitting || !subtractAmount || !description}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <Minus className="w-4 h-4" />
                  차감
                </button>
              </div>
            </div>

            {/* 사유 입력 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                사유 <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="포인트 조정 사유를 입력하세요..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                disabled={submitting}
              />
            </div>
          </div>

          {/* 푸터 */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              disabled={submitting}
            >
              취소
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// 거래 내역 모달
interface TransactionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserBalance | null;
}

function TransactionHistoryModal({ isOpen, onClose, user }: TransactionHistoryModalProps) {
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      fetchTransactions();
    }
  }, [isOpen, user]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const authData = localStorage.getItem('adr_auth');
      const { token } = authData ? JSON.parse(authData) : {};

      const response = await fetch(`http://localhost:3001/api/points/transactions?user_id=${user!.user_id}&limit=50`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setTransactions(data.data.transactions);
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'admin_add': return '관리자 지급';
      case 'admin_subtract': return '관리자 차감';
      case 'earn': return '적립';
      case 'spend': return '사용';
      case 'refund': return '환불';
      case 'transfer': return '이체';
      default: return type;
    }
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'admin_add': return 'bg-blue-100 text-blue-700';
      case 'admin_subtract': return 'bg-red-100 text-red-700';
      case 'earn': return 'bg-green-100 text-green-700';
      case 'spend': return 'bg-yellow-100 text-yellow-700';
      case 'refund': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose}></div>

        <div className="relative bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
          {/* 헤더 */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <History className="w-6 h-6 text-gray-600" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">거래 내역</h2>
                <p className="text-sm text-gray-600">{user.name} ({user.username})</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 바디 */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="text-center py-8 text-gray-500">로딩 중...</div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">거래 내역이 없습니다.</div>
            ) : (
              <div className="space-y-3">
                {transactions.map((tx) => (
                  <div key={tx.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTransactionTypeColor(tx.transaction_type)}`}>
                          {getTransactionTypeLabel(tx.transaction_type)}
                        </span>
                        <span className={`text-lg font-bold ${tx.amount > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                          {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()}P
                        </span>
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        {formatDate(tx.created_at)}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex-1">
                        <p className="text-gray-700 mb-1">{tx.description}</p>
                        {tx.processor_name && (
                          <p className="text-gray-500 text-xs">처리자: {tx.processor_name}</p>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-gray-600">
                          <span className="text-gray-400">잔액: </span>
                          <span className="text-gray-500">{tx.balance_before.toLocaleString()}P</span>
                          <span className="mx-1">→</span>
                          <span className="font-semibold text-blue-600">{tx.balance_after.toLocaleString()}P</span>
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 푸터 */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PointManagementPage() {
  const [balances, setBalances] = useState<UserBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserBalance | null>(null);

  useEffect(() => {
    fetchBalances();
  }, [roleFilter]);

  const fetchBalances = async () => {
    try {
      setLoading(true);
      const authData = localStorage.getItem('adr_auth');
      const { token } = authData ? JSON.parse(authData) : {};

      const params = new URLSearchParams();
      if (roleFilter) params.append('role', roleFilter);

      const response = await fetch(`http://localhost:3001/api/points/balances?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        // 포인트 지급 대상만 필터링 (advertiser, writer)
        const targetBalances = data.data.balances.filter((b: UserBalance) =>
          b.role === 'advertiser' || b.role === 'writer'
        );
        setBalances(targetBalances);
      }
    } catch (error) {
      console.error('Failed to fetch balances:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBalances = balances.filter(balance =>
    balance.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    balance.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-700';
      case 'distributor': return 'bg-blue-100 text-blue-700';
      case 'advertiser': return 'bg-green-100 text-green-700';
      case 'writer': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return '관리자';
      case 'distributor': return '총판';
      case 'advertiser': return '광고주';
      case 'writer': return '작가';
      default: return role;
    }
  };

  return (
    <div className="p-6">
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">포인트 관리</h1>
        <p className="mt-1 text-gray-600">사용자별 포인트 지급 및 관리</p>
      </div>

      {/* 필터 및 검색 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="이름 또는 아이디로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">전체 역할</option>
            <option value="advertiser">광고주</option>
            <option value="writer">작가</option>
          </select>

          <button
            onClick={fetchBalances}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            새로고침
          </button>
        </div>
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이름</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">아이디</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">역할</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">보유 포인트</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">사용중</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">사용완료</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    로딩 중...
                  </td>
                </tr>
              ) : filteredBalances.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    검색 결과가 없습니다.
                  </td>
                </tr>
              ) : (
                filteredBalances.map((balance, index) => (
                  <tr key={balance.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {balance.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {balance.username}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(balance.role)}`}>
                        {getRoleLabel(balance.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      <span className="font-semibold text-blue-600">
                        {balance.available_points.toLocaleString()}P
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-yellow-600">
                      {balance.pending_points.toLocaleString()}P
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                      {balance.total_spent.toLocaleString()}P
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedUser(balance);
                            setShowAdjustModal(true);
                          }}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-1"
                        >
                          <Coins className="w-4 h-4" />
                          지급/차감
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUser(balance);
                            setShowHistoryModal(true);
                          }}
                          className="px-3 py-1.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm flex items-center gap-1"
                        >
                          <History className="w-4 h-4" />
                          거래내역
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 포인트 조정 모달 */}
      <PointAdjustModal
        isOpen={showAdjustModal}
        onClose={() => {
          setShowAdjustModal(false);
          setSelectedUser(null);
        }}
        onSuccess={fetchBalances}
        user={selectedUser}
      />

      {/* 거래 내역 모달 */}
      <TransactionHistoryModal
        isOpen={showHistoryModal}
        onClose={() => {
          setShowHistoryModal(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
      />
    </div>
  );
}
