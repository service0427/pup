-- ================================
-- ADR 샘플 데이터
-- 테스트 및 개발 환경용
-- ================================

-- 사용자 샘플 데이터
-- 비밀번호는 모두 'password123!' (해시값 필요)
INSERT INTO users (username, email, password, name, phone, role, status) VALUES
('admin', 'admin@adr.com', '$2a$10$k7WXXpv4vTklpzkBGGxste0ygDBAX9fThKNlHdFcPYnJlBQ6c7MRe', '관리자', '010-1111-1111', 'admin', 'active'),
('dist01', 'dist01@adr.com', '$2a$10$k7WXXpv4vTklpzkBGGxste0ygDBAX9fThKNlHdFcPYnJlBQ6c7MRe', '총판1', '010-2222-2222', 'distributor', 'active'),
('adv01', 'adv01@adr.com', '$2a$10$k7WXXpv4vTklpzkBGGxste0ygDBAX9fThKNlHdFcPYnJlBQ6c7MRe', '광고주1', '010-3333-3333', 'advertiser', 'active'),
('writer01', 'writer01@adr.com', '$2a$10$k7WXXpv4vTklpzkBGGxste0ygDBAX9fThKNlHdFcPYnJlBQ6c7MRe', '작성자1', '010-4444-4444', 'writer', 'active'),
('writer02', 'writer02@adr.com', '$2a$10$k7WXXpv4vTklpzkBGGxste0ygDBAX9fThKNlHdFcPYnJlBQ6c7MRe', '작성자2', '010-5555-5555', 'writer', 'active')
ON CONFLICT (username) DO NOTHING;

-- 계층 구조 설정
UPDATE users SET parent_id = (SELECT id FROM users WHERE username = 'admin') WHERE username = 'dist01';
UPDATE users SET parent_id = (SELECT id FROM users WHERE username = 'dist01') WHERE username = 'adv01';
UPDATE users SET parent_id = (SELECT id FROM users WHERE username = 'adv01') WHERE username IN ('writer01', 'writer02');

-- 영수증 샘플 데이터
INSERT INTO receipts (
    user_id, business_name, business_number, address, phone,
    receipt_date, amount, tax_amount, payment_method, receipt_number,
    main_keyword, sub_keywords, verification_status
) VALUES
(
    (SELECT id FROM users WHERE username = 'writer01'),
    '스타벅스 강남점', '123-45-67890', '서울시 강남구 테헤란로 123', '02-1234-5678',
    '2024-01-20', 8500, 850, '카드', 'RCP2024012001',
    '스타벅스', ARRAY['커피', '카페', '강남'],
    'verified'
),
(
    (SELECT id FROM users WHERE username = 'writer02'),
    '맥도날드 서초점', '234-56-78901', '서울시 서초구 서초대로 456', '02-2345-6789',
    '2024-01-21', 12000, 1200, '카드', 'RCP2024012101',
    '맥도날드', ARRAY['햄버거', '패스트푸드', '서초'],
    'verified'
),
(
    (SELECT id FROM users WHERE username = 'writer01'),
    '김밥천국 역삼점', '345-67-89012', '서울시 강남구 역삼로 789', '02-3456-7890',
    '2024-01-22', 7000, 700, '현금', 'RCP2024012201',
    '김밥천국', ARRAY['분식', '김밥', '역삼'],
    'pending'
);

