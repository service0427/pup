# 🚀 Place-UP 프로덕션 서버 배포 가이드

Ubuntu 22.04 LTS 서버에 Place-UP 시스템을 배포하는 단계별 가이드

**로컬 환경:** Node.js v22.16.0
**서버 환경:** Ubuntu 22.04 LTS (깨끗한 상태)
**접속 방법:** SSH (root 계정)

---

## 📋 전체 배포 단계 요약

1. ✅ 시스템 업데이트 및 기본 패키지 설치
2. Node.js 22.x 설치
3. PM2 설치 (프로세스 매니저)
4. PostgreSQL 설치 및 데이터베이스 설정
5. Git 저장소 클론
6. 환경 변수 설정
7. 데이터베이스 스키마 임포트
8. 프론트엔드 빌드
9. 백엔드 빌드
10. PM2로 백엔드 실행
11. Nginx 설정
12. 방화벽 설정
13. SSL 인증서 설정 (선택)

---

## 1단계: 시스템 업데이트 및 기본 패키지 설치 ✅

```bash
# 시스템 업데이트
apt update && apt upgrade -y

# 필수 패키지 설치
apt install -y git nginx postgresql postgresql-contrib curl build-essential
```

**확인:**
```bash
git --version
nginx -v
psql --version
```

---

## 2단계: Node.js 22.x 설치

```bash
# Node.js 22.x 저장소 추가
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -

# Node.js 설치
apt install -y nodejs

# 버전 확인
node --version
npm --version
```

**예상 출력:**
- `node --version` → v22.x.x
- `npm --version` → 10.x.x

---

## 3단계: PM2 설치 (프로세스 매니저)

```bash
# PM2 전역 설치
npm install -g pm2

# 버전 확인
pm2 --version

# 시스템 시작 시 자동 실행 설정
pm2 startup systemd
```

**주의:** `pm2 startup` 명령 실행 후 출력되는 명령어를 복사해서 실행해야 합니다.

예시:
```bash
# 출력 예시
[PM2] You have to run this command as root. Execute the following command:
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u root --hp /root

# 출력된 명령어 실행
```

---

## 4단계: PostgreSQL 설치 및 데이터베이스 설정

### PostgreSQL 시작
```bash
# PostgreSQL 서비스 시작 및 활성화
systemctl start postgresql
systemctl enable postgresql

# 상태 확인
systemctl status postgresql
```

### 데이터베이스 생성
```bash
# PostgreSQL 사용자로 전환
su - postgres

# PostgreSQL 접속
psql
```

**PostgreSQL 프롬프트에서 실행:**
```sql
-- 데이터베이스 생성
CREATE DATABASE adr;

-- 사용자 생성 (비밀번호는 강력하게!)
CREATE USER adr_user WITH PASSWORD 'Tech1324!db';

-- 권한 부여
GRANT ALL PRIVILEGES ON DATABASE adr TO adr_user;
ALTER DATABASE adr OWNER TO adr_user;

-- 타임존 설정
ALTER DATABASE adr SET timezone TO 'Asia/Seoul';

-- 종료
\q
```

```bash
# postgres 사용자에서 빠져나오기
exit
```

**확인:**
```bash
# 연결 테스트
PGPASSWORD='Tech1324!db' psql -U adr_user -d adr -c "SELECT 1;"
```

---

## 5단계: Git 저장소 클론

### 배포 디렉토리 생성
```bash
# 디렉토리 생성
mkdir -p /var/www/place-up
cd /var/www/place-up
```

### Git Clone
```bash
# 저장소 클론 (본인의 저장소 주소로 변경)
git clone https://github.com/your-username/your-repo.git .

# 확인
ls -la
```

**필요 시 Git 인증:**
- GitHub Personal Access Token 사용
- 또는 SSH 키 설정

---

## 6단계: 환경 변수 설정

### .env 파일 생성
```bash
cd /var/www/place-up

# 환경 변수 파일 생성
nano .env
```

**`.env` 파일 내용:**
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=adr
DB_USER=adr_user
DB_PASSWORD=Tech1324!db

# Server
PORT=3001
NODE_ENV=production

