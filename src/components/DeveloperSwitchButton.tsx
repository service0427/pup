import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

export function DeveloperSwitchButton() {
  const { login } = useAuth();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // localStorage 체크
    const checkStatus = () => {
      const authData = localStorage.getItem('adr_auth');

      if (authData) {
        try {
          const parsed = JSON.parse(authData);
          // switched_from이 있으면 전환 모드
          setIsVisible(!!parsed.user?.switched_from);
        } catch (error) {
          setIsVisible(false);
        }
      } else {
        setIsVisible(false);
      }
    };

    // 초기 체크
    checkStatus();

    // 5초마다 체크 (성능 개선)
    const interval = setInterval(checkStatus, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleReturn = async () => {
    if (!confirm('개발자 계정으로 돌아가시겠습니까?')) {
      return;
    }

    try {
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
        // 원래 계정 정보로 재로그인
        localStorage.setItem('adr_auth', JSON.stringify({
          user: data.data.user,
          token: data.data.token,
          sessionId: data.data.sessionId
        }));

        localStorage.setItem('adr_token', data.data.token);

        alert('개발자 계정으로 돌아왔습니다.');
        window.location.reload();
      } else {
        alert('개발자 계정 복귀에 실패했습니다.');
      }
    } catch (error) {
      console.error('계정 복귀 실패:', error);
      alert('계정 복귀 중 오류가 발생했습니다.');
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-8 right-8 z-[9999]">
      <button
        onClick={handleReturn}
        className="bg-purple-600 text-white px-6 py-3 rounded-full shadow-lg hover:bg-purple-700 transition-all transform hover:scale-105 flex items-center gap-2"
        title="개발자 계정으로 돌아가기"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z" />
        </svg>
        <span className="font-medium">개발자 복귀</span>
      </button>
      <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
        전환 모드
      </div>
    </div>
  );
}