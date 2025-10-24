-- 11. receipts 테이블을 3개로 분리하는 마이그레이션
-- 목적: 데이터 정규화 및 관리 효율성 향상

-- Step 1: 새로운 테이블들 생성

-- 1-1. receipt_limits 테이블 (발급/제한 관리)
CREATE TABLE IF NOT EXISTS receipt_limits (
  id SERIAL PRIMARY KEY,
  receipt_id INTEGER NOT NULL,
  menu_status VARCHAR(50) DEFAULT '미동록',
  hours_status VARCHAR(50) DEFAULT '미동록',
  intro_status VARCHAR(50) DEFAULT '미동록',
  print_status VARCHAR(50) DEFAULT '미인쇄',
  daily_issued INTEGER DEFAULT 0,
  daily_limit INTEGER DEFAULT 10,
  total_issued INTEGER DEFAULT 0,
  total_limit INTEGER DEFAULT 100,
  remaining_ids INTEGER DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 1-2. receipt_content 테이블 (컨텐츠 생성 옵션)
CREATE TABLE IF NOT EXISTS receipt_content (
  id SERIAL PRIMARY KEY,
  receipt_id INTEGER NOT NULL,
  main_keyword VARCHAR(255),
  sub_keywords TEXT,
  keyword_only BOOLEAN DEFAULT false,
  use_main_keyword BOOLEAN DEFAULT true,
  use_brand_name BOOLEAN DEFAULT true,
  tag_type VARCHAR(10) DEFAULT '6',
  tone_manner VARCHAR(50) DEFAULT 'friendly',
  image_style VARCHAR(50) DEFAULT 'realistic',
  blog_quantity INTEGER DEFAULT 1,
  image_generate BOOLEAN DEFAULT false,
  place_image_generate BOOLEAN DEFAULT false,
  operation_hours TEXT,
  description TEXT,
  menus JSONB,
  selling_points JSONB,
  is_reservation_available BOOLEAN DEFAULT false,
  is_delivery_available BOOLEAN DEFAULT false,
  experience VARCHAR(50) DEFAULT 'food',
  additional_info TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Step 2: 기존 데이터를 새 테이블들로 복사

-- 2-1. receipt_limits로 데이터 복사
INSERT INTO receipt_limits (
  receipt_id, menu_status, hours_status, intro_status, print_status,
  daily_issued, daily_limit, total_issued, total_limit, remaining_ids,
  created_at, updated_at
)
SELECT
  id, menu_status, hours_status, intro_status, print_status,
  daily_issued, daily_limit, total_issued, total_limit, remaining_ids,
  created_at, updated_at
FROM receipts;

-- 2-2. receipt_content로 데이터 복사
INSERT INTO receipt_content (
  receipt_id, main_keyword, sub_keywords, keyword_only,
  use_main_keyword, use_brand_name, tag_type, tone_manner, image_style,
  blog_quantity, image_generate, place_image_generate,
  operation_hours, description, menus, selling_points,
  is_reservation_available, is_delivery_available,
  experience, additional_info,
  created_at, updated_at
)
SELECT
  id, main_keyword, sub_keywords, keyword_only,
  use_main_keyword, use_brand_name, tag_type, tone_manner, image_style,
  blog_quantity, image_generate, place_image_generate,
  operation_hours, description, menus, selling_points,
  is_reservation_available, is_delivery_available,
  experience, additional_info,
  created_at, updated_at
FROM receipts;

-- Step 3: receipts 테이블에서 이전된 컬럼들 제거
ALTER TABLE receipts
  DROP COLUMN IF EXISTS menu_status,
  DROP COLUMN IF EXISTS hours_status,
  DROP COLUMN IF EXISTS intro_status,
  DROP COLUMN IF EXISTS print_status,
  DROP COLUMN IF EXISTS daily_issued,
  DROP COLUMN IF EXISTS daily_limit,
  DROP COLUMN IF EXISTS total_issued,
  DROP COLUMN IF EXISTS total_limit,
  DROP COLUMN IF EXISTS remaining_ids,
  DROP COLUMN IF EXISTS main_keyword,
  DROP COLUMN IF EXISTS sub_keywords,
  DROP COLUMN IF EXISTS keyword_only,
  DROP COLUMN IF EXISTS use_main_keyword,
  DROP COLUMN IF EXISTS use_brand_name,
  DROP COLUMN IF EXISTS tag_type,
  DROP COLUMN IF EXISTS tone_manner,
  DROP COLUMN IF EXISTS image_style,
  DROP COLUMN IF EXISTS blog_quantity,
  DROP COLUMN IF EXISTS image_generate,
  DROP COLUMN IF EXISTS place_image_generate,
  DROP COLUMN IF EXISTS operation_hours,
  DROP COLUMN IF EXISTS description,
  DROP COLUMN IF EXISTS menus,
  DROP COLUMN IF EXISTS selling_points,
  DROP COLUMN IF EXISTS is_reservation_available,
  DROP COLUMN IF EXISTS is_delivery_available,
  DROP COLUMN IF EXISTS experience,
  DROP COLUMN IF EXISTS additional_info;

-- Step 4: 외래키 제약조건 추가
ALTER TABLE receipt_limits
  ADD CONSTRAINT fk_receipt_limits_receipt
  FOREIGN KEY (receipt_id) REFERENCES receipts(id) ON DELETE CASCADE;

ALTER TABLE receipt_content
  ADD CONSTRAINT fk_receipt_content_receipt
  FOREIGN KEY (receipt_id) REFERENCES receipts(id) ON DELETE CASCADE;

-- Step 5: 인덱스 생성 (성능 최적화)
CREATE INDEX idx_receipt_limits_receipt_id ON receipt_limits(receipt_id);
CREATE INDEX idx_receipt_content_receipt_id ON receipt_content(receipt_id);

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '마이그레이션 완료: receipts 테이블이 3개로 분리되었습니다.';
  RAISE NOTICE '- receipts: % 행', (SELECT COUNT(*) FROM receipts);
  RAISE NOTICE '- receipt_limits: % 행', (SELECT COUNT(*) FROM receipt_limits);
  RAISE NOTICE '- receipt_content: % 행', (SELECT COUNT(*) FROM receipt_content);
END $$;
