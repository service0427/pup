-- =====================================================
-- 02. 테이블 생성 (로그인 관련 테이블만)
-- =====================================================
-- 실행: psql -U tech_adr -d adr -f 02_create_tables.sql

-- 데이터베이스 타임존을 한국 시간으로 설정
ALTER DATABASE adr SET TIMEZONE TO 'Asia/Seoul';
SET TIMEZONE TO 'Asia/Seoul';

-- UUID 확장 기능 활성화 (세션 ID 생성용)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 사용자 테이블
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'operator', 'user')),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMPTZ,
    login_attempts INT DEFAULT 0,
    locked_until TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 인덱스 생성
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_created_at ON users(created_at);

-- =====================================================
-- 로그인 기록 테이블
-- =====================================================
CREATE TABLE IF NOT EXISTS login_logs (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    username VARCHAR(50),
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN NOT NULL,
    failure_reason VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX idx_login_logs_user_id ON login_logs(user_id);
CREATE INDEX idx_login_logs_username ON login_logs(username);
CREATE INDEX idx_login_logs_created_at ON login_logs(created_at);
CREATE INDEX idx_login_logs_success ON login_logs(success);
CREATE INDEX idx_login_logs_ip_address ON login_logs(ip_address);

-- =====================================================
-- 세션 관리 테이블
-- =====================================================
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    ip_address INET,
    user_agent TEXT,
    last_activity TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token_hash ON sessions(token_hash);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX idx_sessions_last_activity ON sessions(last_activity);

-- =====================================================
-- 트리거 함수: updated_at 자동 업데이트
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- users 테이블에 트리거 적용
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 초기 관리자 계정 생성
-- =====================================================
-- 비밀번호: admin123 (bcryptjs로 해시)
INSERT INTO users (username, password_hash, name, role, status)
VALUES
    ('admin', '$2a$10$YKpzM1ZF2HogLCS6xNrc5uPzjlWWyT73Zzux7SZ2FMEXzZUxe9C0i', '최고관리자', 'admin', 'active'),
    ('operator1', '$2a$10$YKpzM1ZF2HogLCS6xNrc5uPzjlWWyT73Zzux7SZ2FMEXzZUxe9C0i', '운영자1', 'operator', 'active'),
    ('user1', '$2a$10$YKpzM1ZF2HogLCS6xNrc5uPzjlWWyT73Zzux7SZ2FMEXzZUxe9C0i', '일반사용자1', 'user', 'active')
ON CONFLICT (username) DO NOTHING;

-- =====================================================
-- 테이블 생성 확인
-- =====================================================
\echo '================================='
\echo '테이블 생성 완료'
\echo '생성된 테이블:'
\dt
\echo '================================='