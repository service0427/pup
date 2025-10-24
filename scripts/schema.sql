-- ================================
-- ADR 데이터베이스 스키마
-- 생성일: 2025-09-22
-- ================================

-- 1. 데이터베이스 생성 (필요한 경우)
-- CREATE DATABASE adr;

-- 2. 타임스탬프 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ================================
-- 사용자 관련 테이블
-- ================================

-- users 테이블
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100),
    phone VARCHAR(20),
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'distributor', 'advertiser', 'writer')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    parent_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    login_count INTEGER DEFAULT 0
);

-- 사용자 인덱스
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_parent ON users(parent_id);

-- 업데이트 트리거
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================
-- 인증 및 세션 관련 테이블
-- ================================

-- sessions 테이블
CREATE TABLE IF NOT EXISTS sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

-- login_logs 테이블
CREATE TABLE IF NOT EXISTS login_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    login_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    logout_at TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT,
    status VARCHAR(20) DEFAULT 'success' CHECK (status IN ('success', 'failed', 'expired'))
);

CREATE INDEX idx_login_logs_user ON login_logs(user_id);
CREATE INDEX idx_login_logs_date ON login_logs(login_at);

-- user_referrals 테이블
CREATE TABLE IF NOT EXISTS user_referrals (
    id SERIAL PRIMARY KEY,
    referrer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referred_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referral_code VARCHAR(50),
    referral_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending',
    UNIQUE(referrer_id, referred_id)
);

CREATE INDEX idx_referrals_referrer ON user_referrals(referrer_id);
CREATE INDEX idx_referrals_referred ON user_referrals(referred_id);

-- ================================
-- 영수증 관련 테이블
-- ================================

-- receipts 테이블
CREATE TABLE IF NOT EXISTS receipts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    business_name VARCHAR(255) NOT NULL,
    business_number VARCHAR(20),
    address TEXT,
    phone VARCHAR(20),
    receipt_date DATE,
    amount DECIMAL(12,2),
    tax_amount DECIMAL(12,2),
    payment_method VARCHAR(50),
    receipt_number VARCHAR(100),
    items JSONB,
    receipt_image_url TEXT,
    ocr_data JSONB,
    verification_status VARCHAR(20) DEFAULT 'pending',
    verified_by INTEGER REFERENCES users(id),
    verified_at TIMESTAMP,
    main_keyword VARCHAR(100),
    sub_keywords TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_receipts_user ON receipts(user_id);
CREATE INDEX idx_receipts_date ON receipts(receipt_date);
CREATE INDEX idx_receipts_status ON receipts(verification_status);
CREATE INDEX idx_receipts_business ON receipts(business_name);

CREATE TRIGGER update_receipts_updated_at BEFORE UPDATE ON receipts
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- receipt_reviews 테이블
CREATE TABLE IF NOT EXISTS receipt_reviews (
    id SERIAL PRIMARY KEY,
    receipt_id INTEGER NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id),
    blog_url TEXT NOT NULL,
    review_title VARCHAR(255),
    review_content TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review_status VARCHAR(20) DEFAULT 'pending',
    review_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_by INTEGER REFERENCES users(id),
    approved_at TIMESTAMP,
    rejection_reason TEXT,
    points_earned INTEGER DEFAULT 0,
    delete_requested BOOLEAN DEFAULT FALSE,
    delete_requested_at TIMESTAMP,
    delete_requested_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_receipt_reviews_receipt ON receipt_reviews(receipt_id);
CREATE INDEX idx_receipt_reviews_user ON receipt_reviews(user_id);
CREATE INDEX idx_receipt_reviews_status ON receipt_reviews(review_status);
CREATE INDEX idx_receipt_reviews_date ON receipt_reviews(review_date);

CREATE TRIGGER update_receipt_reviews_updated_at BEFORE UPDATE ON receipt_reviews
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================
-- 작업 시스템 테이블
-- ================================

