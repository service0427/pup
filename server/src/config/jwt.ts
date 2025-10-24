/**
 * JWT 설정 관리
 * 환경변수를 통한 유연한 설정과 타입 안정성을 모두 확보
 */

import type { StringValue } from 'ms';

/**
 * JWT expiresIn 값 유효성 검증 및 반환
 * @returns 유효한 expiresIn 문자열 (예: '24h', '7d', '30m')
 */
const getJwtExpiresIn = (): StringValue | number => {
  const expiresIn = process.env.JWT_EXPIRES_IN || '24h';

  // JWT expiresIn 형식 검증 (숫자+단위: s(초), m(분), h(시간), d(일))
  const validPattern = /^\d+[smhd]$/;

  if (!validPattern.test(expiresIn)) {
    console.warn(
      `[JWT Config] Invalid JWT_EXPIRES_IN format: "${expiresIn}". ` +
      `Expected format: number + unit (s/m/h/d). Using default: "24h"`
    );
    return '24h' as StringValue;
  }

  return expiresIn as StringValue;
};

/**
 * JWT Secret 키 검증 및 반환
 * @returns JWT secret 문자열
 */
const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET || 'adr-secret-key-2024';

  if (!process.env.JWT_SECRET) {
    console.warn(
      '[JWT Config] JWT_SECRET not set in environment variables. ' +
      'Using default secret. This is NOT recommended for production!'
    );
  }

  return secret;
};

/**
 * JWT 설정 객체
 * 애플리케이션 전체에서 일관된 JWT 설정 사용을 보장
 */
export const JWT_CONFIG: {
  readonly secret: string;
  readonly expiresIn: StringValue | number;
} = {
  secret: getJwtSecret(),
  expiresIn: getJwtExpiresIn()
};

/**
 * JWT 토큰 생성 옵션 타입
 */
export interface JwtSignOptions {
  expiresIn: string;
}
