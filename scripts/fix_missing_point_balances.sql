-- 기존 사용자 중 point_balances가 없는 사용자에게 포인트 잔액 레코드 생성

INSERT INTO point_balances (user_id, available_points, pending_points, total_earned, total_spent)
SELECT
    u.id,
    0,
    0,
    0,
    0
FROM users u
LEFT JOIN point_balances pb ON u.id = pb.user_id
WHERE pb.user_id IS NULL
  AND u.role IN ('advertiser', 'writer', 'distributor');

-- 결과 확인
SELECT '✅ 포인트 잔액 레코드 생성 완료!' AS result;
SELECT
    u.username,
    u.name,
    u.role,
    COALESCE(pb.available_points, 0) AS available_points
FROM users u
LEFT JOIN point_balances pb ON u.id = pb.user_id
WHERE u.role IN ('advertiser', 'writer', 'distributor')
ORDER BY u.id;
