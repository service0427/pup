# 🖥 Ubuntu 22.04 서버 초기 설정 가이드

완전히 깨끗한 Ubuntu 22.04 LTS 서버에서 Place-UP 시스템을 설정하는 전체 과정

---

## 📋 목차
1. [서버 접속 및 기본 설정](#1-서버-접속-및-기본-설정)
2. [필수 패키지 설치](#2-필수-패키지-설치)
3. [Node.js 설치](#3-nodejs-설치)
4. [PostgreSQL 설치 및 설정](#4-postgresql-설치-및-설정)
5. [Nginx 설치 및 설정](#5-nginx-설치-및-설정)
6. [Git 설정 및 코드 배포](#6-git-설정-및-코드-배포)
7. [애플리케이션 빌드](#7-애플리케이션-빌드)
8. [PM2 설정 및 실행](#8-pm2-설정-및-실행)
9. [방화벽 설정](#9-방화벽-설정)
10. [SSL 인증서 설정](#10-ssl-인증서-설정)

---

## 1. 서버 접속 및 기본 설정

### SSH로 서버 접속
```bash
ssh root@서버IP주소
# 또는
ssh 사용자명@서버IP주소
```

### 시스템 업데이트
```bash
# 패키지 목록 업데이트
sudo apt update

# 설치된 패키지 업그레이드
sudo apt upgrade -y

# 재부팅 필요 여부 확인
ls /var/run/reboot-required
# 파일이 있으면 재부팅 권장
sudo reboot
```

### 타임존 설정
```bash
# 현재 타임존 확인
timedatectl

# 한국 시간으로 설정
sudo timedatectl set-timezone Asia/Seoul

# 확인
date
```

### (선택) 일반 사용자 생성
root 대신 일반 사용자로 작업하는 것을 권장:

```bash
# 새 사용자 생성
sudo adduser placeup

# sudo 권한 부여
sudo usermod -aG sudo placeup

# 사용자 전환
su - placeup
```

---

## 2. 필수 패키지 설치

```bash
# 빌드 도구 및 필수 라이브러리
sudo apt install -y \
  build-essential \
  curl \
  wget \
  git \
  vim \
  unzip \
  software-properties-common \
  apt-transport-https \
  ca-certificates \
  gnupg \
  lsb-release

# 설치 확인
git --version
curl --version
```

---

## 3. Node.js 설치

### NodeSource 저장소 추가 (Node.js 18 LTS)

```bash
# NodeSource 저장소 추가
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Node.js 설치
sudo apt install -y nodejs

# 버전 확인
node --version  # v18.x.x
npm --version   # 9.x.x
```

### PM2 설치 (프로세스 매니저)
```bash
# 전역 설치
sudo npm install -g pm2

# 버전 확인
pm2 --version

# 시스템 시작 시 자동 실행 설정
pm2 startup
# 출력된 명령어 복사해서 실행 (예: sudo env PATH=...)
```

---

## 4. PostgreSQL 설치 및 설정

### PostgreSQL 설치
```bash
# PostgreSQL 14 설치
sudo apt install -y postgresql postgresql-contrib

# 서비스 시작 및 자동 시작 설정
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 상태 확인
sudo systemctl status postgresql

# 버전 확인
psql --version
```

### 데이터베이스 생성
```bash
# PostgreSQL 사용자로 전환
sudo -u postgres psql
```

PostgreSQL 프롬프트에서:
```sql
-- 데이터베이스 생성
CREATE DATABASE placeup;

-- 사용자 생성 (강력한 비밀번호 사용!)
CREATE USER placeup_user WITH PASSWORD 'YourStrongPasswordHere123!';

-- 권한 부여
GRANT ALL PRIVILEGES ON DATABASE placeup TO placeup_user;
ALTER DATABASE placeup OWNER TO placeup_user;

-- 타임존 설정
ALTER DATABASE placeup SET timezone TO 'Asia/Seoul';

-- 사용자에게 필요한 추가 권한
ALTER USER placeup_user CREATEDB;

-- 연결 확인
\c placeup placeup_user

-- 종료
\q
```

### PostgreSQL 외부 접속 설정 (선택)
로컬에서만 접속하면 이 단계 생략:

```bash
# postgresql.conf 편집
sudo nano /etc/postgresql/14/main/postgresql.conf
```

다음 라인 찾아서 수정:
```conf
listen_addresses = 'localhost'  # 로컬만 (권장)
# listen_addresses = '*'         # 모든 IP (보안 주의)
```

```bash
# pg_hba.conf 편집
sudo nano /etc/postgresql/14/main/pg_hba.conf
```

파일 끝에 추가:
```conf
# TYPE  DATABASE    USER            ADDRESS         METHOD
host    placeup     placeup_user    127.0.0.1/32    md5
```

```bash
# PostgreSQL 재시작
sudo systemctl restart postgresql
```

---

## 5. Nginx 설치 및 설정

### Nginx 설치
```bash
# Nginx 설치
sudo apt install -y nginx

# 서비스 시작 및 자동 시작 설정
sudo systemctl start nginx
sudo systemctl enable nginx

# 상태 확인
sudo systemctl status nginx

# 버전 확인
nginx -v
```

### 방화벽에서 Nginx 허용
```bash
# Nginx HTTP/HTTPS 허용
sudo ufw allow 'Nginx Full'

# 상태 확인
sudo ufw status
```

### 브라우저 테스트
```
http://서버IP주소
```
Nginx 기본 페이지가 보이면 성공!

---

## 6. Git 설정 및 코드 배포

### 배포 디렉토리 생성
```bash
# 디렉토리 생성
sudo mkdir -p /var/www/placeup
sudo chown $USER:$USER /var/www/placeup

# 이동
cd /var/www/placeup
```

### Git 저장소 클론
```bash
# Git 설정
git config --global user.name "Your Name"
git config --global user.email "your@email.com"

# 저장소 클론
git clone https://github.com/yourusername/placeup.git .

# 또는 SSH 사용
# git clone git@github.com:yourusername/placeup.git .

# 확인
ls -la
```

### 환경 변수 파일 생성
```bash
# .env.production 파일 생성
nano .env.production
```

내용:
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=placeup
DB_USER=placeup_user
DB_PASSWORD=YourStrongPasswordHere123!

# Server
PORT=3001
NODE_ENV=production

# JWT Secret (새로 생성: openssl rand -hex 64)
JWT_SECRET=your_very_long_random_jwt_secret_minimum_32_characters_here

# Timezone
TZ=Asia/Seoul

# CORS Origins
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

```bash
# 파일 권한 설정 (보안)
chmod 600 .env.production
```

---

## 7. 애플리케이션 빌드

### 데이터베이스 스키마 임포트
```bash
cd /var/www/placeup

# 스키마 임포트
psql -U placeup_user -d placeup -h localhost -f database/01_schema.sql

# 초기 데이터 임포트
psql -U placeup_user -d placeup -h localhost -f database/02_initial_data.sql
```

### 관리자 계정 생성
```bash
# 비밀번호 해시 생성 (임시로 Node.js 사용)
cd /tmp
npm init -y
npm install bcrypt

node -e "
const bcrypt = require('bcrypt');
bcrypt.hash('admin123', 10, (err, hash) => {
  console.log('Hash:', hash);
  process.exit();
});
"
```

생성된 해시 복사 후:
```bash
psql -U placeup_user -d placeup -h localhost
```

```sql
INSERT INTO users (username, password_hash, name, role, is_active)
VALUES ('admin', '복사한_해시값', '관리자', 'admin', true);

INSERT INTO point_balances (user_id, available_points, pending_points, total_earned, total_spent)
SELECT id, 0, 0, 0, 0 FROM users WHERE username = 'admin';

\q
```

### 프론트엔드 빌드
```bash
cd /var/www/placeup

# 의존성 설치
npm install

# 프로덕션 빌드
npm run build

# 빌드 확인
ls -lh dist/
```

### 백엔드 빌드
```bash
cd /var/www/placeup/server

# 의존성 설치
npm install

# TypeScript 컴파일
npm run build

# 빌드 확인
ls -lh dist/

# 업로드 디렉토리 생성
mkdir -p uploads/receipts

cd /var/www/placeup
```

---

## 8. PM2 설정 및 실행

### PM2 Ecosystem 파일 생성
```bash
cd /var/www/placeup/server

nano ecosystem.config.js
```

내용:
```javascript
module.exports = {
  apps: [{
    name: 'placeup-api',
    script: './dist/app.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    env_file: '../.env.production',
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    max_memory_restart: '500M'
  }]
};
```

### PM2로 애플리케이션 실행
```bash
# 로그 디렉토리 생성
mkdir -p logs

# PM2로 실행
pm2 start ecosystem.config.js

# 상태 확인
pm2 status

# 로그 확인
pm2 logs placeup-api --lines 50

# 자동 재시작 설정 저장
pm2 save

# 시스템 부팅 시 자동 시작
sudo pm2 startup systemd
```

---

## 9. Nginx 설정

### Nginx 설정 파일 생성
```bash
sudo nano /etc/nginx/sites-available/placeup
```

내용:
```nginx
# 백엔드 업스트림
upstream api_backend {
    server 127.0.0.1:3001;
}

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # 클라이언트 업로드 크기 제한
    client_max_body_size 10M;

    # 프론트엔드 정적 파일
    root /var/www/placeup/dist;
    index index.html;

    # Gzip 압축
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript
               application/x-javascript application/xml+rss
               application/json application/javascript;

    # 프론트엔드 라우팅
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

        # 타임아웃 설정
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 업로드 파일 제공
    location /uploads/ {
        alias /var/www/placeup/server/uploads/;
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

### Nginx 설정 활성화
```bash
# 심볼릭 링크 생성
sudo ln -s /etc/nginx/sites-available/placeup /etc/nginx/sites-enabled/

# 기본 사이트 비활성화
sudo rm /etc/nginx/sites-enabled/default

# 설정 테스트
sudo nginx -t

# Nginx 재시작
sudo systemctl restart nginx

# 상태 확인
sudo systemctl status nginx
```

---

## 10. 방화벽 설정

```bash
# UFW 상태 확인
sudo ufw status

# SSH 허용 (중요! 이거 안하면 접속 끊김)
sudo ufw allow OpenSSH
sudo ufw allow 22/tcp

# HTTP/HTTPS 허용
sudo ufw allow 'Nginx Full'
# 또는
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# PostgreSQL (로컬만 사용하므로 불필요)
# sudo ufw allow 5432/tcp

# 방화벽 활성화
sudo ufw enable

# 상태 확인
sudo ufw status verbose
```

---

## 11. SSL 인증서 설정 (Let's Encrypt)

### Certbot 설치
```bash
# Certbot 설치
sudo apt install -y certbot python3-certbot-nginx
```

### SSL 인증서 발급
```bash
# 자동 설정
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# 이메일 입력
# 약관 동의
# HTTPS 리다이렉트 설정 (2번 선택 권장)
```

### 자동 갱신 설정
```bash
# 갱신 테스트
sudo certbot renew --dry-run

# Cron에 자동 갱신 등록 (이미 설정되어 있음)
sudo systemctl status certbot.timer
```

---

## 12. 배포 완료 확인

### 서비스 상태 확인
```bash
# PostgreSQL
sudo systemctl status postgresql

# Nginx
sudo systemctl status nginx

# PM2
pm2 status
pm2 logs placeup-api --lines 20
```

### 웹 브라우저 테스트
```
https://yourdomain.com
```

### API 테스트
```bash
# Health check
curl https://yourdomain.com/api/health

# 또는
curl http://localhost:3001/api/health
```

---

## 🔄 업데이트 배포

코드 업데이트 시:
```bash
cd /var/www/placeup

# 최신 코드 가져오기
git pull origin main

# 프론트엔드 재빌드
npm install
npm run build

# 백엔드 재빌드
cd server
npm install
npm run build

# PM2 재시작
pm2 restart placeup-api

# 또는 무중단 재시작
pm2 reload placeup-api

# 로그 확인
pm2 logs placeup-api
```

---

## 📊 모니터링

### PM2 모니터링
```bash
# 실시간 모니터링
pm2 monit

# 상태 확인
pm2 status

# 메모리 사용량
pm2 list
```

### 로그 확인
```bash
# PM2 로그
pm2 logs placeup-api

# Nginx 접근 로그
sudo tail -f /var/log/nginx/access.log

# Nginx 에러 로그
sudo tail -f /var/log/nginx/error.log

# PostgreSQL 로그
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

---

## 🆘 트러블슈팅

### 1. PM2 프로세스가 시작되지 않음
```bash
# 로그 확인
pm2 logs placeup-api

# 수동 실행 테스트
cd /var/www/placeup/server
node dist/app.js
```

### 2. 502 Bad Gateway
```bash
# PM2 상태 확인
pm2 status

# 포트 확인
sudo netstat -tlnp | grep 3001

# Nginx 에러 로그
sudo tail -50 /var/log/nginx/error.log
```

### 3. 데이터베이스 연결 오류
```bash
# PostgreSQL 상태
sudo systemctl status postgresql

# 연결 테스트
psql -U placeup_user -d placeup -h localhost -c "SELECT 1;"

# 환경 변수 확인
cat /var/www/placeup/.env.production
```

### 4. 파일 업로드 오류
```bash
# uploads 디렉토리 권한 확인
ls -la /var/www/placeup/server/uploads/

# 권한 수정
sudo chown -R $USER:$USER /var/www/placeup/server/uploads/
chmod -R 755 /var/www/placeup/server/uploads/
```

---

## ✅ 최종 체크리스트

배포 완료 후 확인:
- [ ] 시스템 업데이트 완료
- [ ] Node.js 18.x 설치
- [ ] PostgreSQL 14 설치 및 데이터베이스 생성
- [ ] 관리자 계정 생성
- [ ] Nginx 설치 및 설정
- [ ] 코드 배포 및 빌드
- [ ] PM2로 백엔드 실행
- [ ] 방화벽 설정
- [ ] SSL 인증서 설정
- [ ] 웹사이트 접속 테스트
- [ ] API 동작 확인
- [ ] 로그인 테스트
- [ ] 파일 업로드 테스트

---

**축하합니다! Place-UP 시스템 배포 완료! 🎉**
