-- 12. 리뷰 유지 상태 추적 컬럼 추가
-- 작성일: 2025-01-21
-- 목적: 리뷰가 실제로 게시되고 유지되는지 추적하기 위한 컬럼 추가

-- 1. 리뷰 상태 컬럼 추가
ALTER TABLE place_receipts ADD COLUMN IF NOT EXISTS review_status VARCHAR(20) DEFAULT 'pending';

-- 2. 리뷰 URL 컬럼 추가
ALTER TABLE place_receipts ADD COLUMN IF NOT EXISTS review_url VARCHAR(1000);

-- 3. 시간 추적 컬럼들 추가
-- 리뷰 URL이 최초 등록된 시간 (유지 기간 계산의 시작점)
ALTER TABLE place_receipts ADD COLUMN IF NOT EXISTS review_url_registered_at TIMESTAMP;

-- 마지막으로 리뷰 존재 여부를 확인한 시간
ALTER TABLE place_receipts ADD COLUMN IF NOT EXISTS last_checked_at TIMESTAMP;

-- 리뷰 삭제가 감지된 시간 (유지 기간 계산의 종료점)
ALTER TABLE place_receipts ADD COLUMN IF NOT EXISTS deleted_detected_at TIMESTAMP;

-- 4. 확인 관련 컬럼들
-- 확인 실패 횟수 (연속 실패시 알림)
ALTER TABLE place_receipts ADD COLUMN IF NOT EXISTS check_fail_count INTEGER DEFAULT 0;

-- 마지막 확인 상태
ALTER TABLE place_receipts ADD COLUMN IF NOT EXISTS last_check_status VARCHAR(20);

-- 5. 리뷰 상태 체크 제약 조건 추가
ALTER TABLE place_receipts DROP CONSTRAINT IF EXISTS place_receipts_review_status_check;
ALTER TABLE place_receipts ADD CONSTRAINT place_receipts_review_status_check
  CHECK (review_status IN ('pending', 'active', 'deleted', 'expired', 'url_missing'));

-- 6. 마지막 확인 상태 체크 제약 조건 추가
ALTER TABLE place_receipts DROP CONSTRAINT IF EXISTS place_receipts_last_check_status_check;
ALTER TABLE place_receipts ADD CONSTRAINT place_receipts_last_check_status_check
  CHECK (last_check_status IN ('success', 'failed', 'timeout', 'error', NULL));

-- 7. 인덱스 추가 (검색 성능 향상)
CREATE INDEX IF NOT EXISTS idx_place_receipts_review_status ON place_receipts(review_status);
CREATE INDEX IF NOT EXISTS idx_place_receipts_last_checked_at ON place_receipts(last_checked_at);

-- 8. 기존 데이터 업데이트 (승인된 리뷰는 url_missing 상태로 설정)
UPDATE place_receipts
SET review_status = 'url_missing'
WHERE point_status = 'approved' AND review_url IS NULL;

UPDATE place_receipts
SET review_status = 'active'
WHERE point_status = 'approved' AND review_url IS NOT NULL;

-- 9. 확인
SELECT
  'place_receipts 테이블 업데이트 완료' as message,
  COUNT(*) as total_reviews,
  COUNT(CASE WHEN review_status = 'active' THEN 1 END) as active_reviews,
  COUNT(CASE WHEN review_status = 'url_missing' THEN 1 END) as url_missing_reviews,
  COUNT(CASE WHEN review_status = 'deleted' THEN 1 END) as deleted_reviews
FROM place_receipts;
