import { useEffect, useState } from 'react';
import { Users, Coins, MapPin, CheckCircle, TrendingUp, Calendar, Clock, AlertCircle } from 'lucide-react';

interface AdminStats {
  role: 'admin' | 'developer';
  totalUsers: number;
  totalPlaces: number;
  reviews: {
    pending: number;
    approved: number;
    rejected: number;
    cancelled: number;
    total: number;
    today: number;
  };
  points: {
    available: number;
    pending: number;
    earned: number;
    spent: number;
    today: number;
  };
}

interface UserStats {
  role: 'advertiser' | 'distributor';
  myPlaces: number;
  subordinates: number;
  reviews: {
    pending: number;
    approved: number;
    rejected: number;
    total: number;
    today: number;
  };
  points: {
    available: number;
    pending: number;
    earned: number;
    spent: number;
    today: number;
  };
}

type DashboardStats = AdminStats | UserStats;

interface Activity {
  type: string;
  status?: string;
  transaction_type?: string;
  user?: {
    name: string;
    username: string;
  };
  place?: string;
  amount?: number;
  description?: string;
  role?: string;
  created_at: string;
  id: number;
}

export function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const authData = localStorage.getItem('adr_auth');
      const { token } = authData ? JSON.parse(authData) : {};

      // 통계 데이터 가져오기
      const statsResponse = await fetch('http://localhost:3001/api/dashboard/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const statsData = await statsResponse.json();

      // 최근 활동 가져오기
      const activitiesResponse = await fetch('http://localhost:3001/api/dashboard/recent-activities?limit=10', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const activitiesData = await activitiesResponse.json();

      if (statsData.success) {
        setStats(statsData.data);
      }

      if (activitiesData.success) {
        setActivities(activitiesData.data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 역할별로 다른 통계 카드 표시
  const statCards = stats.role === 'admin' || stats.role === 'developer'
    ? [
        {
          title: '전체 사용자',
          value: (stats as AdminStats).totalUsers.toLocaleString(),
          icon: Users,
          subtitle: '광고주/총판',
          color: 'blue'
        },
        {
          title: '전체 플레이스',
          value: (stats as AdminStats).totalPlaces.toLocaleString(),
          icon: MapPin,
          subtitle: '등록된 장소',
          color: 'green'
        },
        {
          title: '승인 대기 리뷰',
          value: stats.reviews.pending.toLocaleString(),
          icon: Clock,
          subtitle: `오늘 ${stats.reviews.today}건`,
          color: 'yellow'
        },
        {
          title: '보유 포인트',
          value: `${stats.points.available.toLocaleString()}P`,
          icon: Coins,
          subtitle: `오늘 ${stats.points.today.toLocaleString()}P 지급`,
          color: 'purple'
        }
      ]
    : [
        {
          title: '내 플레이스',
          value: (stats as UserStats).myPlaces.toLocaleString(),
          icon: MapPin,
          subtitle: '등록한 장소',
          color: 'green'
        },
        ...(stats.role === 'distributor' ? [{
          title: '하위 사용자',
          value: (stats as UserStats).subordinates.toLocaleString(),
          icon: Users,
          subtitle: '관리 중인 광고주',
          color: 'blue'
        }] : []),
        {
          title: '내 리뷰',
          value: stats.reviews.total.toLocaleString(),
          icon: CheckCircle,
          subtitle: `승인 ${stats.reviews.approved}건 · 대기 ${stats.reviews.pending}건`,
          color: 'yellow'
        },
        {
          title: '내 포인트',
          value: `${stats.points.available.toLocaleString()}P`,
          icon: Coins,
          subtitle: `오늘 ${stats.points.today.toLocaleString()}P 획득`,
          color: 'purple'
        }
      ];

  const colorVariants = {
    blue: {
      bg: 'bg-blue-100',
      text: 'text-blue-600',
      icon: 'text-blue-500'
    },
    green: {
      bg: 'bg-green-100',
      text: 'text-green-600',
      icon: 'text-green-500'
    },
    yellow: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-600',
      icon: 'text-yellow-500'
    },
    purple: {
      bg: 'bg-purple-100',
      text: 'text-purple-600',
      icon: 'text-purple-500'
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
        <p className="text-gray-600 mt-1">전체 현황을 한눈에 확인하세요</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          const variant = colorVariants[stat.color as keyof typeof colorVariants];

          return (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`${variant.bg} p-3 rounded-lg`}>
                  <Icon className={`w-6 h-6 ${variant.icon}`} />
                </div>
              </div>
              <div>
                <p className="text-gray-600 text-sm mb-1">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.subtitle}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* 최근 활동 */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">최근 활동</h2>
            <Calendar className="w-5 h-5 text-gray-400" />
          </div>
        </div>
        <div className="p-6">
          {activities.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              최근 활동이 없습니다
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => {
                const getActivityDisplay = () => {
                  if (activity.type === 'review') {
                    const statusColors = {
                      pending: 'bg-yellow-500',
                      approved: 'bg-green-500',
                      rejected: 'bg-red-500',
                      cancelled: 'bg-gray-500'
                    };
                    const statusLabels = {
                      pending: '대기',
                      approved: '승인',
                      rejected: '거절',
                      cancelled: '취소'
                    };
                    const title = activity.user
                      ? `${activity.user.name}님이 리뷰 등록`
                      : '리뷰 등록';
                    return {
                      color: statusColors[activity.status as keyof typeof statusColors] || 'bg-gray-500',
                      title,
                      subtitle: `${activity.place} · ${activity.amount?.toLocaleString()}P · ${statusLabels[activity.status as keyof typeof statusLabels]}`
                    };
                  } else if (activity.type === 'point') {
                    const typeLabels = {
                      admin_add: '포인트 지급',
                      earn: '포인트 획득',
                      spend: '포인트 사용',
                      referral: '추천 보상'
                    };
                    const title = activity.user
                      ? `${activity.user.name}님 ${typeLabels[activity.transaction_type as keyof typeof typeLabels] || '포인트 거래'}`
                      : typeLabels[activity.transaction_type as keyof typeof typeLabels] || '포인트 거래';
                    return {
                      color: activity.amount && activity.amount > 0 ? 'bg-blue-500' : 'bg-orange-500',
                      title,
                      subtitle: `${activity.amount && activity.amount > 0 ? '+' : ''}${activity.amount?.toLocaleString()}P${activity.description ? ` · ${activity.description}` : ''}`
                    };
                  } else if (activity.type === 'user') {
                    const roleLabels = {
                      advertiser: '광고주',
                      distributor: '총판'
                    };
                    return {
                      color: 'bg-purple-500',
                      title: `${activity.user?.name}님 가입`,
                      subtitle: `${roleLabels[activity.role as keyof typeof roleLabels] || activity.role} 계정`
                    };
                  }
                  return { color: 'bg-gray-500', title: '알 수 없는 활동', subtitle: '' };
                };

                const display = getActivityDisplay();
                const timeAgo = new Date(activity.created_at).toLocaleString('ko-KR');

                return (
                  <div key={`${activity.type}-${activity.id}`} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 ${display.color} rounded-full`}></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{display.title}</p>
                        <p className="text-xs text-gray-500">{display.subtitle}</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">{timeAgo}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}