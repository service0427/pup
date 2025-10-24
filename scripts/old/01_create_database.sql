-- =====================================================
-- 01. 데이터베이스 및 사용자 생성
-- =====================================================
-- 실행: psql -U choijinho -d postgres -f 01_create_database.sql

-- 기존 연결 종료
SELECT pg_terminate_backend(pg_stat_activity.pid)
FROM pg_stat_activity
WHERE pg_stat_activity.datname = 'adr'
  AND pid <> pg_backend_pid();

-- 데이터베이스 삭제 (존재하는 경우)
DROP DATABASE IF EXISTS adr;

-- 사용자 삭제 (존재하는 경우)
DROP USER IF EXISTS tech_adr;

-- 사용자 생성
CREATE USER tech_adr WITH PASSWORD 'Tech1324!db';

-- 데이터베이스 생성
CREATE DATABASE adr
  WITH OWNER = tech_adr
  ENCODING = 'UTF8'
  LC_COLLATE = 'C'
  LC_CTYPE = 'C'
  TABLESPACE = pg_default
  CONNECTION LIMIT = -1;

-- tech_adr 사용자에게 모든 권한 부여
GRANT ALL PRIVILEGES ON DATABASE adr TO tech_adr;

-- 슈퍼유저 권한 부여 (함수, 트리거 등을 위해)
ALTER USER tech_adr CREATEDB CREATEROLE;

-- 데이터베이스 타임존을 한국 시간으로 설정
ALTER DATABASE adr SET TIMEZONE TO 'Asia/Seoul';

-- 연결 정보 확인
\echo '================================='
\echo '데이터베이스 생성 완료'
\echo 'Database: adr'
\echo 'User: tech_adr'
\echo 'Password: Tech1324!db'
\echo '================================='