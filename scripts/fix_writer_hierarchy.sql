-- Writer 계층 구조 수정
-- Writer는 독립적이므로 parent_id를 NULL로 설정

-- 1. Writer의 parent_id를 모두 NULL로 변경
UPDATE users
SET parent_id = NULL
WHERE role = 'writer';

-- 2. 테스트용 advertiser 계정 추가
INSERT INTO users (username, password, name, role, parent_id, status) VALUES
('adv001', '$2a$10$YourHashedPasswordHere', '광고주1', 'advertiser', 8, 'active'),
('adv002', '$2a$10$YourHashedPasswordHere', '광고주2', 'advertiser', 9, 'active')
ON CONFLICT (username) DO NOTHING;

-- 3. 현재 구조 확인
SELECT
  id,
  username,
  name,
  role,
  parent_id,
  CASE
    WHEN parent_id IS NULL THEN '최상위'
    ELSE (SELECT name FROM users WHERE id = u.parent_id)
  END as parent_name
FROM users u
ORDER BY
  CASE role
    WHEN 'admin' THEN 1
    WHEN 'distributor' THEN 2
    WHEN 'advertiser' THEN 3
    WHEN 'writer' THEN 4
  END, id;