-- 운영 서버에 부족한 테이블 및 뷰 추가
-- 실행: psql -U pup_user -d place_up -f add_missing_tables.sql

-- 1. place_blogs 테이블
CREATE TABLE IF NOT EXISTS place_blogs (
    id SERIAL PRIMARY KEY,
    place_id INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT place_blogs_place_id_fkey FOREIGN KEY (place_id)
        REFERENCES places(id) ON DELETE CASCADE
);

-- 2. place_traffic 테이블
CREATE TABLE IF NOT EXISTS place_traffic (
    id SERIAL PRIMARY KEY,
    place_id INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT place_traffic_place_id_fkey FOREIGN KEY (place_id)
        REFERENCES places(id) ON DELETE CASCADE
);

-- 3. get_subordinate_advertiser_count 함수
CREATE OR REPLACE FUNCTION get_subordinate_advertiser_count(distributor_id INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
AS $function$
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
$function$;

-- 4. can_distributor_create_campaign 함수
CREATE OR REPLACE FUNCTION can_distributor_create_campaign(distributor_id INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $function$
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
$function$;

-- 5. distributor_business_rules 뷰
CREATE OR REPLACE VIEW distributor_business_rules AS
SELECT
    u.id AS distributor_id,
    u.username,
    u.name,
    u.status,
    get_subordinate_advertiser_count(u.id) AS subordinate_advertiser_count,
    can_distributor_create_campaign(u.id) AS can_create_campaign,
    COALESCE(pb.available_points, 0) AS available_points,
    COALESCE(pb.total_earned, 0) AS total_earned,
    (
        SELECT COUNT(*)
        FROM point_requests pr
        WHERE pr.requester_id = u.id AND pr.status = 'pending'
    ) AS pending_point_requests
FROM users u
LEFT JOIN point_balances pb ON u.id = pb.user_id
WHERE u.role = 'distributor' AND u.status = 'active';

-- 완료 메시지
SELECT '✅ 모든 테이블, 함수, 뷰가 성공적으로 생성되었습니다!' AS result;