-- work_requests 테이블
CREATE TABLE IF NOT EXISTS work_requests (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL CHECK (type IN ('receipt_review', 'blog_post')),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    receipt_id INTEGER REFERENCES receipts(id) ON DELETE SET NULL,
    keywords TEXT[],
    guidelines TEXT,
    point_value INTEGER NOT NULL DEFAULT 100,
    status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'in_progress', 'completed', 'expired', 'cancelled')),
    version INTEGER DEFAULT 0,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
    assigned_at TIMESTAMP,
    expires_at TIMESTAMP,
    completed_at TIMESTAMP,
    review_url TEXT,
    review_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_work_status ON work_requests(status);
CREATE INDEX idx_work_type ON work_requests(type);
CREATE INDEX idx_work_assigned ON work_requests(assigned_to, status);
CREATE INDEX idx_work_created ON work_requests(created_at DESC);

CREATE TRIGGER update_work_requests_updated_at BEFORE UPDATE ON work_requests
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- work_history 테이블
CREATE TABLE IF NOT EXISTS work_history (
    id SERIAL PRIMARY KEY,
    work_id INTEGER NOT NULL REFERENCES work_requests(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('in_progress', 'completed', 'expired', 'cancelled')),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    completed_at TIMESTAMP,
    review_url TEXT,
    notes TEXT,
    points_earned INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_work_history_user ON work_history(user_id);
CREATE INDEX idx_work_history_work ON work_history(work_id);
CREATE INDEX idx_work_history_status ON work_history(status);
CREATE INDEX idx_work_history_assigned ON work_history(assigned_at DESC);

CREATE TRIGGER update_work_history_updated_at BEFORE UPDATE ON work_history
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- writer_settings 테이블
CREATE TABLE IF NOT EXISTS writer_settings (
    id SERIAL PRIMARY KEY,
    daily_limit INTEGER DEFAULT 5,
    weekly_limit INTEGER DEFAULT 20,
    min_review_length INTEGER DEFAULT 200,
    max_review_length INTEGER DEFAULT 2000,
    auto_expire_hours INTEGER DEFAULT 24,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_writer_settings_updated_at BEFORE UPDATE ON writer_settings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================
-- 뷰 생성
-- ================================

-- 사용자 계층 구조 뷰
CREATE OR REPLACE VIEW user_hierarchy AS
WITH RECURSIVE user_tree AS (
    SELECT
        id,
        username,
        name,
        role,
        parent_id,
        0 as level,
        CAST(id AS VARCHAR(1000)) as path
    FROM users
    WHERE parent_id IS NULL

    UNION ALL

    SELECT
        u.id,
        u.username,
        u.name,
        u.role,
        u.parent_id,
        ut.level + 1,
        ut.path || '/' || CAST(u.id AS VARCHAR(100))
    FROM users u
    INNER JOIN user_tree ut ON u.parent_id = ut.id
)
SELECT * FROM user_tree
ORDER BY path;

-- 활성 작업 뷰
CREATE OR REPLACE VIEW active_works AS
SELECT
    wr.*,
    u.username as assigned_username,
    u.name as assigned_name
FROM work_requests wr
LEFT JOIN users u ON wr.assigned_to = u.id
WHERE wr.status IN ('available', 'in_progress')
  AND (wr.expires_at IS NULL OR wr.expires_at > NOW());

-- ================================
-- 초기 설정 데이터
-- ================================

-- writer_settings 기본값 추가
INSERT INTO writer_settings (daily_limit, weekly_limit, min_review_length, max_review_length, auto_expire_hours)
VALUES (5, 20, 200, 2000, 24)
ON CONFLICT DO NOTHING;

-- 기본 관리자 계정 생성 (비밀번호: admin123!)
-- 주의: 프로덕션 환경에서는 즉시 비밀번호 변경 필요
INSERT INTO users (username, email, password, name, role, status)
VALUES ('admin', 'admin@adr.com', '$2a$10$YourHashedPasswordHere', '시스템 관리자', 'admin', 'active')
ON CONFLICT (username) DO NOTHING;

-- ================================
-- 권한 설정 (PostgreSQL 권한)
-- ================================

-- 테이블 권한 부여 (필요시)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO tech_adr;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO tech_adr;
-- GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO tech_adr;