-- 작업 요청 샘플 데이터
INSERT INTO work_requests (
    type, title, description, receipt_id,
    keywords, guidelines, point_value,
    status, expires_at, created_by
) VALUES
(
    'receipt_review',
    '스타벅스 강남점 리뷰',
    '스타벅스 강남점 방문 후기를 작성해주세요',
    (SELECT id FROM receipts WHERE business_name = '스타벅스 강남점' LIMIT 1),
    ARRAY['스타벅스', '강남', '커피', '카페'],
    '매장 분위기, 음료 맛, 서비스 품질을 중심으로 최소 300자 이상 작성해주세요. 사진 3장 이상 포함 필수입니다.',
    500,
    'available',
    NOW() + INTERVAL '7 days',
    (SELECT id FROM users WHERE username = 'admin')
),
(
    'blog_post',
    '2024 봄 나들이 장소 추천',
    '봄철 나들이 장소 BEST 5를 소개하는 블로그 포스팅',
    NULL,
    ARRAY['봄나들이', '여행', '추천장소', '봄꽃'],
    '각 장소별 특징, 위치, 추천 이유를 상세히 작성해주세요. 1000자 이상, 사진 5장 이상 포함 필수입니다.',
    1000,
    'available',
    NOW() + INTERVAL '5 days',
    (SELECT id FROM users WHERE username = 'admin')
),
(
    'receipt_review',
    '맥도날드 서초점 리뷰',
    '맥도날드 서초점 방문 후기를 작성해주세요',
    (SELECT id FROM receipts WHERE business_name = '맥도날드 서초점' LIMIT 1),
    ARRAY['맥도날드', '서초', '햄버거', '패스트푸드'],
    '메뉴 맛, 매장 청결도, 주문 시스템을 중심으로 최소 200자 이상 작성해주세요.',
    400,
    'available',
    NOW() + INTERVAL '3 days',
    (SELECT id FROM users WHERE username = 'admin')
),
(
    'blog_post',
    '재택근무 생산성 높이는 팁',
    '재택근무 효율을 높이는 10가지 방법',
    NULL,
    ARRAY['재택근무', '생산성', '업무효율', '홈오피스'],
    '실제 경험을 바탕으로 구체적인 팁을 제공해주세요. 800자 이상 작성 필수입니다.',
    800,
    'available',
    NOW() + INTERVAL '10 days',
    (SELECT id FROM users WHERE username = 'admin')
);

-- 리뷰 샘플 데이터
INSERT INTO receipt_reviews (
    receipt_id, user_id, blog_url, review_title, review_content,
    rating, review_status, points_earned
) VALUES
(
    (SELECT id FROM receipts WHERE business_name = '스타벅스 강남점' LIMIT 1),
    (SELECT id FROM users WHERE username = 'writer01'),
    'https://blog.naver.com/example/12345',
    '스타벅스 강남점 아메리카노 리뷰',
    '강남역 근처에 위치한 스타벅스 강남점을 방문했습니다. 매장이 넓고 쾌적했으며...',
    4,
    'approved',
    500
),
(
    (SELECT id FROM receipts WHERE business_name = '맥도날드 서초점' LIMIT 1),
    (SELECT id FROM users WHERE username = 'writer02'),
    'https://blog.naver.com/example/67890',
    '맥도날드 서초점 빅맥세트 후기',
    '점심시간에 맥도날드 서초점을 방문했습니다. 주문은 키오스크로 편리하게...',
    5,
    'pending',
    0
);

-- 작업 이력 샘플 데이터 (완료된 작업)
INSERT INTO work_history (
    work_id, user_id, status, assigned_at, expires_at, completed_at,
    review_url, points_earned
)
SELECT
    wr.id,
    (SELECT id FROM users WHERE username = 'writer01'),
    'completed',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day',
    'https://blog.naver.com/example/completed1',
    500
FROM work_requests wr
WHERE wr.title = '스타벅스 강남점 리뷰'
LIMIT 1;

-- work_requests 상태 업데이트 (위 작업 이력과 연동)
UPDATE work_requests
SET status = 'completed', completed_at = NOW() - INTERVAL '1 day'
WHERE title = '스타벅스 강남점 리뷰'
AND EXISTS (
    SELECT 1 FROM work_history wh
    WHERE wh.work_id = work_requests.id
    AND wh.status = 'completed'
);

-- 통계 확인용 뷰
-- 작업 통계
SELECT
    'Total Works' as metric,
    COUNT(*) as count
FROM work_requests
UNION ALL
SELECT
    'Available Works',
    COUNT(*)
FROM work_requests
WHERE status = 'available'
UNION ALL
SELECT
    'Completed Works',
    COUNT(*)
FROM work_requests
WHERE status = 'completed';

-- 사용자별 포인트 통계
SELECT
    u.username,
    u.role,
    COALESCE(SUM(wh.points_earned), 0) as total_points
FROM users u
LEFT JOIN work_history wh ON u.id = wh.user_id
WHERE u.role = 'writer'
GROUP BY u.id, u.username, u.role
ORDER BY total_points DESC;