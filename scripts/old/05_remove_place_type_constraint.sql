-- place_type 체크 제약조건 완전 제거
-- 어떤 텍스트든 자유롭게 입력 가능하도록 함
ALTER TABLE receipts DROP CONSTRAINT IF EXISTS receipts_place_type_check;

-- place_type 컬럼은 이미 VARCHAR(50)으로 정의되어 있으므로
-- 제약조건만 제거하면 어떤 텍스트든 50자 이내로 저장 가능