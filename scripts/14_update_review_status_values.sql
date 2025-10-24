-- 14. 리뷰 상태 값 재정의
-- 작성일: 2025-01-21
-- 목적: review_status 상태값을 실제 플로우에 맞게 재정의

-- 1. 기존 CHECK 제약조건 제거
ALTER TABLE place_receipts DROP CONSTRAINT IF EXISTS place_receipts_review_status_check;

-- 2. 기존 데이터 마이그레이션 (제약조건 제거 후 바로 수행)
-- 'url_missing' -> 'awaiting_post' (게시 대기)
UPDATE place_receipts SET review_status = 'awaiting_post' WHERE review_status = 'url_missing';

-- 'active' -> 'posted' (게시 완료)
UPDATE place_receipts SET review_status = 'posted' WHERE review_status = 'active';

-- 'deleted' -> 'deleted_by_system' (기존 삭제는 시스템 감지로 간주)
UPDATE place_receipts SET review_status = 'deleted_by_system' WHERE review_status = 'deleted';

-- 'pending' -> 'awaiting_post' (승인 전 대기는 게시 대기로)
UPDATE place_receipts SET review_status = 'awaiting_post' WHERE review_status = 'pending';

-- 3. 새로운 CHECK 제약조건 추가 (데이터 마이그레이션 후)
ALTER TABLE place_receipts ADD CONSTRAINT place_receipts_review_status_check
  CHECK (review_status IN ('awaiting_post', 'posted', 'deleted_by_system', 'deleted_by_request', 'expired'));

-- 4. 확인
SELECT
  review_status,
  COUNT(*) as count
FROM place_receipts
WHERE review_status IS NOT NULL
GROUP BY review_status
ORDER BY review_status;

-- 5. 컬럼 코멘트 업데이트
COMMENT ON COLUMN place_receipts.review_status IS '리뷰 게시 상태: awaiting_post(게시대기), posted(게시완료), deleted_by_system(시스템감지삭제), deleted_by_request(요청승인삭제), expired(만료)';
