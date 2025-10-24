-- 컨텐츠 가격 설정 테이블 생성
CREATE TABLE IF NOT EXISTS content_pricing (
  id SERIAL PRIMARY KEY,
  content_type VARCHAR(20) NOT NULL UNIQUE,
  price INTEGER NOT NULL CHECK (price >= 0),
  description VARCHAR(200),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 초기 데이터 삽입
INSERT INTO content_pricing (content_type, price, description) VALUES
('receipt_review', 300, '영수증 리뷰 컨텐츠'),
('blog_content', 500, '블로그 컨텐츠 발행')
ON CONFLICT (content_type) DO UPDATE SET
price = EXCLUDED.price,
description = EXCLUDED.description,
updated_at = CURRENT_TIMESTAMP;

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_content_pricing_content_type ON content_pricing(content_type);
CREATE INDEX IF NOT EXISTS idx_content_pricing_is_active ON content_pricing(is_active);

-- updated_at 자동 업데이트 트리거 생성
CREATE OR REPLACE FUNCTION update_content_pricing_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_content_pricing_updated_at ON content_pricing;
CREATE TRIGGER update_content_pricing_updated_at
    BEFORE UPDATE ON content_pricing
    FOR EACH ROW
    EXECUTE FUNCTION update_content_pricing_updated_at();