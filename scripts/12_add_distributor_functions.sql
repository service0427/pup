-- 총판 하위 광고주 유무 확인 관련 함수

-- 총판의 하위 광고주 개수 확인 함수
CREATE OR REPLACE FUNCTION get_subordinate_advertiser_count(distributor_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
    count_result INTEGER;
BEGIN
    -- 직접 하위 + 경로 기반 하위 모두 확인
    SELECT COUNT(*)
    INTO count_result
    FROM users
    WHERE role = 'advertiser'
      AND (
        parent_id = distributor_id
        OR path LIKE (
          SELECT path || '/%'
          FROM users
          WHERE id = distributor_id AND role = 'distributor'
        )
      );

    RETURN count_result;
END;
$$ LANGUAGE plpgsql;

-- 총판이 캠페인 생성 가능한지 확인하는 함수
CREATE OR REPLACE FUNCTION can_distributor_create_campaign(distributor_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    advertiser_count INTEGER;
    user_role TEXT;
BEGIN
    -- 사용자가 총판인지 확인
    SELECT role INTO user_role
    FROM users
    WHERE id = distributor_id;

    IF user_role != 'distributor' THEN
        RETURN FALSE;
    END IF;

    -- 하위 광고주 개수 확인
    SELECT get_subordinate_advertiser_count(distributor_id) INTO advertiser_count;

    -- 하위 광고주가 없으면 캠페인 생성 가능
    RETURN advertiser_count = 0;
END;
$$ LANGUAGE plpgsql;

-- 총판의 하위 광고주 목록 조회 함수
CREATE OR REPLACE FUNCTION get_subordinate_advertisers(distributor_id INTEGER)
RETURNS TABLE (
    id INTEGER,
    username TEXT,
    name TEXT,
    role TEXT,
    status TEXT,
    tier_level INTEGER,
    parent_id INTEGER,
    path TEXT,
    created_at TIMESTAMP,
    last_login_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        u.id,
        u.username,
        u.name,
        u.role,
        u.status,
        u.tier_level,
        u.parent_id,
        u.path,
        u.created_at,
        u.last_login_at
    FROM users u
    WHERE u.role = 'advertiser'
      AND (
        u.parent_id = distributor_id
        OR u.path LIKE (
          SELECT us.path || '/%'
          FROM users us
          WHERE us.id = distributor_id AND us.role = 'distributor'
        )
      )
    ORDER BY u.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- 총판별 비즈니스 규칙 요약 뷰
CREATE OR REPLACE VIEW distributor_business_rules AS
SELECT
    u.id as distributor_id,
    u.username,
    u.name,
    u.status,
    get_subordinate_advertiser_count(u.id) as subordinate_advertiser_count,
    can_distributor_create_campaign(u.id) as can_create_campaign,
    -- 포인트 정보
    COALESCE(pb.available_points, 0) as available_points,
    COALESCE(pb.total_earned, 0) as total_earned,
    -- 활성 포인트 요청 개수
    (
        SELECT COUNT(*)
        FROM point_requests pr
        WHERE pr.requester_id = u.id AND pr.status = 'pending'
    ) as pending_point_requests
FROM users u
LEFT JOIN point_balances pb ON u.id = pb.user_id
WHERE u.role = 'distributor' AND u.status = 'active';

-- 함수들 테스트
SELECT
    'Function Test Results' as test_category,
    get_subordinate_advertiser_count(8) as dist_8_adv_count,
    can_distributor_create_campaign(8) as dist_8_can_create,
    get_subordinate_advertiser_count(9) as dist_9_adv_count,
    can_distributor_create_campaign(9) as dist_9_can_create;

-- 총판 비즈니스 규칙 요약 확인
SELECT * FROM distributor_business_rules;