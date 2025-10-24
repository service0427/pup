-- place_type 체크 제약조건 제거 및 새로 추가
ALTER TABLE receipts DROP CONSTRAINT IF EXISTS receipts_place_type_check;

-- 더 유연한 place_type 허용 (기존 값들과 새로운 업종 타입들)
ALTER TABLE receipts ADD CONSTRAINT receipts_place_type_check
CHECK (place_type IS NULL OR place_type IN (
  '포스트플랜트형',
  '딜라이트형',
  'restaurant',
  'cafe',
  'hospital',
  'beauty',
  'academy',
  'shop',
  'other'
));

-- 기존 데이터 마이그레이션 (필요한 경우)
UPDATE receipts
SET place_type = CASE
  WHEN place_type = '포스트플랜트형' THEN 'restaurant'
  WHEN place_type = '딜라이트형' THEN 'cafe'
  ELSE place_type
END
WHERE place_type IN ('포스트플랜트형', '딜라이트형');