import { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  ChevronDown,
  ChevronRight,
  UserCheck,
  Shield,
  User
} from 'lucide-react';

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
  permissions: {
    can_use_service: boolean;
    can_manage_users: boolean;
    can_view_reports: boolean;
    commission_rate: number;
  };
  created_at: string;
  last_login_at: string | null;
}

export function AccountsPage() {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchUsers();
  }, [filterRole, filterStatus]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const authData = localStorage.getItem('adr_auth');
      const { token } = authData ? JSON.parse(authData) : {};

      const params = new URLSearchParams();
      if (filterRole) params.append('role', filterRole);
      if (filterStatus) params.append('status', filterStatus);
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`/api/users?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setUsers(data.data.users);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

  const toggleRow = (userId: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedRows(newExpanded);
  };

  const getRoleBadge = (role: string) => {
    const badges = {
      admin: { bg: 'bg-red-100', text: 'text-red-700', icon: Shield, label: '관리자' },
      distributor: { bg: 'bg-purple-100', text: 'text-purple-700', icon: Users, label: '총판' },
      operator: { bg: 'bg-blue-100', text: 'text-blue-700', icon: UserCheck, label: '운영자' },
      user: { bg: 'bg-gray-100', text: 'text-gray-700', icon: User, label: '일반' }
    };
    const badge = badges[role as keyof typeof badges];
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

  const renderUserRow = (user: UserAccount, level: number = 0): JSX.Element => {
    const hasSubordinates = user.subordinate_count > 0;
    const isExpanded = expandedRows.has(user.id);

    return (
      <>
        <tr key={user.id} className="hover:bg-gray-50">
          <td className="px-6 py-4">
            <div className="flex items-center" style={{ paddingLeft: `${level * 24}px` }}>
              {hasSubordinates && (
                <button
                  onClick={() => toggleRow(user.id)}
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
                <div className="text-sm font-medium text-gray-900">{user.username}</div>
                <div className="text-xs text-gray-500">{user.name}</div>
              </div>
            </div>
          </td>
          <td className="px-6 py-4">
            {getRoleBadge(user.role)}
          </td>
          <td className="px-6 py-4">
            {user.parent_name && (
              <div className="text-sm text-gray-900">
                <div className="text-xs text-gray-500">
                  상위: {user.parent_name}
                </div>
              </div>
            )}
          </td>
          <td className="px-6 py-4">
            {getStatusBadge(user.status)}
          </td>
          <td className="px-6 py-4">
            {user.subordinate_count > 0 && (
              <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-xs font-medium text-blue-700">
                하위 {user.subordinate_count}명
              </span>
            )}
          </td>
          <td className="px-6 py-4">
            <div className="text-sm text-gray-500">
              {new Date(user.created_at).toLocaleDateString()}
              {user.last_login_at && (
                <div className="text-xs">
                  마지막 로그인: {new Date(user.last_login_at).toLocaleDateString()}
                </div>
              )}
            </div>
          </td>
          <td className="px-6 py-4">
            <div className="flex items-center gap-2">
              {user.permissions.can_manage_users && (
                <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded">
                  관리권한
                </span>
              )}
              {user.permissions.commission_rate > 0 && (
                <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                  수수료 {user.permissions.commission_rate}%
                </span>
              )}
            </div>
          </td>
          <td className="px-6 py-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => console.log('Edit user not implemented', user)}
                className="p-1 text-gray-600 hover:text-gray-900"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button className="p-1 text-gray-600 hover:text-red-600">
                <Trash2 className="w-4 h-4" />
              </button>
              <button className="p-1 text-gray-600 hover:text-gray-900">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          </td>
        </tr>
        {/* 하위 사용자 렌더링 (재귀) */}
        {isExpanded && hasSubordinates && (
          users
            .filter(u => u.parent_id === user.id)
            .map(child => renderUserRow(child, level + 1))
        )}
      </>
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
          <form onSubmit={handleSearch} className="flex-1 min-w-[300px]">
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
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">모든 역할</option>
            <option value="admin">관리자</option>
            <option value="distributor">총판</option>
            <option value="operator">운영자</option>
            <option value="user">사용자</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">모든 상태</option>
            <option value="active">활성</option>
            <option value="inactive">비활성</option>
            <option value="suspended">정지</option>
          </select>

          <button
            onClick={() => console.log('Create modal not implemented')}
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
                가입일
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                권한
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                작업
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-gray-500">
                  로딩 중...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-gray-500">
                  사용자가 없습니다.
                </td>
              </tr>
            ) : (
              users
                .filter(u => !u.parent_id) // 최상위 사용자만
                .map(user => renderUserRow(user))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}