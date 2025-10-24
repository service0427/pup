-- =====================================================
-- 04. 함수 및 프로시저 생성
-- =====================================================
-- 실행: psql -U tech_adr -d adr -f 04_create_functions.sql

-- =====================================================
-- 사용자 인증 함수
-- =====================================================
CREATE OR REPLACE FUNCTION authenticate_user(
    p_username VARCHAR,
    p_password VARCHAR
) RETURNS TABLE(
    user_id INT,
    username VARCHAR,
    name VARCHAR,
    role VARCHAR,
    status VARCHAR,
    success BOOLEAN,
    message VARCHAR
) AS $$
DECLARE
    v_user_record RECORD;
    v_password_match BOOLEAN;
BEGIN
    -- 사용자 조회
    SELECT * INTO v_user_record
    FROM users u
    WHERE u.username = p_username;

    -- 사용자가 없는 경우
    IF NOT FOUND THEN
        RETURN QUERY SELECT
            NULL::INT, NULL::VARCHAR, NULL::VARCHAR, NULL::VARCHAR,
            NULL::VARCHAR, FALSE, '사용자를 찾을 수 없습니다'::VARCHAR;
        RETURN;
    END IF;

    -- 계정이 잠긴 경우
    IF v_user_record.locked_until IS NOT NULL AND v_user_record.locked_until > CURRENT_TIMESTAMP THEN
        RETURN QUERY SELECT
            NULL::INT, NULL::VARCHAR, NULL::VARCHAR, NULL::VARCHAR,
            NULL::VARCHAR, FALSE, '계정이 잠겨있습니다'::VARCHAR;
        RETURN;
    END IF;

    -- 계정이 비활성 상태인 경우
    IF v_user_record.status != 'active' THEN
        RETURN QUERY SELECT
            NULL::INT, NULL::VARCHAR, NULL::VARCHAR, NULL::VARCHAR,
            NULL::VARCHAR, FALSE, '비활성 계정입니다'::VARCHAR;
        RETURN;
    END IF;

    -- 비밀번호 확인 (실제로는 bcrypt 비교가 필요하지만, 여기서는 단순 비교)
    -- 실제 구현시에는 pgcrypto extension의 crypt() 함수 사용
    v_password_match := v_user_record.password_hash = crypt(p_password, v_user_record.password_hash);

    IF v_password_match THEN
        -- 로그인 성공: last_login_at 업데이트, login_attempts 초기화
        UPDATE users
        SET last_login_at = CURRENT_TIMESTAMP,
            login_attempts = 0,
            locked_until = NULL
        WHERE id = v_user_record.id;

        RETURN QUERY SELECT
            v_user_record.id, v_user_record.username, v_user_record.name,
            v_user_record.role, v_user_record.status, TRUE, '로그인 성공'::VARCHAR;
    ELSE
        -- 로그인 실패: login_attempts 증가
        UPDATE users
        SET login_attempts = login_attempts + 1,
            locked_until = CASE
                WHEN login_attempts >= 4 THEN CURRENT_TIMESTAMP + INTERVAL '30 minutes'
                ELSE NULL
            END
        WHERE id = v_user_record.id;

        RETURN QUERY SELECT
            NULL::INT, NULL::VARCHAR, NULL::VARCHAR, NULL::VARCHAR,
            NULL::VARCHAR, FALSE, '비밀번호가 올바르지 않습니다'::VARCHAR;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 포인트 잔액 조회 함수
-- =====================================================
CREATE OR REPLACE FUNCTION get_user_point_balance(p_user_id INT)
RETURNS DECIMAL(12, 2) AS $$
DECLARE
    v_balance DECIMAL(12, 2);
BEGIN
    SELECT COALESCE(SUM(amount), 0) INTO v_balance
    FROM points
    WHERE user_id = p_user_id;

    RETURN v_balance;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 포인트 추가 함수
