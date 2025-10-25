-- 포인트 관련 필수 함수 추가

-- 1. get_user_point_balance - 사용자 포인트 잔액 조회
CREATE OR REPLACE FUNCTION get_user_point_balance(p_user_id INTEGER)
RETURNS NUMERIC
LANGUAGE plpgsql
AS $function$
DECLARE
    v_balance NUMERIC;
BEGIN
    SELECT available_points INTO v_balance
    FROM point_balances
    WHERE user_id = p_user_id;

    RETURN COALESCE(v_balance, 0);
END;
$function$;

-- 2. get_subordinates - 하위 사용자 조회 (users.ts에서 사용)
CREATE OR REPLACE FUNCTION get_subordinates(user_id INTEGER)
RETURNS TABLE(
    id INTEGER,
    username VARCHAR,
    name VARCHAR,
    role VARCHAR,
    tier_level INTEGER,
    direct_subordinate BOOLEAN,
    total_subordinates BIGINT
)
LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        u.id,
        u.username,
        u.name,
        u.role,
        u.tier_level,
        (u.parent_id = user_id) AS direct_subordinate,
        COUNT(*)::BIGINT AS total_subordinates
    FROM users u
    WHERE u.parent_id = user_id
       OR u.path LIKE (SELECT path || '/%' FROM users WHERE id = user_id)
    GROUP BY u.id, u.username, u.name, u.role, u.tier_level, u.parent_id;
END;
$function$;

-- 완료
SELECT '✅ 포인트 함수 추가 완료!' AS result;
