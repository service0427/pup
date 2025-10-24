-- 포인트 시스템 관련 테이블 추가
-- 1. 포인트 요청 테이블 (총판 → 관리자)
-- 2. 포인트 잔액 테이블
-- 3. 포인트 거래 내역 테이블
-- 4. 작업 검수 테이블

-- ================================
-- 포인트 요청 테이블
-- ================================
CREATE TABLE IF NOT EXISTS point_requests (
    id SERIAL PRIMARY KEY,
    requester_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    requested_amount INTEGER NOT NULL CHECK (requested_amount > 0),
    purpose TEXT NOT NULL, -- 요청 목적
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),

    -- 승인/반려 정보
    reviewed_by INTEGER REFERENCES users(id),
    reviewed_at TIMESTAMP,
    review_notes TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_point_requests_requester ON point_requests(requester_id);
CREATE INDEX idx_point_requests_status ON point_requests(status);
CREATE INDEX idx_point_requests_created ON point_requests(created_at DESC);

-- ================================
-- 포인트 잔액 테이블
-- ================================
CREATE TABLE IF NOT EXISTS point_balances (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    available_points INTEGER NOT NULL DEFAULT 0 CHECK (available_points >= 0), -- 사용 가능 포인트
    pending_points INTEGER NOT NULL DEFAULT 0 CHECK (pending_points >= 0), -- 지급 예정 포인트 (검수 대기 중)
    total_earned INTEGER NOT NULL DEFAULT 0 CHECK (total_earned >= 0), -- 총 획득 포인트
    total_spent INTEGER NOT NULL DEFAULT 0 CHECK (total_spent >= 0), -- 총 사용 포인트

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_point_balances_user ON point_balances(user_id);

-- ================================
-- 포인트 거래 내역 테이블
-- ================================
CREATE TABLE IF NOT EXISTS point_transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('earn', 'spend', 'admin_add', 'admin_subtract', 'transfer')),
    amount INTEGER NOT NULL, -- 양수: 증가, 음수: 감소
    balance_before INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,

    -- 관련 정보
    related_work_id INTEGER REFERENCES work_requests(id),
    related_request_id INTEGER REFERENCES point_requests(id),
    description TEXT NOT NULL,

    -- 처리자 정보 (관리자가 직접 처리한 경우)
    processed_by INTEGER REFERENCES users(id),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_point_transactions_user ON point_transactions(user_id);
CREATE INDEX idx_point_transactions_type ON point_transactions(transaction_type);
CREATE INDEX idx_point_transactions_created ON point_transactions(created_at DESC);

-- ================================
-- 작업 검수 테이블
-- ================================
CREATE TABLE IF NOT EXISTS work_reviews (
    id SERIAL PRIMARY KEY,
    work_history_id INTEGER NOT NULL REFERENCES work_history(id) ON DELETE CASCADE,
    reviewer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
    review_notes TEXT,
    points_to_award INTEGER, -- 실제 지급할 포인트 (원래 포인트와 다를 수 있음)

    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_work_reviews_work_history ON work_reviews(work_history_id);
CREATE INDEX idx_work_reviews_reviewer ON work_reviews(reviewer_id);
CREATE INDEX idx_work_reviews_status ON work_reviews(status);

-- ================================
-- 트리거 함수 및 트리거 생성
-- ================================

-- updated_at 자동 업데이트 트리거
CREATE TRIGGER update_point_requests_updated_at BEFORE UPDATE ON point_requests
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_point_balances_updated_at BEFORE UPDATE ON point_balances
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_work_reviews_updated_at BEFORE UPDATE ON work_reviews
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================
-- 포인트 관리 함수들
-- ================================

-- 사용자 포인트 잔액 초기화 함수
CREATE OR REPLACE FUNCTION initialize_user_points(user_id_param INTEGER)
RETURNS VOID AS $$
BEGIN
    INSERT INTO point_balances (user_id, available_points, pending_points, total_earned, total_spent)
    VALUES (user_id_param, 0, 0, 0, 0)
    ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- 포인트 트랜잭션 생성 함수
CREATE OR REPLACE FUNCTION create_point_transaction(
    user_id_param INTEGER,
    transaction_type_param VARCHAR(20),
    amount_param INTEGER,
    description_param TEXT,
    related_work_id_param INTEGER DEFAULT NULL,
    related_request_id_param INTEGER DEFAULT NULL,
    processed_by_param INTEGER DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    current_balance INTEGER;
    new_balance INTEGER;
    transaction_id INTEGER;
BEGIN
    -- 현재 잔액 조회
    SELECT available_points INTO current_balance
    FROM point_balances
    WHERE user_id = user_id_param;

    -- 사용자 포인트 잔액이 없으면 초기화
    IF current_balance IS NULL THEN
        PERFORM initialize_user_points(user_id_param);
        current_balance := 0;
    END IF;

    new_balance := current_balance + amount_param;

    -- 잔액이 음수가 되는 것을 방지
    IF new_balance < 0 THEN
        RAISE EXCEPTION '포인트 잔액이 부족합니다. 현재: %, 요청: %', current_balance, amount_param;
    END IF;

    -- 포인트 잔액 업데이트
    UPDATE point_balances
    SET
        available_points = new_balance,
        total_earned = CASE WHEN amount_param > 0 THEN total_earned + amount_param ELSE total_earned END,
        total_spent = CASE WHEN amount_param < 0 THEN total_spent + ABS(amount_param) ELSE total_spent END,
        updated_at = CURRENT_TIMESTAMP
    WHERE user_id = user_id_param;

    -- 트랜잭션 기록 생성
    INSERT INTO point_transactions (
        user_id, transaction_type, amount, balance_before, balance_after,
        related_work_id, related_request_id, description, processed_by
    ) VALUES (
        user_id_param, transaction_type_param, amount_param, current_balance, new_balance,
        related_work_id_param, related_request_id_param, description_param, processed_by_param
    ) RETURNING id INTO transaction_id;

    RETURN transaction_id;
END;
$$ LANGUAGE plpgsql;

-- 기존 사용자들의 포인트 잔액 초기화
INSERT INTO point_balances (user_id, available_points, pending_points, total_earned, total_spent)
SELECT id, 0, 0, 0, 0
FROM users
ON CONFLICT (user_id) DO NOTHING;

-- 확인 쿼리
SELECT
    'point_requests' as table_name,
    COUNT(*) as row_count
FROM point_requests
UNION ALL
SELECT
    'point_balances' as table_name,
    COUNT(*) as row_count
FROM point_balances
UNION ALL
SELECT
    'point_transactions' as table_name,
    COUNT(*) as row_count
FROM point_transactions
UNION ALL
SELECT
    'work_reviews' as table_name,
    COUNT(*) as row_count
FROM work_reviews;