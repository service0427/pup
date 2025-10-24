# ADR 데이터베이스 배포 가이드

## 📋 개요
이 디렉토리는 ADR 시스템의 데이터베이스 초기 설정 파일을 포함합니다.

## 📁 파일 구조
```
database/
├── 01_schema.sql          # 테이블 구조 (스키마)
├── 02_initial_data.sql    # 초기 필수 데이터
└── README.md              # 이 파일
```

## 🚀 배포 순서

### 1. PostgreSQL 설치 및 설정

#### Ubuntu/Debian
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

#### CentOS/RHEL
```bash
sudo yum install postgresql-server postgresql-contrib
sudo postgresql-setup initdb
sudo systemctl start postgresql
```

### 2. 데이터베이스 생성

```bash
# PostgreSQL 접속
sudo -u postgres psql

# 데이터베이스 생성
CREATE DATABASE adr;

# 사용자 생성 (비밀번호는 반드시 변경하세요!)
CREATE USER adr_user WITH PASSWORD '강력한비밀번호입력';

# 권한 부여
GRANT ALL PRIVILEGES ON DATABASE adr TO adr_user;

# 타임존 설정
ALTER DATABASE adr SET timezone TO 'Asia/Seoul';

# 종료
\q
```

### 3. 스키마 임포트

```bash
# 01_schema.sql 실행
psql -U adr_user -d adr -f 01_schema.sql

# 02_initial_data.sql 실행
psql -U adr_user -d adr -f 02_initial_data.sql
```

### 4. 관리자 계정 생성

```bash
psql -U adr_user -d adr
```

```sql
-- 관리자 계정 생성 (비밀번호 해시는 'admin' → bcrypt로 생성된 값)
INSERT INTO users (username, password_hash, name, role, is_active)
VALUES (
  'admin',
  '$2b$10$YourHashedPasswordHere',  -- 실제 bcrypt 해시로 교체
  '관리자',
  'admin',
  true
);

-- 포인트 잔액 초기화
INSERT INTO point_balances (user_id, available_points, pending_points, total_earned, total_spent)
SELECT id, 0, 0, 0, 0 FROM users WHERE username = 'admin';
```

## 🔐 보안 설정

### PostgreSQL 설정 파일 수정

#### 1. `postgresql.conf`
```bash
sudo nano /etc/postgresql/14/main/postgresql.conf
```

수정 내용:
```conf
listen_addresses = 'localhost'  # 로컬만 접속 허용 (필요시 변경)
timezone = 'Asia/Seoul'
```

#### 2. `pg_hba.conf`
```bash
sudo nano /etc/postgresql/14/main/pg_hba.conf
```

수정 내용:
```conf
# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   all             postgres                                peer
local   all             all                                     peer
host    adr             adr_user        127.0.0.1/32            md5
host    adr             adr_user        ::1/128                 md5
```

### 재시작
```bash
sudo systemctl restart postgresql
```

## 🌍 환경변수 설정

서버 배포 시 `.env` 파일 생성:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=adr
DB_USER=adr_user
DB_PASSWORD=강력한비밀번호입력

# Server
PORT=3001
NODE_ENV=production

# JWT
JWT_SECRET=매우강력하고긴랜덤문자열생성하세요

# Timezone
TZ=Asia/Seoul
```

## ✅ 설치 확인

```bash
# 데이터베이스 연결 확인
psql -U adr_user -d adr -c "SELECT tablename FROM pg_tables WHERE schemaname='public';"

# 초기 데이터 확인
psql -U adr_user -d adr -c "SELECT * FROM content_pricing;"
psql -U adr_user -d adr -c "SELECT * FROM system_settings;"
```

## 📊 테이블 목록

배포되는 테이블:
- `users` - 사용자 계정
- `sessions` - 세션 관리
- `login_logs` - 로그인 기록
- `point_balances` - 포인트 잔액
- `point_transactions` - 포인트 거래 내역
- `point_requests` - 포인트 요청
- `places` - 플레이스 정보
- `place_receipts` - 리뷰 (영수증)
- `user_referrals` - 사용자 추천
- `content_pricing` - 컨텐츠 단가 설정
- `system_settings` - 시스템 설정

## 🔄 백업

### 수동 백업
```bash
pg_dump -U adr_user -d adr > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 자동 백업 스크립트 (cron)
```bash
# /usr/local/bin/adr_backup.sh
#!/bin/bash
BACKUP_DIR="/var/backups/adr"
mkdir -p $BACKUP_DIR
pg_dump -U adr_user -d adr | gzip > $BACKUP_DIR/adr_backup_$(date +%Y%m%d_%H%M%S).sql.gz
# 30일 이상 된 백업 삭제
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete
```

```bash
# crontab 설정 (매일 새벽 3시 백업)
0 3 * * * /usr/local/bin/adr_backup.sh
```

## 🆘 트러블슈팅

### 1. 연결 오류
```
psql: error: connection to server at "localhost" (127.0.0.1), port 5432 failed
```
**해결:** PostgreSQL 서비스 시작
```bash
sudo systemctl start postgresql
```

### 2. 권한 오류
```
ERROR: permission denied for table users
```
**해결:** 권한 재부여
```sql
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO adr_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO adr_user;
```

### 3. 타임존 문제
```sql
-- 현재 타임존 확인
SHOW timezone;

-- 타임존 설정
ALTER DATABASE adr SET timezone TO 'Asia/Seoul';
```

## 📝 주의사항

1. **비밀번호 변경 필수**
   - 데이터베이스 사용자 비밀번호
   - 관리자 계정 비밀번호
   - JWT_SECRET

2. **방화벽 설정**
   - PostgreSQL 포트(5432)는 필요한 경우만 외부 오픈
   - 기본은 localhost만 접속 허용

3. **정기 백업**
   - 자동 백업 스크립트 설정 권장
   - 백업 파일 별도 서버에 보관

4. **모니터링**
   - 디스크 용량 주기적 확인
   - 로그 파일 정기 정리
