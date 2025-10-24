-- role 타입 업데이트 스크립트
-- developer, admin, distributor, advertiser, writer로 정리

-- 1. 기존 operator를 developer로, user를 advertiser로 변경
UPDATE users
SET role = 'developer'
WHERE role = 'operator';

UPDATE users
SET role = 'advertiser'
WHERE role = 'user';

-- 2. CHECK 제약 조건 제거 (새로운 제약 조건 추가를 위해)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- 3. 새로운 CHECK 제약 조건 추가
ALTER TABLE users
ADD CONSTRAINT users_role_check
CHECK (role IN ('developer', 'admin', 'distributor', 'advertiser', 'writer'));

-- 4. 현재 role 분포 확인
SELECT role, COUNT(*) as count
FROM users
GROUP BY role
ORDER BY role;