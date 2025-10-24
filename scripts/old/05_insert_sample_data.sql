-- 샘플 사용자 데이터 추가
INSERT INTO users (
    email, username, password_hash, full_name, role, status, level, points, referral_code, phone
) VALUES 
-- 관리자
('admin@adr.com', 'admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'System Administrator', 'admin', 'active', 99, 1000000, 'ADR_ADMIN', '010-1234-5678'),

-- 매니저
('manager@adr.com', 'manager', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Service Manager', 'manager', 'active', 50, 500000, 'ADR_MGR', '010-2345-6789'),

-- 일반 사용자들
('user1@example.com', 'user1', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '김철수', 'user', 'active', 5, 15000, 'USR001', '010-3456-7890'),
('user2@example.com', 'user2', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '이영희', 'user', 'active', 3, 8500, 'USR002', '010-4567-8901'),
('user3@example.com', 'user3', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '박민수', 'user', 'active', 7, 23400, 'USR003', '010-5678-9012'),
('user4@example.com', 'user4', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '정수현', 'user', 'suspended', 2, 1200, 'USR004', '010-6789-0123'),

-- 게스트
('guest@example.com', 'guest', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Guest User', 'guest', 'pending', 0, 0, 'GUEST01', NULL);

-- 사용자 포인트 잔액 초기화
INSERT INTO user_point_balances (user_id, total_earned, total_spent, current_balance, pending_points) VALUES
(1, 1000000, 0, 1000000, 0),
(2, 500000, 0, 500000, 0),
(3, 18000, 3000, 15000, 500),
(4, 10000, 1500, 8500, 200),
(5, 25000, 1600, 23400, 800),
(6, 2000, 800, 1200, 0),
(7, 0, 0, 0, 0);

-- 샘플 광고 데이터
INSERT INTO advertisements (
    advertiser_id, title, description, url, image_url, type, status, category,
    points_per_action, daily_budget, total_budget, used_budget, 
    view_count, click_count, conversion_count,
    start_date, end_date, approved_by
) VALUES
(2, '🔥 여름 대세일! 최대 70% 할인', '여름 맞이 특가 세일! 의류, 신발, 가방까지 모든 상품이 최대 70% 할인! 놓치면 후회하는 기회입니다.', 'https://shop.example.com/summer-sale', 'https://via.placeholder.com/300x200?text=Summer+Sale', 'banner', 'active', '쇼핑', 100, 50000, 500000, 123000, 15678, 1234, 89, '2024-07-01 00:00:00', '2024-08-31 23:59:59', 1),

(2, '🎮 신규 RPG 게임 출시!', '환상적인 그래픽과 몰입감 넘치는 스토리! 지금 다운로드하면 특별 아이템 증정! 친구들과 함께 모험을 떠나세요.', 'https://game.example.com/new-rpg', 'https://via.placeholder.com/300x200?text=New+RPG+Game', 'video', 'active', '게임', 150, 30000, 300000, 45000, 8901, 567, 234, '2024-08-01 00:00:00', '2024-12-31 23:59:59', 1),

(3, '💳 신용카드 신규 발급 이벤트', '연회비 평생 무료! 신규 발급 시 10만원 상당의 적립금 지급! 해외 결제 수수료도 면제! 지금 바로 신청하세요.', 'https://card.example.com/new-card', 'https://via.placeholder.com/300x200?text=Credit+Card', 'popup', 'active', '금융', 200, 40000, 400000, 67000, 12345, 890, 45, '2024-06-01 00:00:00', '2024-09-30 23:59:59', 1),

(3, '✈️ 제주도 여행 패키지', '항공료, 숙박, 렌터카까지! 제주도 3박 4일 완전정복 패키지! 한라산, 성산일출봉, 우도까지 모든 명소를 경험하세요.', 'https://travel.example.com/jeju-package', 'https://via.placeholder.com/300x200?text=Jeju+Travel', 'banner', 'paused', '여행', 120, 25000, 250000, 89000, 6543, 432, 21, '2024-05-01 00:00:00', '2024-10-31 23:59:59', 1),

(4, '📚 온라인 강의 수강생 모집', 'IT 전문가가 되는 지름길! Python, JavaScript, React 등 실무 중심 커리큘럼! 수료 후 취업까지 보장!', 'https://edu.example.com/it-course', 'https://via.placeholder.com/300x200?text=Online+Course', 'text', 'pending', '교육', 180, 35000, 350000, 0, 0, 0, 0, '2024-09-01 00:00:00', '2024-11-30 23:59:59', NULL);

-- 샘플 포인트 거래 내역
INSERT INTO points (
    user_id, amount, type, status, category, description, reference_id, reference_type
) VALUES
-- 사용자1 거래내역
(3, 100, 'earn', 'completed', 'ad_click', '광고 클릭 보상', '1', 'advertisement'),
(3, 50, 'earn', 'completed', 'ad_view', '광고 조회 보상', '2', 'advertisement'),
(3, 1000, 'earn', 'completed', 'registration', '회원 가입 축하 보너스', NULL, 'system'),
(3, -2000, 'spend', 'completed', 'withdrawal', '포인트 출금', '1', 'withdrawal'),
(3, 500, 'earn', 'pending', 'referral', '친구 추천 보상', '7', 'user'),

-- 사용자2 거래내역  
(4, 150, 'earn', 'completed', 'ad_click', '광고 클릭 보상', '3', 'advertisement'),
(4, 1000, 'earn', 'completed', 'registration', '회원 가입 축하 보너스', NULL, 'system'),
(4, 200, 'earn', 'pending', 'daily_bonus', '일일 출석 보너스', NULL, 'system'),

-- 사용자3 거래내역
(5, 200, 'earn', 'completed', 'ad_click', '광고 클릭 보상', '1', 'advertisement'),
(5, 100, 'earn', 'completed', 'ad_click', '광고 클릭 보상', '2', 'advertisement'),
(5, 1000, 'earn', 'completed', 'registration', '회원 가입 축하 보너스', NULL, 'system'),
(5, 800, 'earn', 'pending', 'manual', '특별 이벤트 보너스', NULL, 'event');

-- 광고 상호작용 로그
INSERT INTO ad_interactions (
    ad_id, user_id, interaction_type, points_earned, ip_address
) VALUES
(1, 3, 'view', 0, '192.168.1.100'),
(1, 3, 'click', 100, '192.168.1.100'),
(1, 5, 'view', 0, '192.168.1.101'),
(1, 5, 'click', 200, '192.168.1.101'),

(2, 3, 'view', 50, '192.168.1.100'),
(2, 4, 'view', 0, '192.168.1.102'),
(2, 5, 'view', 0, '192.168.1.101'),
(2, 5, 'click', 100, '192.168.1.101'),

(3, 4, 'view', 0, '192.168.1.102'),
(3, 4, 'click', 150, '192.168.1.102'),
(3, 4, 'conversion', 0, '192.168.1.102');

-- 출금 신청 샘플
INSERT INTO withdrawal_requests (
    user_id, points_amount, cash_amount, exchange_rate, 
    bank_name, account_number, account_holder, status
) VALUES
(3, 2000, 2000, 1.0000, '국민은행', '123-456-789012', '김철수', 'completed'),
(4, 1500, 1455, 0.9700, '신한은행', '987-654-321098', '이영희', 'pending');

-- 사용자 활동 로그
INSERT INTO user_activity_logs (
    user_id, action, description, ip_address
) VALUES
(1, 'login', '관리자 로그인', '192.168.1.10'),
(2, 'login', '매니저 로그인', '192.168.1.20'),
(3, 'login', '사용자 로그인', '192.168.1.100'),
(3, 'ad_click', '광고 클릭: 여름 대세일', '192.168.1.100'),
(4, 'login', '사용자 로그인', '192.168.1.102'),
(4, 'withdrawal_request', '포인트 출금 신청: 1500P', '192.168.1.102'),
(5, 'register', '신규 회원 가입', '192.168.1.101');

-- 일별 광고 통계 (샘플)
INSERT INTO ad_daily_stats (
    ad_id, date, views, clicks, conversions, spend, unique_users, ctr, cvr, cpc
) VALUES
(1, '2024-09-01', 1500, 120, 8, 12000, 98, 0.0800, 0.0667, 100.00),
(1, '2024-09-02', 1800, 145, 12, 14500, 118, 0.0806, 0.0828, 100.00),
(2, '2024-09-01', 900, 45, 18, 6750, 42, 0.0500, 0.4000, 150.00),
(3, '2024-09-01', 1200, 67, 5, 13400, 61, 0.0558, 0.0746, 200.00);