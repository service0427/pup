-- receipts 테이블에 누락된 컬럼들 추가

-- 기본 정보 관련 컬럼
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS operation_hours TEXT;
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS description TEXT;

-- 키워드 관련 컬럼
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS main_keyword VARCHAR(200);
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS sub_keywords TEXT;
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS keyword_only BOOLEAN DEFAULT false;
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS use_main_keyword BOOLEAN DEFAULT true;
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS use_brand_name BOOLEAN DEFAULT true;

-- 콘텐츠 생성 관련 컬럼
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS tag_type VARCHAR(10) DEFAULT '6';
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS tone_manner VARCHAR(50) DEFAULT 'friendly';
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS image_style VARCHAR(50) DEFAULT 'realistic';
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS blog_quantity INTEGER DEFAULT 1;
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS image_generate BOOLEAN DEFAULT false;
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS place_image_generate BOOLEAN DEFAULT false;

-- 서비스 옵션 관련 컬럼
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS is_reservation_available BOOLEAN DEFAULT false;
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS is_delivery_available BOOLEAN DEFAULT false;

-- 추가 정보 컬럼
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS experience VARCHAR(50) DEFAULT 'food';
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS additional_info TEXT;
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS place_id VARCHAR(100);

-- 메뉴와 소구점은 별도 테이블로 관리하므로 JSONB로 저장
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS menus JSONB;
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS selling_points JSONB;