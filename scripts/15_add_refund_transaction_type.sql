-- 15. point_transactions에 refund 타입 추가
-- 작성일: 2025-01-21
-- 목적: 리뷰 취소/거절 시 환불 거래 타입 지원

-- 1. 기존 CHECK 제약조건 제거
ALTER TABLE point_transactions DROP CONSTRAINT IF EXISTS point_transactions_transaction_type_check;

-- 2. 새로운 CHECK 제약조건 추가 (refund 포함)
ALTER TABLE point_transactions ADD CONSTRAINT point_transactions_transaction_type_check
  CHECK (transaction_type IN ('earn', 'spend', 'admin_add', 'admin_subtract', 'transfer', 'refund'));

-- 3. 확인
SELECT
  'CHECK 제약조건 업데이트 완료' as message,
  COUNT(*) as total_transactions,
  COUNT(CASE WHEN transaction_type = 'refund' THEN 1 END) as refund_count
FROM point_transactions;

-- 4. 컬럼 코멘트 업데이트
COMMENT ON COLUMN point_transactions.transaction_type IS '거래 유형: earn(적립), spend(사용), admin_add(관리자추가), admin_subtract(관리자차감), transfer(이전), refund(환불)';
