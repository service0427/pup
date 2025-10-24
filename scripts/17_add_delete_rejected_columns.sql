-- 17. place_receipts에 삭제요청 반려 컬럼 추가
-- 작성일: 2025-01-22
-- 목적: 삭제 요청 거부 기능 지원

-- 1. 삭제 요청 반려 관련 컬럼 추가
ALTER TABLE place_receipts
  ADD COLUMN IF NOT EXISTS delete_rejected_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS delete_rejected_reason TEXT,
  ADD COLUMN IF NOT EXISTS delete_rejected_by INTEGER;

-- 2. 확인
SELECT
  COUNT(*) as total_reviews,
  COUNT(delete_requested_at) as delete_requested,
  COUNT(delete_rejected_at) as delete_rejected
FROM place_receipts;

-- 3. 컬럼 코멘트 추가
COMMENT ON COLUMN place_receipts.delete_rejected_at IS '삭제 요청 반려 일시';
COMMENT ON COLUMN place_receipts.delete_rejected_reason IS '삭제 요청 반려 사유';
COMMENT ON COLUMN place_receipts.delete_rejected_by IS '삭제 요청 반려한 관리자 ID';
