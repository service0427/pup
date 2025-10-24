-- PostgreSQL용 Advertisements 테이블 생성 (SERIAL 버전)

-- Advertisements 테이블 생성
CREATE TABLE IF NOT EXISTS advertisements (
    id SERIAL PRIMARY KEY,
    advertiser_id INTEGER NOT NULL,
    
    -- 기본 정보
    title VARCHAR(255) NOT NULL,
    description TEXT,
    url VARCHAR(1000) NOT NULL,
    image_url VARCHAR(1000),
    
    -- 광고 타입 및 분류
    type VARCHAR(20) NOT NULL CHECK (type IN ('banner', 'popup', 'video', 'text', 'native')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'paused', 'completed', 'rejected')),
    category VARCHAR(100) NOT NULL,
    
    -- 포인트 및 예산
    points_per_action INTEGER NOT NULL DEFAULT 0,
    daily_budget BIGINT NOT NULL DEFAULT 0,
    total_budget BIGINT NOT NULL DEFAULT 0,
    used_budget BIGINT NOT NULL DEFAULT 0,
    
    -- 성과 지표
    view_count BIGINT NOT NULL DEFAULT 0,
    click_count BIGINT NOT NULL DEFAULT 0,
    conversion_count BIGINT NOT NULL DEFAULT 0,
    
    -- 타겟 오디언스 (JSON)
    target_audience JSONB,
    
    -- 기간
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    
    -- 승인 정보
    approved_by INTEGER,
    approved_at TIMESTAMP NULL,
    rejected_reason TEXT,
    
    -- 메타데이터
    metadata JSONB,
    
    -- 타임스탬프
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 외래키
    FOREIGN KEY (advertiser_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_advertisements_advertiser_id ON advertisements(advertiser_id);
CREATE INDEX IF NOT EXISTS idx_advertisements_status ON advertisements(status);
CREATE INDEX IF NOT EXISTS idx_advertisements_type ON advertisements(type);
CREATE INDEX IF NOT EXISTS idx_advertisements_category ON advertisements(category);
CREATE INDEX IF NOT EXISTS idx_advertisements_start_end_date ON advertisements(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_advertisements_created_at ON advertisements(created_at);

-- updated_at 트리거 생성
DROP TRIGGER IF EXISTS update_advertisements_updated_at ON advertisements;
CREATE TRIGGER update_advertisements_updated_at 
    BEFORE UPDATE ON advertisements 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 광고 상호작용 로그 테이블
CREATE TABLE IF NOT EXISTS ad_interactions (
    id BIGSERIAL PRIMARY KEY,
    ad_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    interaction_type VARCHAR(20) NOT NULL CHECK (interaction_type IN ('view', 'click', 'conversion')),
    
    -- 점수 및 포인트
    points_earned INTEGER NOT NULL DEFAULT 0,
    
    -- 메타데이터
    ip_address INET,
    user_agent TEXT,
    referrer VARCHAR(1000),
    metadata JSONB,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 중복 방지는 별도 인덱스로 처리
    
    -- 외래키
    FOREIGN KEY (ad_id) REFERENCES advertisements(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_ad_interactions_ad_id ON ad_interactions(ad_id);
CREATE INDEX IF NOT EXISTS idx_ad_interactions_user_id ON ad_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_ad_interactions_type ON ad_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_ad_interactions_created_at ON ad_interactions(created_at);

-- 일별 중복 방지를 위한 복합 인덱스
CREATE UNIQUE INDEX IF NOT EXISTS idx_ad_interactions_daily_unique 
ON ad_interactions(user_id, ad_id, interaction_type, DATE(created_at));

-- 광고 통계 테이블 (일별)
CREATE TABLE IF NOT EXISTS ad_daily_stats (
    id BIGSERIAL PRIMARY KEY,
    ad_id INTEGER NOT NULL,
    date DATE NOT NULL,
    
    views BIGINT NOT NULL DEFAULT 0,
    clicks BIGINT NOT NULL DEFAULT 0,
    conversions BIGINT NOT NULL DEFAULT 0,
    spend BIGINT NOT NULL DEFAULT 0,
    
    unique_users INTEGER NOT NULL DEFAULT 0,
    
    ctr DECIMAL(5,4) NOT NULL DEFAULT 0, -- Click Through Rate
    cvr DECIMAL(5,4) NOT NULL DEFAULT 0, -- Conversion Rate
    cpc DECIMAL(10,2) NOT NULL DEFAULT 0, -- Cost Per Click
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE (ad_id, date),
    
    FOREIGN KEY (ad_id) REFERENCES advertisements(id) ON DELETE CASCADE
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_ad_daily_stats_ad_id ON ad_daily_stats(ad_id);
CREATE INDEX IF NOT EXISTS idx_ad_daily_stats_date ON ad_daily_stats(date);

-- 광고 카테고리 테이블
CREATE TABLE IF NOT EXISTS ad_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_ad_categories_is_active ON ad_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_ad_categories_sort_order ON ad_categories(sort_order);

-- updated_at 트리거 생성
DROP TRIGGER IF EXISTS update_ad_categories_updated_at ON ad_categories;
CREATE TRIGGER update_ad_categories_updated_at 
    BEFORE UPDATE ON ad_categories 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 기본 광고 카테고리 데이터
INSERT INTO ad_categories (name, description, icon) VALUES
('쇼핑', '쇼핑몰, 이커머스 관련 광고', '🛒'),
('게임', '모바일 게임, PC 게임 관련 광고', '🎮'),
('금융', '은행, 카드, 투자 관련 광고', '💳'),
('여행', '여행, 항공, 숙박 관련 광고', '✈️'),
('교육', '강의, 학원, 자격증 관련 광고', '📚'),
('건강', '헬스케어, 의료, 건강식품 관련 광고', '🏥'),
('음식', '음식 배달, 레스토랑 관련 광고', '🍔'),
('기타', '기타 분류되지 않은 광고', '📝')
ON CONFLICT (name) DO NOTHING;