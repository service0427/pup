import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  ChevronDown,
  ChevronRight,
  Shield,
  User,
  Loader2,
  LogIn,
  LogOut
} from 'lucide-react';
import { UserCreateModal } from '../components/UserCreateModal';
import { UserEditModal } from '../components/UserEditModal';
import { useAuth } from '../hooks/useAuth';

interface UserAccount {
  id: number;
  username: string;
  name: string;
  role: 'admin' | 'distributor' | 'operator' | 'user';
  status: 'active' | 'inactive' | 'suspended';
  tier_level: number;
  parent_id: number | null;
  parent_name: string | null;
  path: string;
  subordinate_count: number;
  available_points: number;
  total_earned: number;
  permissions: {
    can_use_service: boolean;
    can_manage_users: boolean;
    can_view_reports: boolean;
    commission_rate: number;
  };
  created_at: string;
  last_login_at: string | null;
}

interface SubordinateState {
  loading: boolean;
  loaded: boolean;
  users: UserAccount[];
  page: number;
  hasMore: boolean;
}

export function AccountsPageV2() {
  const { user, login } = useAuth();
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [subordinates, setSubordinates] = useState<Map<number, SubordinateState>>(new Map());
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
  const [switchingUser, setSwitchingUser] = useState(false);
  const ITEMS_PER_PAGE = 20;
  const SUBORDINATES_PER_PAGE = 10;

  useEffect(() => {
    fetchUsers();
  }, [filterRole, filterStatus, page]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const authData = localStorage.getItem('adr_auth');
      const { token } = authData ? JSON.parse(authData) : {};

      const params = new URLSearchParams();

      // writer 제외 (더 이상 사용하지 않음)
      if (filterRole) {
        params.append('role', filterRole);
      }
      params.append('exclude_role', 'writer');

      if (filterStatus) params.append('status', filterStatus);
      if (searchTerm) params.append('search', searchTerm);
      params.append('page', page.toString());
      params.append('limit', ITEMS_PER_PAGE.toString());

      // 총판의 경우 자기 하위 사용자만, 개발자/관리자는 최상위 사용자들 보기
      if (user?.role === 'distributor') {
        params.append('parent_id', user.id); // 자기 하위 사용자만
      } else if (user?.role === 'admin' || user?.role === 'developer') {
        params.append('show_admin_children', 'true');
        //params.append('parent_id', 'null'); // 최상위만
      }

      const response = await fetch(`http://localhost:3001/api/users?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      // 토큰 만료 체크
      if (!response.ok && data.message === '토큰이 만료되었습니다.') {
        localStorage.removeItem('adr_auth');
        window.location.href = '/admin/login';
        return;
      }

      if (data.success) {
        if (page === 1) {
          setUsers(data.data.users);
        } else {
          setUsers(prev => [...prev, ...data.data.users]);
        }
        setHasMore(data.data.users.length === ITEMS_PER_PAGE);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubordinates = async (parentId: number, subPage: number = 1) => {
    try {
      const authData = localStorage.getItem('adr_auth');
      const { token } = authData ? JSON.parse(authData) : {};

      const params = new URLSearchParams();
      params.append('parent_id', parentId.toString());
      params.append('page', subPage.toString());
      params.append('limit', SUBORDINATES_PER_PAGE.toString());

      const response = await fetch(`http://localhost:3001/api/users?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      // 토큰 만료 체크
      if (!response.ok && data.message === '토큰이 만료되었습니다.') {
        localStorage.removeItem('adr_auth');
        window.location.href = '/admin/login';
        return;
      }

      if (data.success) {
        const currentState = subordinates.get(parentId) || {
          loading: false,
          loaded: false,
          users: [],
          page: 0,
          hasMore: true
        };

        const newState: SubordinateState = {
          loading: false,
          loaded: true,
          users: subPage === 1
            ? data.data.users
            : [...currentState.users, ...data.data.users],
          page: subPage,
          hasMore: data.data.users.length === SUBORDINATES_PER_PAGE
        };

        setSubordinates(new Map(subordinates.set(parentId, newState)));
      }
    } catch (error) {
      console.error('Failed to fetch subordinates:', error);

      const newState: SubordinateState = {
        loading: false,
        loaded: true,
        users: [],
        page: 1,
        hasMore: false
      };
      setSubordinates(new Map(subordinates.set(parentId, newState)));
    }
  };

  const toggleRow = async (userId: number) => {
    const newExpanded = new Set(expandedRows);

    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);

      // 하위 사용자를 아직 불러오지 않았다면 불러오기
      if (!subordinates.has(userId)) {
        const newState: SubordinateState = {
          loading: true,
          loaded: false,
          users: [],
          page: 1,
          hasMore: true
        };
        setSubordinates(new Map(subordinates.set(userId, newState)));
        await fetchSubordinates(userId, 1);
      }
    }
    setExpandedRows(newExpanded);
  };

  const loadMoreSubordinates = async (parentId: number) => {
    const state = subordinates.get(parentId);
    if (state && state.hasMore && !state.loading) {
      const newState = { ...state, loading: true };
      setSubordinates(new Map(subordinates.set(parentId, newState)));
      await fetchSubordinates(parentId, state.page + 1);
    }
  };

  // 사용자 전환 (개발자 전용)
  const handleSwitchUser = async (targetUser: UserAccount) => {
    if (user?.role !== 'developer') {
      alert('개발자 권한이 필요합니다.');
      return;
    }

    if (!confirm(`${targetUser.name}(${targetUser.username}) 계정으로 전환하시겠습니까?`)) {
      return;
    }

    try {
      setSwitchingUser(true);
      const authData = localStorage.getItem('adr_auth');
      const { token } = authData ? JSON.parse(authData) : {};

      const response = await fetch('http://localhost:3001/api/auth/switch-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ targetUserId: targetUser.id })
      });

      const data = await response.json();

      if (data.success) {
        // localStorage에 직접 저장
        const authData = {
          user: {
            ...data.data.user,
            switched_from: data.data.switched_from
          },
          token: data.data.token,
          sessionId: data.data.sessionId
        };

        localStorage.setItem('adr_auth', JSON.stringify(authData));
        localStorage.setItem('adr_token', data.data.token);

        // 페이지 새로고침하여 새 권한 적용
        window.location.reload();
      } else {
        alert(data.message || '사용자 전환에 실패했습니다.');
      }
    } catch (error) {
      console.error('사용자 전환 실패:', error);
      alert('사용자 전환 중 오류가 발생했습니다.');
    } finally {
      setSwitchingUser(false);
    }
  };

  // 원래 계정으로 복귀
  const handleSwitchBack = async () => {
    if (!confirm('원래 개발자 계정으로 복귀하시겠습니까?')) {
      return;
    }

    try {
      setSwitchingUser(true);
      const authData = localStorage.getItem('adr_auth');
      const { token } = authData ? JSON.parse(authData) : {};

      const response = await fetch('http://localhost:3001/api/auth/switch-back', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        // 개발자 계정으로 다시 로그인
        login(data.data.user.username, '', data.data.token, data.data.user);

        // 페이지 새로고침
        window.location.reload();
      } else {
        alert(data.message || '계정 복귀에 실패했습니다.');
      }
    } catch (error) {
      console.error('계정 복귀 실패:', error);
      alert('계정 복귀 중 오류가 발생했습니다.');
    } finally {
      setSwitchingUser(false);
    }
  };

  // 사용자 삭제
  const handleDeleteUser = async (targetUser: UserAccount) => {
    if (!confirm(`정말로 ${targetUser.name}(${targetUser.username}) 사용자를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }

    try {
      const authData = localStorage.getItem('adr_auth');
      const { token } = authData ? JSON.parse(authData) : {};

      const response = await fetch(`http://localhost:3001/api/users/${targetUser.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        alert(data.message);
        setPage(1);
        setSubordinates(new Map());
        setExpandedRows(new Set());
        fetchUsers();
      } else {
        alert(data.message || '사용자 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('사용자 삭제 실패:', error);
      alert('사용자 삭제 중 오류가 발생했습니다.');
    }
  };

  const getRoleBadge = (role: string) => {
    const badges = {
      developer: { bg: 'bg-gray-800', text: 'text-gray-100', icon: Shield, label: '개발자' },
      admin: { bg: 'bg-red-100', text: 'text-red-700', icon: Shield, label: '관리자' },
      distributor: { bg: 'bg-purple-100', text: 'text-purple-700', icon: Users, label: '총판' },
      advertiser: { bg: 'bg-orange-100', text: 'text-orange-700', icon: Users, label: '광고주' },
      writer: { bg: 'bg-green-100', text: 'text-green-700', icon: User, label: '작성자' }
    };
    const badge = badges[role as keyof typeof badges] || { bg: 'bg-gray-100', text: 'text-gray-700', icon: User, label: role };
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        <Icon className="w-3 h-3" />
        {badge.label}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      active: { bg: 'bg-green-100', text: 'text-green-700', label: '활성' },
      inactive: { bg: 'bg-gray-100', text: 'text-gray-700', label: '비활성' },
      suspended: { bg: 'bg-red-100', text: 'text-red-700', label: '정지' }
    };
    const badge = badges[status as keyof typeof badges];
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const renderUserRow = (userAccount: UserAccount, level: number = 0) => {
    const hasSubordinates = userAccount.subordinate_count > 0;
    const isExpanded = expandedRows.has(userAccount.id);
    const subState = subordinates.get(userAccount.id);

    return (
      <React.Fragment key={userAccount.id}>
        <tr className="hover:bg-gray-50">
          <td className="px-6 py-4">
            <div className="flex items-center" style={{ paddingLeft: `${level * 24}px` }}>
              {hasSubordinates && (
                <button
                  onClick={() => toggleRow(userAccount.id)}
                  className="mr-2 p-1 hover:bg-gray-200 rounded"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
              )}
              {!hasSubordinates && level > 0 && (
                <span className="mr-6" />
              )}
              <div>
                <div className="text-sm font-medium text-gray-900">{userAccount.username}</div>
                <div className="text-xs text-gray-500">{userAccount.name}</div>
              </div>
            </div>
          </td>
          <td className="px-6 py-4">
            {getRoleBadge(userAccount.role)}
          </td>
          <td className="px-6 py-4">
            {userAccount.parent_name && (
              <div className="text-sm text-gray-500">
                {userAccount.parent_name}
              </div>
            )}
          </td>
          <td className="px-6 py-4">
            {getStatusBadge(userAccount.status)}
          </td>
          <td className="px-6 py-4">
            {userAccount.subordinate_count > 0 && (
              <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-xs font-medium text-blue-700">
                하위 {userAccount.subordinate_count}명
              </span>
            )}
          </td>
          <td className="px-6 py-4">
            <div className="text-sm">
              <div className="font-medium text-gray-900">
                {userAccount.available_points.toLocaleString()} P
              </div>
              <div className="text-xs text-gray-500">
                누적 {userAccount.total_earned.toLocaleString()} P
              </div>
            </div>
          </td>
          <td className="px-6 py-4">
            <div className="text-sm text-gray-500">
              {new Date(userAccount.created_at).toLocaleDateString()}
            </div>
          </td>
          <td className="px-6 py-4">
            <div className="flex items-center gap-2">
              {/* 개발자 권한일 때만 사용자 전환 버튼 표시 */}
              {user?.role === 'developer' && userAccount.id !== user.id && (
                <button
                  onClick={() => handleSwitchUser(userAccount)}
                  disabled={switchingUser}
                  className="p-1 text-blue-600 hover:text-blue-900 disabled:opacity-50"
                  title="이 사용자로 전환"
                >
                  {switchingUser ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <LogIn className="w-4 h-4" />
                  )}
                </button>
              )}
              <button
                onClick={() => {
                  setSelectedUser(userAccount);
                  setShowEditModal(true);
                }}
                className="p-1 text-gray-600 hover:text-gray-900"
                title="사용자 수정"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDeleteUser(userAccount)}
                className="p-1 text-gray-600 hover:text-red-600"
                title="사용자 삭제"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </td>
        </tr>

        {/* 하위 사용자 표시 */}
        {isExpanded && subState && (
          <>
            {subState.loading && !subState.loaded && (
              <tr>
                <td colSpan={8} className="text-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin inline-block text-gray-500" />
                  <span className="ml-2 text-sm text-gray-500">하위 사용자 불러오는 중...</span>
                </td>
              </tr>
            )}

            {subState.users.map(child => renderUserRow(child, level + 1))}

            {/* 더보기 버튼 */}
            {subState.hasMore && (
              <tr>
                <td colSpan={8} style={{ paddingLeft: `${(level + 1) * 24}px` }}>
                  <button
                    onClick={() => loadMoreSubordinates(userAccount.id)}
                    disabled={subState.loading}
                    className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400"
                  >
                    {subState.loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin inline-block mr-2" />
                        불러오는 중...
                      </>
                    ) : (
                      `하위 사용자 ${SUBORDINATES_PER_PAGE}명 더 보기`
                    )}
                  </button>
                </td>
              </tr>
            )}
          </>
        )}
      </React.Fragment>
    );
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">계정 관리</h1>
        <p className="mt-1 text-sm text-gray-600">
          시스템 사용자 계정을 관리합니다.
        </p>
      </div>

      {/* 필터 및 검색 */}
      <div className="mb-6 bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-4">
          <form onSubmit={(e) => { e.preventDefault(); setPage(1); fetchUsers(); }} className="flex-1 min-w-[300px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="아이디 또는 이름 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </form>

          <select
            value={filterRole}
            onChange={(e) => { setFilterRole(e.target.value); setPage(1); }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">모든 역할</option>
            <option value="distributor">총판</option>
            <option value="advertiser">광고주</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">모든 상태</option>
            <option value="active">활성</option>
            <option value="inactive">비활성</option>
            <option value="suspended">정지</option>
          </select>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <UserPlus className="w-5 h-5" />
            사용자 추가
          </button>
        </div>
      </div>

      {/* 사용자 테이블 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                사용자
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                역할
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                상위
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                상태
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                하위
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                포인트
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                가입일
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                작업
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading && page === 1 ? (
              <tr>
                <td colSpan={8} className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin inline-block text-gray-500" />
                  <p className="mt-2 text-gray-500">로딩 중...</p>
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-gray-500">
                  사용자가 없습니다.
                </td>
              </tr>
            ) : (
              users.map(user => renderUserRow(user))
            )}
          </tbody>
        </table>

        {/* 더보기 버튼 (메인 페이징) */}
        {hasMore && !loading && (
          <div className="px-6 py-4 border-t">
            <button
              onClick={() => setPage(prev => prev + 1)}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              더 보기
            </button>
          </div>
        )}

        {loading && page > 1 && (
          <div className="px-6 py-4 border-t text-center">
            <Loader2 className="w-5 h-5 animate-spin inline-block text-gray-500" />
            <span className="ml-2 text-sm text-gray-500">불러오는 중...</span>
          </div>
        )}
      </div>

      {/* 통계 정보 */}
      <div className="mt-4 text-sm text-gray-600">
        <p>* 하위 사용자가 많은 경우 {SUBORDINATES_PER_PAGE}명씩 나누어 표시됩니다.</p>
        <p>* 펼치기 버튼을 클릭하면 해당 사용자의 하위 사용자를 불러옵니다.</p>
      </div>

      {/* 사용자 생성 모달 */}
      <UserCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setPage(1);
          setSubordinates(new Map());
          setExpandedRows(new Set());
          fetchUsers();
        }}
        currentUser={user}
      />

      {/* 사용자 수정 모달 */}
      <UserEditModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedUser(null);
        }}
        onSuccess={() => {
          setPage(1);
          setSubordinates(new Map());
          setExpandedRows(new Set());
          fetchUsers();
        }}
        user={selectedUser}
      />
    </div>
  );
}