# 🚀 ADR 시스템 배포 가이드

## 📋 목차
1. [Git 설정](#1-git-설정)
2. [서버 환경 준비](#2-서버-환경-준비)
3. [데이터베이스 설정](#3-데이터베이스-설정)
4. [애플리케이션 배포](#4-애플리케이션-배포)
5. [프로덕션 실행](#5-프로덕션-실행)

---

## 1. Git 설정

### 1-1. Git 저장소 초기화 (로컬)

```bash
# 프로젝트 디렉토리로 이동
cd /Users/choijinho/app/study3/metronic/ADR

# Git 초기화
git init

# 현재 상태 확인
git status
```

### 1-2. 첫 커밋

```bash
# 모든 파일 스테이징 (.gitignore에 따라 자동 제외됨)
git add .

# 첫 커밋
git commit -m "Initial commit: ADR system

- Admin dashboard with multiple layouts
- User management with role-based access
- Place management system
- Receipt review system with approval workflow
- Point management and transaction system
- Profile management
- System settings
- Database schema and initial data"
```

### 1-3. GitHub 저장소 연결

```bash
# GitHub에서 저장소 생성 후 (예: github.com/yourusername/adr-system)

# 원격 저장소 추가
git remote add origin https://github.com/yourusername/adr-system.git

# 브랜치 이름 확인 및 변경 (필요시)
git branch -M main

# 원격 저장소에 푸시
git push -u origin main
```

### 1-4. 브랜치 전략 (권장)

```bash
# 개발용 브랜치 생성
git checkout -b develop

# 기능 개발 시
git checkout -b feature/기능명

# 개발 완료 후
git checkout develop
git merge feature/기능명
git branch -d feature/기능명

# 배포 준비 완료 시
git checkout main
git merge develop
git tag -a v1.0.0 -m "First production release"
git push origin main --tags
```

---

## 2. 서버 환경 준비

### 2-1. 서버 기본 설정

```bash
# 시스템 업데이트
sudo apt update && sudo apt upgrade -y

# 필수 패키지 설치
sudo apt install -y git nginx postgresql postgresql-contrib certbot python3-certbot-nginx
```

### 2-2. Node.js 설치

```bash
# Node.js 18.x LTS 설치
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 버전 확인
node --version  # v18.x.x
npm --version   # 9.x.x
```

### 2-3. PM2 설치 (프로세스 매니저)

```bash
sudo npm install -g pm2

# PM2 자동 시작 설정
pm2 startup
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME
```

---

## 3. 데이터베이스 설정

### 3-1. PostgreSQL 설정

```bash
# PostgreSQL 서비스 시작
sudo systemctl start postgresql
sudo systemctl enable postgresql

# PostgreSQL 접속
sudo -u postgres psql
```

```sql
-- 데이터베이스 생성
CREATE DATABASE adr;

-- 사용자 생성 (강력한 비밀번호 사용!)
CREATE USER adr_user WITH PASSWORD 'your_strong_password_here';

-- 권한 부여
GRANT ALL PRIVILEGES ON DATABASE adr TO adr_user;
ALTER DATABASE adr OWNER TO adr_user;

-- 타임존 설정
ALTER DATABASE adr SET timezone TO 'Asia/Seoul';

-- 종료
\q
```

### 3-2. 스키마 및 데이터 임포트

```bash
# 서버에서 Git clone (또는 파일 업로드)
git clone https://github.com/yourusername/adr-system.git
cd adr-system

# 스키마 임포트
psql -U adr_user -d adr -f database/01_schema.sql

# 초기 데이터 임포트
psql -U adr_user -d adr -f database/02_initial_data.sql
```

### 3-3. 관리자 계정 생성

```bash
# Node.js로 비밀번호 해시 생성
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('admin123', 10, (err, hash) => console.log(hash));"
```

복사된 해시를 사용:
```sql
psql -U adr_user -d adr

INSERT INTO users (username, password_hash, name, role, is_active)
VALUES ('admin', '복사한_해시값', '관리자', 'admin', true);

INSERT INTO point_balances (user_id, available_points, pending_points, total_earned, total_spent)
SELECT id, 0, 0, 0, 0 FROM users WHERE username = 'admin';

\q
```

---

## 4. 애플리케이션 배포

### 4-1. 서버에 코드 배포

```bash
# 배포할 디렉토리 생성
sudo mkdir -p /var/www/adr
sudo chown $USER:$USER /var/www/adr

# Git clone
cd /var/www/adr
git clone https://github.com/yourusername/adr-system.git .
```

### 4-2. 환경 변수 설정

```bash
# 프로덕션 환경 변수 파일 생성
nano .env.production
```

`.env.production` 내용:
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=adr
DB_USER=adr_user
DB_PASSWORD=your_strong_password_here

# Server
PORT=3001
NODE_ENV=production

# JWT (openssl rand -hex 64 로 생성)
JWT_SECRET=your_very_long_random_jwt_secret_here

# Timezone
TZ=Asia/Seoul

# CORS Origins (프로덕션 도메인)
CORS_ORIGINS=https://yourdomain.com
```

### 4-3. 프론트엔드 빌드

```bash
# 의존성 설치
npm install

# 프로덕션 빌드
npm run build

# 빌드 결과물 확인
ls -la dist/
```

### 4-4. 백엔드 빌드

```bash
cd server

# 의존성 설치
npm install

# TypeScript 컴파일
npm run build

# 빌드 결과물 확인
ls -la dist/

cd ..
```

---

## 5. 프로덕션 실행

### 5-1. PM2로 백엔드 실행

```bash
cd /var/www/adr/server

# PM2 ecosystem 파일 생성
nano ecosystem.config.js
```

`ecosystem.config.js` 내용:
```javascript
module.exports = {
  apps: [{
    name: 'adr-api',
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
    merge_logs: true
  }]
};
```

```bash
# 로그 디렉토리 생성
mkdir -p logs

# PM2로 실행
pm2 start ecosystem.config.js

# 상태 확인
pm2 status
pm2 logs adr-api

# 자동 재시작 설정 저장
pm2 save
```

### 5-2. Nginx 설정

```bash
sudo nano /etc/nginx/sites-available/adr
```

`/etc/nginx/sites-available/adr` 내용:
```nginx
# 백엔드 API 업스트림
upstream api_backend {
    server 127.0.0.1:3001;
}

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # 프론트엔드 (React)
    root /var/www/adr/dist;
    index index.html;

    # Gzip 압축
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

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
    }

    # 업로드 파일 정적 제공
    location /uploads/ {
        alias /var/www/adr/server/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # 캐시 설정
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
# 심볼릭 링크 생성
sudo ln -s /etc/nginx/sites-available/adr /etc/nginx/sites-enabled/

# 기본 사이트 비활성화 (선택)
sudo rm /etc/nginx/sites-enabled/default

# Nginx 설정 테스트
sudo nginx -t

# Nginx 재시작
sudo systemctl restart nginx
```

### 5-3. SSL 인증서 설정 (Let's Encrypt)

```bash
# Certbot으로 SSL 인증서 발급
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# 자동 갱신 테스트
sudo certbot renew --dry-run
```

### 5-4. 방화벽 설정

```bash
# UFW 방화벽 활성화
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable

# 상태 확인
sudo ufw status
```

---

## 6. 모니터링 및 유지보수

### 6-1. 로그 확인

```bash
# PM2 로그
pm2 logs adr-api

# Nginx 로그
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# PostgreSQL 로그
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

### 6-2. 업데이트 배포

```bash
cd /var/www/adr

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
pm2 restart adr-api

# 또는 무중단 재시작
pm2 reload adr-api
```

### 6-3. 백업 스크립트

```bash
sudo nano /usr/local/bin/adr_backup.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/adr"
DATE=$(date +%Y%m%d_%H%M%S)

# 백업 디렉토리 생성
mkdir -p $BACKUP_DIR

# 데이터베이스 백업
pg_dump -U adr_user -d adr | gzip > $BACKUP_DIR/adr_db_$DATE.sql.gz

# 업로드 파일 백업
tar -czf $BACKUP_DIR/adr_uploads_$DATE.tar.gz /var/www/adr/server/uploads/

# 30일 이상 된 백업 삭제
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete

echo "Backup completed: $DATE"
```

```bash
sudo chmod +x /usr/local/bin/adr_backup.sh

# Cron 등록 (매일 새벽 3시)
sudo crontab -e
```

추가:
```
0 3 * * * /usr/local/bin/adr_backup.sh >> /var/log/adr_backup.log 2>&1
```

---

## 7. 트러블슈팅

### PM2 프로세스 멈춤
```bash
pm2 restart adr-api
pm2 logs adr-api --lines 100
```

### Nginx 502 Error
```bash
# PM2 상태 확인
pm2 status

# 포트 확인
sudo netstat -tlnp | grep 3001
```

### 데이터베이스 연결 오류
```bash
# PostgreSQL 상태 확인
sudo systemctl status postgresql

# 연결 테스트
psql -U adr_user -d adr -c "SELECT 1;"
```

---

## 📞 체크리스트

배포 전 확인사항:
- [ ] Git 저장소 설정 완료
- [ ] `.gitignore` 설정 확인
- [ ] 환경 변수 파일 생성 (`.env.production`)
- [ ] 강력한 비밀번호 설정 (DB, JWT)
- [ ] 데이터베이스 스키마 임포트
- [ ] 관리자 계정 생성
- [ ] SSL 인증서 설정
- [ ] 방화벽 설정
- [ ] 백업 스크립트 설정
- [ ] 모니터링 설정

배포 후 확인사항:
- [ ] 웹사이트 접속 확인
- [ ] 로그인 테스트
- [ ] API 동작 확인
- [ ] 업로드 기능 테스트
- [ ] PM2 프로세스 정상 동작
- [ ] 로그 확인
- [ ] 백업 자동화 동작 확인
