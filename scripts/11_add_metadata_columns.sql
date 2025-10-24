-- sessions 테이블에 metadata 컬럼 추가
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS metadata JSONB;

-- login_logs 테이블에 metadata 컬럼 추가
ALTER TABLE login_logs ADD COLUMN IF NOT EXISTS metadata JSONB;

-- 확인
\d sessions
\d login_logs