-- PostgreSQL 데이터베이스 및 사용자 생성 스크립트
-- 이 스크립트는 PostgreSQL 관리자(postgres) 권한으로 실행해야 합니다.

-- 1. 데이터베이스 사용자 생성
CREATE USER adr WITH PASSWORD 'adr_password_2024!';

-- 2. 데이터베이스 생성
CREATE DATABASE adr_db 
    WITH 
    OWNER = adr
    ENCODING = 'UTF8'
    LC_COLLATE = 'en_US.UTF-8'
    LC_CTYPE = 'en_US.UTF-8'
    TEMPLATE = template0;

-- 3. 사용자에게 데이터베이스 권한 부여
GRANT ALL PRIVILEGES ON DATABASE adr_db TO adr;

-- 4. 데이터베이스에 연결하여 추가 권한 설정
\c adr_db

-- 스키마 권한 부여
GRANT ALL ON SCHEMA public TO adr;

-- 시퀀스 권한 부여 (SERIAL 타입 사용시 필요)
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO adr;

-- 테이블 권한 부여
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO adr;