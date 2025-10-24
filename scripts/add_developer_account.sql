-- Developer 계정 추가
-- 비밀번호: 1324 (bcrypt hash)

INSERT INTO users (username, password_hash, name, role, status, permissions)
VALUES (
  'jino',
  '$2a$10$NGgUJZkCbu7H2ZyABKySAejdGSwbfdgh3pLY.6197aAGYb/K9yp/y',
  '개발자',
  'developer',
  'active',
  '{"can_use_service": true, "can_manage_users": true, "can_view_reports": true, "can_view_all_data": true}'::jsonb
)
ON CONFLICT (username) DO UPDATE
SET
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role,
  name = EXCLUDED.name;

-- 확인
SELECT id, username, name, role, status FROM users WHERE username = 'jino';