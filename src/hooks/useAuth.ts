import { useState } from 'react';

interface User {
  id: string;
  username: string;
  role: 'developer' | 'admin' | 'distributor' | 'advertiser' | 'writer';
  name: string;
  switched_from?: string; // 개발자 전환 정보
}

export function useAuth() {
  // 초기값을 localStorage에서 바로 읽기
  const getInitialAuth = () => {
    const storedAuth = localStorage.getItem('adr_auth');
    if (storedAuth) {
      try {
        const authData = JSON.parse(storedAuth);
        return { isAuthenticated: true, user: authData.user };
      } catch (error) {
        console.error('Failed to parse auth data:', error);
        localStorage.removeItem('adr_auth');
      }
    }
    return { isAuthenticated: false, user: null };
  };

  const initial = getInitialAuth();
  const [isAuthenticated, setIsAuthenticated] = useState(initial.isAuthenticated);
  const [user, setUser] = useState<User | null>(initial.user);

  const login = async (username: string, password: string, token?: string, userInfo?: any) => {
    try {
      let data;

      // 직접 토큰 로그인 (사용자 전환용)
      if (token && userInfo) {
        data = {
          success: true,
          data: {
            token,
            user: userInfo,
            sessionId: 'switched-session'
          }
        };
      } else {
        // 일반 로그인
        const response = await fetch('http://localhost:3001/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, password }),
        });

        data = await response.json();
      }

      if (data.success) {
        const userData: User = {
          id: data.data.user.id.toString(),
          username: data.data.user.username,
          role: data.data.user.role,
          name: data.data.user.name,
          switched_from: data.data.switched_from || data.data.user.switched_from
        };

        const authData = {
          user: userData,
          token: data.data.token,
          sessionId: data.data.sessionId
        };

        localStorage.setItem('adr_auth', JSON.stringify(authData));
        setUser(userData);
        setIsAuthenticated(true);

        return { success: true, user: userData };
      }

      return { success: false, error: data.message || '로그인에 실패했습니다.' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: '서버 연결에 실패했습니다.' };
    }
  };

  const logout = async () => {
    try {
      const authData = localStorage.getItem('adr_auth');
      if (authData) {
        const { sessionId } = JSON.parse(authData);

        await fetch('http://localhost:3001/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sessionId }),
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    }

    localStorage.removeItem('adr_auth');
    setUser(null);
    setIsAuthenticated(false);
  };

  return {
    isAuthenticated,
    user,
    login,
    logout
  };
}