# JWT Secret (새로 생성 필요!)
JWT_SECRET=your_production_jwt_secret_minimum_32_characters_here_change_this

# Timezone
TZ=Asia/Seoul
```

**JWT Secret 생성 방법:**
```bash
# 랜덤 문자열 생성
openssl rand -hex 32
# 또는
openssl rand -base64 48
```

생성된 문자열을 `JWT_SECRET`에 붙여넣기

```bash
# 파일 권한 설정 (보안)
chmod 600 .env
```

---

## 7단계: 데이터베이스 스키마 임포트

```bash
cd /var/www/place-up

# 스키마 임포트
PGPASSWORD='Tech1324!db' psql -U adr_user -d adr -f database/01_schema.sql

# 초기 데이터 임포트
PGPASSWORD='Tech1324!db' psql -U adr_user -d adr -f database/02_initial_data.sql
```

**확인:**
```bash
# 테이블 목록 확인
PGPASSWORD='Tech1324!db' psql -U adr_user -d adr -c "\dt"
```

---

## 8단계: 프론트엔드 빌드

```bash
cd /var/www/place-up

# 의존성 설치
npm install

# 프로덕션 빌드
npm run build
```

**예상 소요 시간:** 2~5분

**확인:**
```bash
# 빌드 결과물 확인
ls -lh dist/
```

---

## 9단계: 백엔드 빌드

```bash
cd /var/www/place-up/server

# 의존성 설치
npm install

# TypeScript 컴파일
npm run build

# 로그 디렉토리 생성
mkdir -p logs

# 업로드 디렉토리 생성
mkdir -p uploads/receipts
```

**확인:**
```bash
# 빌드 결과물 확인
ls -lh dist/
```

---

## 10단계: PM2로 백엔드 실행

### PM2 Ecosystem 파일 생성
```bash
cd /var/www/place-up/server

nano ecosystem.config.js
```

**`ecosystem.config.js` 내용:**
```javascript
module.exports = {
  apps: [{
    name: 'place-up-api',
    script: './dist/app.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    max_memory_restart: '500M'
  }]
};
```

### PM2로 실행
```bash
# PM2 시작
pm2 start ecosystem.config.js

# 상태 확인
pm2 status

# 로그 확인 (중요!)
pm2 logs place-up-api --lines 50

# 정상 동작 확인 후 저장
pm2 save
```

**확인:**
```bash
# API Health Check
curl http://localhost:3001/api/health
```

예상 응답:
```json
{
  "status": "OK",
  "message": "Place-UP API Server is running",
  "timestamp": "2025-10-25T..."
}
```

---

## 11단계: Nginx 설정

### Nginx 설정 파일 생성
```bash
nano /etc/nginx/sites-available/place-up
```

**Nginx 설정 내용:**
```nginx
# 백엔드 업스트림
upstream api_backend {
    server 127.0.0.1:3001;
}

