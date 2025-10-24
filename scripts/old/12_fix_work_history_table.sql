-- work_history 테이블 재생성
DROP TABLE IF EXISTS work_history CASCADE;

CREATE TABLE work_history (
    id SERIAL PRIMARY KEY,
    work_id INTEGER NOT NULL REFERENCES work_requests(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('in_progress', 'completed', 'expired', 'cancelled')),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    completed_at TIMESTAMP,
    review_url TEXT,
    notes TEXT,
    points_earned INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스
CREATE INDEX idx_work_history_user ON work_history(user_id);
CREATE INDEX idx_work_history_work ON work_history(work_id);
CREATE INDEX idx_work_history_status ON work_history(status);
CREATE INDEX idx_work_history_assigned ON work_history(assigned_at DESC);

-- 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_work_history_updated_at BEFORE UPDATE ON work_history
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 샘플 데이터 추가 (테스트용)
INSERT INTO work_requests (type, title, description, keywords, guidelines, point_value, status, expires_at) VALUES
('receipt_review', '스타벅스 강남점', '커피 전문점 리뷰 작성',
 ARRAY['스타벅스', '강남', '커피', '카페'],
 '매장 분위기와 음료 맛을 중심으로 작성해주세요. 최소 300자 이상 작성하고, 사진을 3장 이상 포함해주세요.',
 500, 'available', NOW() + INTERVAL '7 days'),

('blog_post', '여름 휴가지 추천 BEST 5', '국내 여름 휴가지 추천 포스팅',
 ARRAY['여름휴가', '국내여행', '휴가지추천', '여행'],
 '각 장소의 특징과 추천 이유를 상세히 작성해주세요. 사진과 함께 1000자 이상 작성해주세요.',
 1000, 'available', NOW() + INTERVAL '5 days'),

('receipt_review', '김밥천국 서초점', '분식점 리뷰 작성',
 ARRAY['김밥천국', '서초', '분식', '김밥'],
 '메뉴의 맛과 가격대를 중심으로 작성해주세요. 최소 200자 이상 작성해주세요.',
 400, 'available', NOW() + INTERVAL '3 days');

-- writer_settings 기본값 추가
INSERT INTO writer_settings (daily_limit, weekly_limit, min_review_length, max_review_length, auto_expire_hours)
VALUES (5, 20, 200, 2000, 24)
ON CONFLICT DO NOTHING;