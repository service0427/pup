-- receipt_reviews 테이블에 삭제 요청 관련 컬럼 추가
ALTER TABLE receipt_reviews
ADD COLUMN IF NOT EXISTS delete_requested BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS delete_request_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS delete_request_reason TEXT,
ADD COLUMN IF NOT EXISTS delete_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS delete_completed_date TIMESTAMP WITH TIME ZONE;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_receipt_reviews_delete_requested
ON receipt_reviews(delete_requested) WHERE delete_requested = true;