-- =====================================================
CREATE OR REPLACE FUNCTION add_points(
    p_user_id INT,
    p_amount DECIMAL(12, 2),
    p_type VARCHAR,
    p_description TEXT,
    p_reference_type VARCHAR DEFAULT NULL,
    p_reference_id INT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    v_current_balance DECIMAL(12, 2);
    v_new_balance DECIMAL(12, 2);
BEGIN
    -- 현재 잔액 조회
    v_current_balance := get_user_point_balance(p_user_id);
    v_new_balance := v_current_balance + p_amount;

    -- 잔액이 음수가 되는지 확인
    IF v_new_balance < 0 THEN
        RAISE EXCEPTION '포인트가 부족합니다. 현재 잔액: %', v_current_balance;
        RETURN FALSE;
    END IF;

    -- 포인트 기록 추가
    INSERT INTO points (
        user_id, amount, type, description,
        reference_type, reference_id, balance_after
    ) VALUES (
        p_user_id, p_amount, p_type, p_description,
        p_reference_type, p_reference_id, v_new_balance
    );

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 광고 통계 업데이트 함수
-- =====================================================
CREATE OR REPLACE FUNCTION update_ad_statistics(
    p_ad_id INT,
    p_clicks INT DEFAULT 0,
    p_impressions INT DEFAULT 0
) RETURNS VOID AS $$
DECLARE
    v_ad RECORD;
    v_cost DECIMAL(12, 2) := 0;
BEGIN
    -- 광고 정보 조회
    SELECT * INTO v_ad FROM advertisements WHERE id = p_ad_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION '광고를 찾을 수 없습니다: %', p_ad_id;
    END IF;

    -- 비용 계산
    IF p_clicks > 0 AND v_ad.cpc IS NOT NULL THEN
        v_cost := v_cost + (p_clicks * v_ad.cpc);
    END IF;

    IF p_impressions > 0 AND v_ad.cpm IS NOT NULL THEN
        v_cost := v_cost + (p_impressions * v_ad.cpm / 1000.0);
    END IF;

    -- 통계 업데이트
    UPDATE advertisements
    SET clicks = clicks + p_clicks,
        impressions = impressions + p_impressions,
        spent = spent + v_cost
    WHERE id = p_ad_id;

    -- 예산 초과시 광고 일시정지
    IF v_ad.budget IS NOT NULL AND (v_ad.spent + v_cost) >= v_ad.budget THEN
        UPDATE advertisements
        SET status = 'completed'
        WHERE id = p_ad_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 일일 통계 조회 함수
-- =====================================================
CREATE OR REPLACE FUNCTION get_daily_statistics(p_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE(
    stat_date DATE,
    new_users INT,
    active_ads INT,
    total_clicks INT,
    total_impressions INT,
    total_revenue DECIMAL(12, 2),
    total_points_earned DECIMAL(12, 2),
    total_points_spent DECIMAL(12, 2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p_date,
        (SELECT COUNT(*) FROM users WHERE DATE(created_at) = p_date)::INT,
        (SELECT COUNT(*) FROM advertisements WHERE status = 'active')::INT,
        (SELECT COALESCE(SUM(clicks), 0) FROM advertisements WHERE DATE(updated_at) = p_date)::INT,
        (SELECT COALESCE(SUM(impressions), 0) FROM advertisements WHERE DATE(updated_at) = p_date)::INT,
        (SELECT COALESCE(SUM(amount), 0) FROM transactions
         WHERE type IN ('deposit', 'ad_payment') AND DATE(created_at) = p_date),
        (SELECT COALESCE(SUM(amount), 0) FROM points
         WHERE type IN ('earned', 'bonus') AND amount > 0 AND DATE(created_at) = p_date),
        (SELECT COALESCE(ABS(SUM(amount)), 0) FROM points
         WHERE type = 'spent' AND amount < 0 AND DATE(created_at) = p_date);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 세션 생성 함수
-- =====================================================
CREATE OR REPLACE FUNCTION create_session(
    p_user_id INT,
    p_ip_address INET,
    p_user_agent TEXT,
    p_duration_hours INT DEFAULT 24
) RETURNS VARCHAR AS $$
DECLARE
    v_session_id VARCHAR;
BEGIN
    -- 세션 ID 생성
    v_session_id := uuid_generate_v4()::VARCHAR;

    -- 기존 세션 삭제
    DELETE FROM sessions WHERE user_id = p_user_id;

    -- 새 세션 생성
    INSERT INTO sessions (id, user_id, ip_address, user_agent, expires_at)
    VALUES (v_session_id, p_user_id, p_ip_address, p_user_agent,
            CURRENT_TIMESTAMP + (p_duration_hours || ' hours')::INTERVAL);

    RETURN v_session_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 세션 검증 함수
-- =====================================================
CREATE OR REPLACE FUNCTION validate_session(p_session_id VARCHAR)
RETURNS TABLE(
    user_id INT,
    username VARCHAR,
    name VARCHAR,
    role VARCHAR,
    valid BOOLEAN
) AS $$
DECLARE
    v_session RECORD;
    v_user RECORD;
BEGIN
    -- 세션 조회
    SELECT * INTO v_session FROM sessions WHERE id = p_session_id;

    IF NOT FOUND OR v_session.expires_at < CURRENT_TIMESTAMP THEN
        RETURN QUERY SELECT
            NULL::INT, NULL::VARCHAR, NULL::VARCHAR, NULL::VARCHAR, FALSE;
        RETURN;
    END IF;

    -- 사용자 정보 조회
    SELECT * INTO v_user FROM users WHERE id = v_session.user_id AND status = 'active';

    IF FOUND THEN
        -- 세션 업데이트 (활동 시간 연장)
        UPDATE sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = p_session_id;

        RETURN QUERY SELECT
            v_user.id, v_user.username, v_user.name, v_user.role, TRUE;
    ELSE
        RETURN QUERY SELECT
            NULL::INT, NULL::VARCHAR, NULL::VARCHAR, NULL::VARCHAR, FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 함수 생성 확인
-- =====================================================
\echo '================================='
\echo '함수 생성 완료'
\echo '================================='
\df