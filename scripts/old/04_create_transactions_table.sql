-- PostgreSQL용 Transactions 테이블 생성 (SERIAL 버전)

-- Transactions 테이블 생성 (포인트 외 실제 금전 거래)
CREATE TABLE IF NOT EXISTS transactions (
    id BIGSERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    
    -- 거래 정보
    type VARCHAR(20) NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'transfer', 'payment', 'refund')),
    amount BIGINT NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'KRW',
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    
    -- 결제 수단
    method VARCHAR(20) NOT NULL CHECK (method IN ('bank_transfer', 'credit_card', 'points', 'crypto', 'manual')),
    
    description TEXT,
    
    -- 참조 정보
    reference_id VARCHAR(100), -- 외부 거래 ID
    reference_type VARCHAR(50), -- 'point_withdrawal', 'ad_payment' 등
    
    -- 처리 정보
    processed_by INTEGER,
    processed_at TIMESTAMP NULL,
    
    -- 은행 정보 (출금 시 사용)
    bank_info JSONB,
    
    -- 수수료
    fee_amount BIGINT NOT NULL DEFAULT 0,
    final_amount BIGINT NOT NULL, -- amount - fee_amount
    
    -- 메타데이터
    metadata JSONB,
    
    -- 타임스탬프
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 외래키
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_method ON transactions(method);
CREATE INDEX IF NOT EXISTS idx_transactions_reference ON transactions(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_processed_at ON transactions(processed_at);

-- updated_at 트리거 생성
DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
CREATE TRIGGER update_transactions_updated_at 
    BEFORE UPDATE ON transactions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 거래 상태 히스토리 테이블
CREATE TABLE IF NOT EXISTS transaction_status_history (
    id BIGSERIAL PRIMARY KEY,
    transaction_id BIGINT NOT NULL,
    from_status VARCHAR(50) NOT NULL,
    to_status VARCHAR(50) NOT NULL,
    reason TEXT,
    changed_by INTEGER,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_transaction_status_history_transaction_id ON transaction_status_history(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_status_history_created_at ON transaction_status_history(created_at);

-- 출금 신청 테이블 (포인트 → 현금)
CREATE TABLE IF NOT EXISTS withdrawal_requests (
    id BIGSERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    transaction_id BIGINT,
    
    -- 출금 정보
    points_amount BIGINT NOT NULL, -- 차감될 포인트
    cash_amount BIGINT NOT NULL, -- 실제 지급할 현금
    exchange_rate DECIMAL(10,4) NOT NULL DEFAULT 1.0000, -- 포인트 -> 현금 환율
    
    -- 은행 정보
    bank_name VARCHAR(100) NOT NULL,
    account_number VARCHAR(50) NOT NULL,
    account_holder VARCHAR(100) NOT NULL,
    
    -- 상태
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'processing', 'completed', 'rejected')),
    
    -- 처리 정보
    approved_by INTEGER,
    approved_at TIMESTAMP NULL,
    processed_by INTEGER,
    processed_at TIMESTAMP NULL,
    
    rejection_reason TEXT,
    admin_notes TEXT,
    
    -- 메타데이터
    metadata JSONB,
    
    -- 타임스탬프
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 외래키
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE SET NULL,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_user_id ON withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON withdrawal_requests(status);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_created_at ON withdrawal_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_approved_at ON withdrawal_requests(approved_at);

-- updated_at 트리거 생성
DROP TRIGGER IF EXISTS update_withdrawal_requests_updated_at ON withdrawal_requests;
CREATE TRIGGER update_withdrawal_requests_updated_at 
    BEFORE UPDATE ON withdrawal_requests 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 시스템 설정 테이블
CREATE TABLE IF NOT EXISTS system_settings (
    key_name VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    type VARCHAR(20) NOT NULL DEFAULT 'string' CHECK (type IN ('string', 'number', 'boolean', 'json')),
    
    updated_by INTEGER,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- updated_at 트리거 생성
DROP TRIGGER IF EXISTS update_system_settings_updated_at ON system_settings;
CREATE TRIGGER update_system_settings_updated_at 
    BEFORE UPDATE ON system_settings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 기본 시스템 설정
INSERT INTO system_settings (key_name, value, description, type) VALUES
('point_to_cash_rate', '1.0', '포인트를 현금으로 환전할 때의 비율 (1포인트 = n원)', 'number'),
('min_withdrawal_points', '10000', '최소 출금 가능 포인트', 'number'),
('max_withdrawal_points', '1000000', '최대 출금 가능 포인트', 'number'),
('withdrawal_fee_rate', '0.03', '출금 수수료율 (3%)', 'number'),
('daily_withdrawal_limit', '500000', '일일 출금 한도 (원)', 'number'),
('referral_bonus_points', '1000', '추천인 보너스 포인트', 'number'),
('new_user_welcome_points', '500', '신규 회원 가입 축하 포인트', 'number')
ON CONFLICT (key_name) DO NOTHING;