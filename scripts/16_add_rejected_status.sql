-- 16. place_receipts에 반려(rejected) 상태 추가
-- 작성일: 2025-01-21
-- 목적: 사용자 취소(cancelled)와 관리자 반려(rejected) 구분

-- 1. rejected 관련 컬럼 추가
ALTER TABLE place_receipts
  ADD COLUMN IF NOT EXISTS rejected_reason TEXT,
  ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS rejected_by INTEGER;

-- 2. 기존 CHECK 제약조건 제거
ALTER TABLE place_receipts DROP CONSTRAINT IF EXISTS place_receipts_point_status_check;

-- 3. 새로운 CHECK 제약조건 추가 (rejected 포함)
ALTER TABLE place_receipts ADD CONSTRAINT place_receipts_point_status_check
  CHECK (point_status IN ('draft', 'pending', 'approved', 'cancelled', 'rejected', 'refunded'));

-- 4. 확인
SELECT
  point_status,
  COUNT(*) as count
FROM place_receipts
GROUP BY point_status
ORDER BY point_status;

-- 5. 컬럼 코멘트 추가
COMMENT ON COLUMN place_receipts.point_status IS '포인트 상태: draft(임시), pending(승인대기), approved(승인완료), cancelled(사용자취소), rejected(관리자반려), refunded(자동환불)';
COMMENT ON COLUMN place_receipts.rejected_reason IS '관리자 반려 사유';
COMMENT ON COLUMN place_receipts.rejected_at IS '반려 일시';
COMMENT ON COLUMN place_receipts.rejected_by IS '반려한 관리자 ID';
