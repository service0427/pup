/**
 * API 설정
 * 환경에 따라 자동으로 API URL 전환
 */

// Vite 환경변수에서 API URL 가져오기
// 빌드 시점에 import.meta.env.VITE_API_URL이 없으면 상대경로 사용
export const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// API 엔드포인트 URL 생성 헬퍼
export const getApiUrl = (path: string): string => {
  // path가 /로 시작하지 않으면 추가
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  // API_BASE_URL이 있으면 사용, 없으면 상대경로 (프로덕션)
  return API_BASE_URL ? `${API_BASE_URL}${normalizedPath}` : normalizedPath;
};

// 환경 확인
export const isDevelopment = import.meta.env.DEV;
export const isProduction = import.meta.env.PROD;

console.log('API Configuration:', {
  baseUrl: API_BASE_URL,
  environment: isDevelopment ? 'development' : 'production'
});
