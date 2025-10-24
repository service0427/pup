-- place_receipts 테이블에 포인트 관련 컬럼 추가
-- 리뷰 작성 시 포인트 차감 및 관리자 승인 워크플로우를 위한 컬럼들

ALTER TABLE place_receipts
ADD COLUMN IF NOT EXISTS point_amount INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS point_status VARCHAR(20) DEFAULT 'draft',
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS approved_by INTEGER REFERENCES users(id);

-- point_status 체크 제약 조건 추가
-- draft: 작성중 (포인트 미차감)
-- pending: 제출됨 (포인트 차감, 승인 대기)
-- approved: 승인됨 (포인트 확정)
-- cancelled: 취소됨 (포인트 환불)
-- refunded: 자동환불됨 (기간 초과로 자동 환불)
ALTER TABLE place_receipts
ADD CONSTRAINT place_receipts_point_status_check
CHECK (point_status IN ('draft', 'pending', 'approved', 'cancelled', 'refunded'));

-- 인덱스 추가 (승인 대기 목록 조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_place_receipts_point_status ON place_receipts(point_status);
CREATE INDEX IF NOT EXISTS idx_place_receipts_submitted_at ON place_receipts(submitted_at);

COMMENT ON COLUMN place_receipts.point_amount IS '사용된 포인트 금액';
COMMENT ON COLUMN place_receipts.point_status IS '포인트 상태: draft/pending/approved/cancelled/refunded';
COMMENT ON COLUMN place_receipts.submitted_at IS '제출 시간 (자동환불 기준 시간)';
COMMENT ON COLUMN place_receipts.approved_at IS '승인 시간';
COMMENT ON COLUMN place_receipts.approved_by IS '승인자 ID';