server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    # 또는 IP 주소만 사용: server_name 123.456.789.012;

    # 클라이언트 업로드 크기 제한
    client_max_body_size 10M;

    # 프론트엔드 정적 파일
    root /var/www/place-up/dist;
    index index.html;

    # Gzip 압축
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # 프론트엔드 라우팅 (React Router)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 백엔드 API 프록시
    location /api/ {
        proxy_pass http://api_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # 업로드 파일 정적 제공
    location /uploads/ {
        alias /var/www/place-up/server/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # 정적 파일 캐싱
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Nginx 활성화
```bash
# 심볼릭 링크 생성
ln -s /etc/nginx/sites-available/place-up /etc/nginx/sites-enabled/

# 기본 사이트 비활성화
rm /etc/nginx/sites-enabled/default

# 설정 테스트
nginx -t

# Nginx 재시작
systemctl restart nginx

# 상태 확인
systemctl status nginx
```

---

## 12단계: 방화벽 설정

```bash
# SSH 허용 (중요! 이거 먼저!)
ufw allow OpenSSH
ufw allow 22/tcp

# HTTP/HTTPS 허용
ufw allow 80/tcp
ufw allow 443/tcp

# 또는
ufw allow 'Nginx Full'

# 방화벽 활성화
ufw enable

# 상태 확인
ufw status verbose
```

**주의:** SSH를 먼저 허용하지 않으면 연결이 끊길 수 있습니다!

---

## 13단계: SSL 인증서 설정 (선택)

**도메인이 있는 경우:**

### Certbot 설치
```bash
apt install -y certbot python3-certbot-nginx
```

### SSL 인증서 발급
```bash
# 자동 설정
certbot --nginx -d your-domain.com -d www.your-domain.com

# 이메일 입력
# 약관 동의
# HTTPS 리다이렉트 선택 (2번 권장)
```

### 자동 갱신 테스트
```bash
certbot renew --dry-run
```

---

## ✅ 배포 완료 확인

### 1. 서비스 상태 확인
```bash
# PostgreSQL
systemctl status postgresql

# Nginx
systemctl status nginx

# PM2
pm2 status
pm2 logs place-up-api --lines 20
```

### 2. API 테스트
```bash
# Health Check
curl http://localhost:3001/api/health

# 또는 외부에서
curl http://서버IP주소/api/health
```

### 3. 웹 브라우저 접속
```
http://서버IP주소
# 또는
https://your-domain.com
```

### 4. 로그인 테스트
- 관리자 로그인 페이지 접속
- 초기 계정으로 로그인 (admin / admin 또는 설정한 계정)

---

## 🔄 업데이트 배포 방법

코드 변경 후 서버에 반영하는 방법:

```bash
cd /var/www/place-up

# 최신 코드 가져오기
git pull origin main

# 프론트엔드 재빌드
npm install
npm run build

# 백엔드 재빌드
cd server
npm install
npm run build

# PM2 무중단 재시작
pm2 reload place-up-api

# 로그 확인
pm2 logs place-up-api
```

---

## 🆘 트러블슈팅

### PM2가 시작되지 않음
```bash
# 로그 확인
pm2 logs place-up-api

# 환경 변수 확인
cat /var/www/place-up/.env

# 수동 실행 테스트
cd /var/www/place-up/server
node dist/app.js
```

### 502 Bad Gateway
```bash
# PM2 상태
pm2 status

# 포트 확인
netstat -tlnp | grep 3001

# Nginx 로그
tail -50 /var/log/nginx/error.log
```

### 데이터베이스 연결 오류
```bash
# PostgreSQL 상태
systemctl status postgresql

# 연결 테스트
PGPASSWORD='Tech1324!db' psql -U adr_user -d adr -c "SELECT 1;"
```

### 파일 업로드 오류
```bash
# 권한 확인
ls -la /var/www/place-up/server/uploads/

# 권한 수정
chown -R www-data:www-data /var/www/place-up/server/uploads/
chmod -R 755 /var/www/place-up/server/uploads/
```

---

## 📊 모니터링

### PM2 모니터링
```bash
# 실시간 모니터링
pm2 monit

# 상태
pm2 status

# 로그
pm2 logs
```

### 로그 확인
```bash
# PM2 로그
pm2 logs place-up-api

# Nginx 접근 로그
tail -f /var/log/nginx/access.log

# Nginx 에러 로그
tail -f /var/log/nginx/error.log
```

---

## 📝 최종 체크리스트

- [ ] 시스템 업데이트 완료
- [ ] Node.js 22.x 설치
- [ ] PM2 설치 및 자동 시작 설정
- [ ] PostgreSQL 데이터베이스 생성
- [ ] Git 저장소 클론
- [ ] 환경 변수 설정
- [ ] 데이터베이스 스키마 임포트
- [ ] 프론트엔드 빌드 완료
- [ ] 백엔드 빌드 완료
- [ ] PM2로 백엔드 실행
- [ ] Nginx 설정 및 활성화
- [ ] 방화벽 설정
- [ ] SSL 인증서 설정 (선택)
- [ ] 웹사이트 접속 확인
- [ ] API 동작 확인
- [ ] 로그인 테스트 성공

---

**배포 완료! 🎉**

문제 발생 시 로그를 먼저 확인하세요:
- `pm2 logs place-up-api`
- `tail -f /var/log/nginx/error.log`
