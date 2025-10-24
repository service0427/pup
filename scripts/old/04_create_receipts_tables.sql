-- =====================================================
-- 04. 영수증 관리 테이블 생성
-- =====================================================
-- 실행: PGPASSWORD='Tech1324!db' psql -U tech_adr -d adr -f scripts/04_create_receipts_tables.sql

SET TIMEZONE TO 'Asia/Seoul';

-- =====================================================
-- 영수증 테이블
-- =====================================================
CREATE TABLE IF NOT EXISTS receipts (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_id VARCHAR(50) NOT NULL, -- cmc_team2, pol 등
    business_name VARCHAR(200) NOT NULL, -- 업체명
    place_url TEXT, -- 플레이스 URL
    place_type VARCHAR(50) CHECK (place_type IN ('포스트플랜트형', '딜라이트형')),

    -- 업로드 상태 (동록/미동록)
    menu_status VARCHAR(20) DEFAULT '미동록',
    hours_status VARCHAR(20) DEFAULT '미동록',
    intro_status VARCHAR(20) DEFAULT '미동록',
    print_status VARCHAR(20) DEFAULT '미인쇄',

    -- 발행 관련
    daily_issued INT DEFAULT 0,
    daily_limit INT DEFAULT 0,
    total_issued INT DEFAULT 0,
    total_limit INT DEFAULT 0,
    remaining_ids INT DEFAULT 0,

    -- 기간
    start_date DATE,
    end_date DATE,

    -- 기타
    remark TEXT, -- 비고 (일 발행한도를 확인해주세요 등)
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'completed')),

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX idx_receipts_user_id ON receipts(user_id);
CREATE INDEX idx_receipts_account_id ON receipts(account_id);
CREATE INDEX idx_receipts_business_name ON receipts(business_name);
CREATE INDEX idx_receipts_status ON receipts(status);
CREATE INDEX idx_receipts_start_date ON receipts(start_date);
CREATE INDEX idx_receipts_end_date ON receipts(end_date);

-- =====================================================
-- 영수증 리뷰 테이블
-- =====================================================
CREATE TABLE IF NOT EXISTS receipt_reviews (
    id SERIAL PRIMARY KEY,
    receipt_id INT NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
    advertiser_name VARCHAR(200), -- 광고주명
    review_content TEXT, -- 게시물 내용
    review_url TEXT, -- 게시물 주소 (네이버 플레이스 URL)
    review_date TIMESTAMPTZ, -- 리뷰 작성 일시
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'deleted', 'pending')),

    -- 삭제 요청 관련
    delete_requested BOOLEAN DEFAULT false,
    delete_request_date TIMESTAMPTZ,
    delete_request_reason TEXT,
    delete_completed BOOLEAN DEFAULT false,
    delete_completed_date TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX idx_receipt_reviews_receipt_id ON receipt_reviews(receipt_id);
CREATE INDEX idx_receipt_reviews_review_date ON receipt_reviews(review_date);
CREATE INDEX idx_receipt_reviews_status ON receipt_reviews(status);
CREATE INDEX idx_receipt_reviews_delete_requested ON receipt_reviews(delete_requested) WHERE delete_requested = true;

-- =====================================================
-- 트리거: updated_at 자동 업데이트
-- =====================================================
CREATE TRIGGER update_receipts_updated_at
    BEFORE UPDATE ON receipts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 샘플 데이터 입력
-- =====================================================
INSERT INTO receipts (
    user_id, account_id, business_name, place_url, place_type,
    menu_status, hours_status, intro_status, print_status,
    daily_issued, daily_limit, total_issued, total_limit, remaining_ids,
    start_date, end_date, remark, status
) VALUES
(
    1, 'cmc_team2', '천막집포장마차 수원역점', '/restaurant/2035286110', '포스트플랜트형',
    '동록', '동록', '동록', '인쇄',
    2, 2, 8, 20, 74,
    '2025-09-15', '2025-09-24', NULL, 'active'
),
(
    1, 'cmc_team2', '명품진사갈비 강남역삼점', '/restaurant/1099894206', '포스트플랜트형',
    '동록', '동록', '동록', '인쇄',
    2, 2, 8, 20, 23,
    '2025-09-15', '2025-09-24', NULL, 'active'
),
(
    1, 'pol', '선부종양동물의료센터', '/place/1969262421', '딜라이트형',
    '동록', '동록', '동록', '인쇄',
    0, 0, 2, 30, 53,
    NULL, NULL, '일 발행한도를 확인해주세요.', 'active'
),
(
    1, 'pol', '탑스동물의료센터', '/place/2078759879', '딜라이트형',
    '동록', '동록', '동록', '인쇄',
    0, 0, 5, 30, 76,
    NULL, NULL, '일 발행한도를 확인해주세요.', 'active'
);

-- =====================================================
-- 샘플 리뷰 데이터
-- =====================================================
INSERT INTO receipt_reviews (
    receipt_id, advertiser_name, review_content, review_url, review_date, status
) VALUES
(
    1, '천막집포장마차 수원역점',
    '내 명이가 갔는데 테이블도 넓찍하고 시끄러운게 오히려 좋더라 썸 뭣이 맛 같이 못가 때드나 솔이 모자라다라구요. 뽁 몸 입힘 때 어기 짭!',
    'https://m.place.naver.com/my/6871e12973736e3dcff7bc04/reviewfeed?reviewId=68cb840e94e73f8eca6bdc93',
    '2025-09-18 13:01:46',
    'active'
),
(
    1, '천막집포장마차 수원역점',
    '선배들이랑 회식 자리였는데 분위기 넘 재밌어서 눈치 안 보고 떠들 수 있었어요❤️❤️ 안주도 가성비 굿폭고 직원분들도 센스 있었어요',
    'https://m.place.naver.com/my/687066dc73736e3dcf6344b1/reviewfeed?reviewId=68cb83164552d64415cc2d06',
    '2025-09-18 12:57:39',
    'active'
);

-- =====================================================
-- 테이블 생성 확인
-- =====================================================
\echo '================================='
\echo '영수증 관련 테이블 생성 완료'
\echo '생성된 테이블:'
\dt receipts
\dt receipt_reviews
\echo '================================='