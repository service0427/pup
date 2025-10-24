-- =====================================================
-- 03. users 테이블 계층 구조 업데이트
-- =====================================================
-- 실행: psql -U tech_adr -d adr -f 03_update_users_hierarchy.sql

-- 타임존 설정
SET TIMEZONE TO 'Asia/Seoul';

-- =====================================================
-- 1. 새로운 컬럼 추가
-- =====================================================

-- 상위 사용자 참조 (NULL = 최상위)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS parent_id INT REFERENCES users(id) ON DELETE SET NULL;

-- 계층 레벨 (1=일반, 2=총판, 3=관리자)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS tier_level INT DEFAULT 1
CHECK (tier_level BETWEEN 1 AND 3);

-- 계층 경로 (검색 최적화용, 예: '1/5/23')
ALTER TABLE users
ADD COLUMN IF NOT EXISTS path TEXT;

-- 세부 권한 설정 (JSONB)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{
  "can_use_service": true,
  "can_manage_users": false,
  "can_view_reports": false,
  "can_view_all_data": false,
  "commission_rate": 0,
  "max_subordinates": 0
}'::jsonb;

-- =====================================================
-- 2. role 체크 제약 수정 (distributor 추가)
-- =====================================================
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('admin', 'distributor', 'operator', 'user'));

-- =====================================================
-- 3. 인덱스 추가
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_users_parent_id ON users(parent_id);
CREATE INDEX IF NOT EXISTS idx_users_tier_level ON users(tier_level);
CREATE INDEX IF NOT EXISTS idx_users_path ON users(path);
CREATE INDEX IF NOT EXISTS idx_users_permissions ON users USING GIN (permissions);

-- =====================================================
-- 4. 기존 데이터 업데이트
-- =====================================================

-- admin 계정 설정
UPDATE users
SET
  tier_level = 3,
  path = id::text,
  permissions = jsonb_build_object(
    'can_use_service', true,
    'can_manage_users', true,
    'can_view_reports', true,
    'can_view_all_data', true,
    'commission_rate', 0,
    'max_subordinates', -1  -- 무제한
  )
WHERE role = 'admin';

-- operator 계정 설정
UPDATE users
SET
  tier_level = 2,
  path = id::text,
  permissions = jsonb_build_object(
    'can_use_service', true,
    'can_manage_users', true,
    'can_view_reports', true,
    'can_view_all_data', false,
    'commission_rate', 10,  -- 10% 수수료
    'max_subordinates', 50
  )
WHERE role = 'operator';

-- 일반 user 설정
UPDATE users
SET
  tier_level = 1,
  path = id::text,
  permissions = jsonb_build_object(
    'can_use_service', true,
    'can_manage_users', false,
    'can_view_reports', false,
    'can_view_all_data', false,
    'commission_rate', 0,
    'max_subordinates', 0
  )
WHERE role = 'user';

-- =====================================================
-- 5. 계층 경로 업데이트 함수
-- =====================================================
CREATE OR REPLACE FUNCTION update_user_path()
RETURNS TRIGGER AS $$
DECLARE
  parent_path TEXT;
BEGIN
  IF NEW.parent_id IS NULL THEN
    -- 최상위 사용자
    NEW.path = NEW.id::text;
    NEW.tier_level = CASE
      WHEN NEW.role = 'admin' THEN 3
      WHEN NEW.role IN ('distributor', 'operator') THEN 2
      ELSE 1
    END;
  ELSE
    -- 하위 사용자
    SELECT path, tier_level INTO parent_path, NEW.tier_level
    FROM users
    WHERE id = NEW.parent_id;

    NEW.path = parent_path || '/' || NEW.id::text;
    NEW.tier_level = GREATEST(1, NEW.tier_level - 1);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS update_user_path_trigger ON users;
CREATE TRIGGER update_user_path_trigger
  BEFORE INSERT OR UPDATE OF parent_id ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_user_path();

-- =====================================================
-- 6. 하위 사용자 조회 함수
-- =====================================================
CREATE OR REPLACE FUNCTION get_subordinates(user_id INT)
RETURNS TABLE (
  id INT,
  username VARCHAR(50),
  name VARCHAR(100),
  role VARCHAR(20),
  tier_level INT,
  direct_subordinate BOOLEAN,
  total_subordinates BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE subordinate_tree AS (
    -- 직속 하위
    SELECT
      u.id,
      u.username,
      u.name,
      u.role,
      u.tier_level,
      true AS direct_subordinate,
      u.path
    FROM users u
    WHERE u.parent_id = user_id

    UNION ALL

    -- 간접 하위
    SELECT
      u.id,
      u.username,
      u.name,
      u.role,
      u.tier_level,
      false AS direct_subordinate,
      u.path
    FROM users u
    JOIN subordinate_tree st ON u.parent_id = st.id
  )
  SELECT
    st.id,
    st.username,
    st.name,
    st.role,
    st.tier_level,
    st.direct_subordinate,
    COUNT(*) OVER (PARTITION BY st.direct_subordinate) AS total_subordinates
  FROM subordinate_tree st
  ORDER BY st.path;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. 샘플 총판 계정 추가 (선택사항)
-- =====================================================
INSERT INTO users (username, password_hash, name, role, status, tier_level, permissions)
VALUES
  ('distributor1', '$2a$10$YKpzM1ZF2HogLCS6xNrc5uPzjlWWyT73Zzux7SZ2FMEXzZUxe9C0i', '총판1', 'distributor', 'active', 2,
   '{"can_use_service": true, "can_manage_users": true, "can_view_reports": true, "commission_rate": 15, "max_subordinates": 30}'::jsonb),
  ('distributor2', '$2a$10$YKpzM1ZF2HogLCS6xNrc5uPzjlWWyT73Zzux7SZ2FMEXzZUxe9C0i', '총판2', 'distributor', 'active', 2,
   '{"can_use_service": true, "can_manage_users": true, "can_view_reports": true, "commission_rate": 15, "max_subordinates": 30}'::jsonb)
ON CONFLICT (username) DO NOTHING;

-- 총판1 하위에 일반 사용자 추가 (테스트용)
INSERT INTO users (username, password_hash, name, role, status, parent_id)
VALUES
  ('user2', '$2a$10$YKpzM1ZF2HogLCS6xNrc5uPzjlWWyT73Zzux7SZ2FMEXzZUxe9C0i', '사용자2', 'user', 'active',
   (SELECT id FROM users WHERE username = 'distributor1')),
  ('user3', '$2a$10$YKpzM1ZF2HogLCS6xNrc5uPzjlWWyT73Zzux7SZ2FMEXzZUxe9C0i', '사용자3', 'user', 'active',
   (SELECT id FROM users WHERE username = 'distributor1'))
ON CONFLICT (username) DO NOTHING;

-- =====================================================
-- 확인
-- =====================================================
\echo '================================='
\echo '계층 구조 업데이트 완료'
\echo '================================='
\echo ''
\echo '사용자 계층 구조:'
SELECT
  id,
  username,
  name,
  role,
  tier_level,
  parent_id,
  path,
  (permissions->>'can_manage_users')::boolean as can_manage
FROM users
ORDER BY path;