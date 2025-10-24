-- =====================================================
-- 03. 초기 데이터 입력
-- =====================================================
-- 실행: psql -U tech_adr -d adr -f 03_insert_initial_data.sql

-- =====================================================
-- 관리자 계정 생성
-- =====================================================
-- 비밀번호: admin123 (bcrypt 해시)
INSERT INTO users (username, password_hash, name, role, status) VALUES
('admin', '$2a$10$YKvM3PMlp1b6dOSJBjYpBuOgHCj1BbOvYrX.kqTYLgkLaGdKKKxEO', '최고관리자', 'admin', 'active'),
('operator1', '$2a$10$YKvM3PMlp1b6dOSJBjYpBuOgHCj1BbOvYrX.kqTYLgkLaGdKKKxEO', '운영자1', 'operator', 'active');

-- =====================================================
-- 테스트 사용자 생성
-- =====================================================
-- 모든 테스트 사용자 비밀번호: test123
INSERT INTO users (username, password_hash, name, role, status, metadata) VALUES
('user001', '$2a$10$IZKjF5bAYz.Y0Xp6tg8cVOQzYzoS8sYv8zFxQ1K.fzYlqYqW3mUPa', '김철수', 'user', 'active', '{"phone": "010-1234-5678", "email": "kim@example.com"}'),
('user002', '$2a$10$IZKjF5bAYz.Y0Xp6tg8cVOQzYzoS8sYv8zFxQ1K.fzYlqYqW3mUPa', '이영희', 'user', 'active', '{"phone": "010-2345-6789", "email": "lee@example.com"}'),
('user003', '$2a$10$IZKjF5bAYz.Y0Xp6tg8cVOQzYzoS8sYv8zFxQ1K.fzYlqYqW3mUPa', '박민수', 'user', 'active', '{"phone": "010-3456-7890", "email": "park@example.com"}'),
('user004', '$2a$10$IZKjF5bAYz.Y0Xp6tg8cVOQzYzoS8sYv8zFxQ1K.fzYlqYqW3mUPa', '최지현', 'user', 'inactive', '{"phone": "010-4567-8901", "email": "choi@example.com"}'),
('user005', '$2a$10$IZKjF5bAYz.Y0Xp6tg8cVOQzYzoS8sYv8zFxQ1K.fzYlqYqW3mUPa', '정대한', 'user', 'active', '{"phone": "010-5678-9012", "email": "jung@example.com"}');

-- =====================================================
-- 초기 포인트 지급
-- =====================================================
INSERT INTO points (user_id, amount, type, description, balance_after) VALUES
(3, 10000, 'bonus', '신규 가입 보너스', 10000),
(4, 10000, 'bonus', '신규 가입 보너스', 10000),
(5, 10000, 'bonus', '신규 가입 보너스', 10000),
(3, 5000, 'earned', '광고 시청 수익', 15000),
(3, -2000, 'spent', '광고 등록 비용', 13000),
(4, 3000, 'earned', '광고 클릭 수익', 13000),
(5, 1500, 'earned', '광고 시청 수익', 11500);

-- =====================================================
-- 샘플 광고 데이터
-- =====================================================
INSERT INTO advertisements (user_id, title, description, url, type, status, budget, cpc, cpm, clicks, impressions) VALUES
(3, '새로운 쇼핑몰 오픈', '최대 50% 할인 이벤트 진행중!', 'https://example.com/shop', 'banner', 'active', 50000, 100, 10, 125, 5230),
(3, '무료 배송 이벤트', '3만원 이상 구매시 무료배송', 'https://example.com/event', 'popup', 'active', 30000, 150, 15, 89, 3456),
(4, '게임 사전예약', '신작 모바일 게임 사전예약 받습니다', 'https://example.com/game', 'video', 'active', 100000, 200, 20, 234, 8901),
(5, '부동산 투자 상담', '전문가의 1:1 맞춤 상담', 'https://example.com/realestate', 'native', 'paused', 75000, 300, 25, 56, 2345),
(3, '여름 휴가 특가', '해외여행 패키지 최대 40% 할인', 'https://example.com/travel', 'banner', 'completed', 40000, 120, 12, 167, 6789);

-- =====================================================
-- 샘플 거래 내역
-- =====================================================
INSERT INTO transactions (user_id, type, amount, status, payment_method, description) VALUES
(3, 'deposit', 50000, 'completed', 'bank_transfer', '계좌 입금'),
(3, 'ad_payment', -10000, 'completed', 'points', '광고 비용 결제'),
(4, 'deposit', 30000, 'completed', 'credit_card', '카드 충전'),
(5, 'ad_earning', 5000, 'completed', 'system', '광고 수익 정산'),
(3, 'withdrawal', -20000, 'processing', 'bank_transfer', '출금 요청');

-- =====================================================
-- 로그인 기록 샘플
-- =====================================================
INSERT INTO login_logs (user_id, username, ip_address, user_agent, success) VALUES
(1, 'admin', '127.0.0.1', 'Mozilla/5.0 Chrome/91.0', true),
(3, 'user001', '192.168.1.100', 'Mozilla/5.0 Chrome/91.0', true),
(4, 'user002', '192.168.1.101', 'Mozilla/5.0 Firefox/89.0', true),
(NULL, 'unknown', '192.168.1.200', 'Mozilla/5.0 Chrome/91.0', false),
(3, 'user001', '192.168.1.100', 'Mozilla/5.0 Chrome/91.0', false);

-- =====================================================
-- 데이터 입력 확인
-- =====================================================
\echo '================================='
\echo '초기 데이터 입력 완료'
\echo '================================='
\echo ''
\echo '관리자 계정:'
\echo '  - admin / admin123'
\echo '  - operator1 / admin123'
\echo ''
\echo '테스트 사용자:'
\echo '  - user001~005 / test123'
\echo '================================='

-- 데이터 확인
SELECT 'Users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'Points', COUNT(*) FROM points
UNION ALL
SELECT 'Advertisements', COUNT(*) FROM advertisements
UNION ALL
SELECT 'Transactions', COUNT(*) FROM transactions
UNION ALL
SELECT 'Login Logs', COUNT(*) FROM login_logs;