-- 추천인 관계 테이블 생성

CREATE TABLE IF NOT EXISTS user_referrals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referrer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id) -- 한 사용자는 하나의 추천인만 가능
);

-- 인덱스 추가
CREATE INDEX idx_referrals_user_id ON user_referrals(user_id);
CREATE INDEX idx_referrals_referrer_id ON user_referrals(referrer_id);

-- 확인
\d user_referrals