-- 13. 리뷰 삭제 요청 기능 추가
-- 작성일: 2025-01-21
-- 목적: 승인된 리뷰에 대한 삭제 요청 기능

-- 1. 삭제 요청 관련 컬럼 추가
ALTER TABLE place_receipts ADD COLUMN IF NOT EXISTS delete_requested_at TIMESTAMP;
ALTER TABLE place_receipts ADD COLUMN IF NOT EXISTS delete_request_reason TEXT;

-- 2. 인덱스 추가 (삭제 요청 검색 성능 향상)
CREATE INDEX IF NOT EXISTS idx_place_receipts_delete_requested_at ON place_receipts(delete_requested_at) WHERE delete_requested_at IS NOT NULL;

-- 3. 확인
SELECT
  'place_receipts 테이블 업데이트 완료' as message,
  COUNT(*) as total_reviews,
  COUNT(CASE WHEN delete_requested_at IS NOT NULL THEN 1 END) as delete_requests
FROM place_receipts;
