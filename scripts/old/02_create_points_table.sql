-- PostgreSQL용 Points 테이블 생성 (SERIAL 버전)

-- Points 테이블 생성
CREATE TABLE IF NOT EXISTS points (
    id BIGSERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    amount BIGINT NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('earn', 'spend', 'bonus', 'penalty', 'refund')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'cancelled')),
    category VARCHAR(30) NOT NULL CHECK (category IN ('ad_click', 'ad_view', 'registration', 'referral', 'daily_bonus', 'manual', 'withdrawal', 'purchase')),
    
    description TEXT,
    
    -- 처리 정보
    processed_by INTEGER,
    processed_at TIMESTAMP NULL,
    
    -- 관련 정보
    reference_id VARCHAR(100), -- 관련된 광고 ID, 거래 ID 등
    reference_type VARCHAR(50), -- 'ad', 'transaction', 'referral' 등
    
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
CREATE INDEX IF NOT EXISTS idx_points_user_id ON points(user_id);
CREATE INDEX IF NOT EXISTS idx_points_type ON points(type);
CREATE INDEX IF NOT EXISTS idx_points_status ON points(status);
CREATE INDEX IF NOT EXISTS idx_points_category ON points(category);
CREATE INDEX IF NOT EXISTS idx_points_reference ON points(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_points_created_at ON points(created_at);
CREATE INDEX IF NOT EXISTS idx_points_processed_at ON points(processed_at);

-- updated_at 트리거 생성
DROP TRIGGER IF EXISTS update_points_updated_at ON points;
CREATE TRIGGER update_points_updated_at 
    BEFORE UPDATE ON points 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 포인트 잔액 집계 테이블 (성능 최적화용)
CREATE TABLE IF NOT EXISTS user_point_balances (
    user_id INTEGER PRIMARY KEY,
    total_earned BIGINT NOT NULL DEFAULT 0,
    total_spent BIGINT NOT NULL DEFAULT 0,
    current_balance BIGINT NOT NULL DEFAULT 0,
    pending_points BIGINT NOT NULL DEFAULT 0,
    last_transaction_at TIMESTAMP NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- updated_at 트리거 생성
DROP TRIGGER IF EXISTS update_user_point_balances_updated_at ON user_point_balances;
CREATE TRIGGER update_user_point_balances_updated_at 
    BEFORE UPDATE ON user_point_balances 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 포인트 통계 테이블 (일일/월별)
CREATE TABLE IF NOT EXISTS point_statistics (
    id BIGSERIAL PRIMARY KEY,
    date DATE NOT NULL,
    period_type VARCHAR(20) NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly')),
    
    total_earned BIGINT NOT NULL DEFAULT 0,
    total_spent BIGINT NOT NULL DEFAULT 0,
    total_users_earned INTEGER NOT NULL DEFAULT 0,
    total_users_spent INTEGER NOT NULL DEFAULT 0,
    
    -- 카테고리별 통계
    ad_click_earnings BIGINT NOT NULL DEFAULT 0,
    ad_view_earnings BIGINT NOT NULL DEFAULT 0,
    referral_earnings BIGINT NOT NULL DEFAULT 0,
    bonus_earnings BIGINT NOT NULL DEFAULT 0,
    
    withdrawal_amount BIGINT NOT NULL DEFAULT 0,
    purchase_amount BIGINT NOT NULL DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE (date, period_type)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_point_statistics_date ON point_statistics(date);
CREATE INDEX IF NOT EXISTS idx_point_statistics_period_type ON point_statistics(period_type);

-- 포인트 업데이트 시 잔액 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_user_point_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- 새로운 포인트 거래가 완료되었을 때만 잔액 업데이트
    IF NEW.status = 'completed' AND (OLD IS NULL OR OLD.status != 'completed') THEN
        INSERT INTO user_point_balances (user_id, current_balance, total_earned, total_spent, last_transaction_at)
        VALUES (
            NEW.user_id,
            CASE WHEN NEW.amount > 0 THEN NEW.amount ELSE 0 END,
            CASE WHEN NEW.amount > 0 THEN NEW.amount ELSE 0 END,
            CASE WHEN NEW.amount < 0 THEN ABS(NEW.amount) ELSE 0 END,
            NEW.created_at
        )
        ON CONFLICT (user_id) 
        DO UPDATE SET
            current_balance = user_point_balances.current_balance + NEW.amount,
            total_earned = user_point_balances.total_earned + CASE WHEN NEW.amount > 0 THEN NEW.amount ELSE 0 END,
            total_spent = user_point_balances.total_spent + CASE WHEN NEW.amount < 0 THEN ABS(NEW.amount) ELSE 0 END,
            last_transaction_at = NEW.created_at,
            updated_at = CURRENT_TIMESTAMP;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 포인트 잔액 업데이트 트리거
DROP TRIGGER IF EXISTS trigger_update_user_point_balance ON points;
CREATE TRIGGER trigger_update_user_point_balance
    AFTER INSERT OR UPDATE ON points
    FOR EACH ROW
    EXECUTE FUNCTION update_user_point_balance();