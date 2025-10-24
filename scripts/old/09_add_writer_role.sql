-- writer 권한 추가를 위한 스크립트

-- 기존 제약조건 삭제
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- 새로운 제약조건 추가 (writer 포함)
ALTER TABLE users
ADD CONSTRAINT users_role_check
CHECK (role IN ('admin', 'distributor', 'advertiser', 'writer'));

-- 확인
SELECT conname, contype, pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'users'::regclass
AND conname = 'users_role_check';