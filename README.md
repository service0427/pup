# Place-UP 광고 시스템

광고주와 작성자를 연결하는 플레이스 리뷰 관리 시스템

## 🎯 주요 기능

### 관리자 (Admin/Developer)
- 📊 대시보드 (3가지 레이아웃)
- 👥 계정 관리 (사용자 CRUD, 역할 관리)
- 🏪 플레이스 관리
- ✅ 리뷰 승인/반려 시스템
- 💰 포인트 지급 및 관리
- 📈 통계 및 리포트
- ⚙️ 시스템 설정

### 광고주 (Advertiser)
- 🏪 플레이스 등록 및 관리
- 📝 리뷰 요청 및 관리
- 💳 포인트 내역 조회
- 📊 성과 분석

### 작성자 (Writer) - 미사용
현재 시스템에서는 사용하지 않는 역할입니다.

## 🛠 기술 스택

### Frontend
- React 18 + TypeScript
- Tailwind CSS
- React Router v6
- Vite

### Backend
- Node.js + Express
- TypeScript
- PostgreSQL
- JWT Authentication
- Bcrypt

## 📁 프로젝트 구조

```
ADR/
├── src/                      # 프론트엔드
│   ├── pages/               # 페이지 컴포넌트
│   ├── layouts/             # 레이아웃 컴포넌트
│   ├── components/          # 재사용 컴포넌트
│   └── hooks/               # 커스텀 훅
├── server/                   # 백엔드
│   ├── src/
│   │   ├── routes/         # API 라우트
│   │   ├── middlewares/    # 미들웨어
│   │   └── config/         # 설정 파일
│   └── uploads/            # 업로드 파일
├── database/                 # 데이터베이스 스크립트
│   ├── 01_schema.sql       # 테이블 구조
│   └── 02_initial_data.sql # 초기 데이터
└── DEPLOYMENT.md            # 배포 가이드

```

## 🚀 시작하기

### 개발 환경 요구사항
- Node.js 18.x 이상
- PostgreSQL 14 이상
- npm 또는 yarn

### 로컬 개발 환경 설정

#### 1. 저장소 클론
```bash
git clone https://github.com/yourusername/adr-system.git
cd adr-system
```

#### 2. 환경 변수 설정
```bash
# 루트 디렉토리에 .env 파일 생성
cp .env.example .env
```

`.env` 파일 내용:
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=adr
DB_USER=tech_adr
DB_PASSWORD=Tech1324!db

# Server
PORT=3001
NODE_ENV=development

# JWT
JWT_SECRET=your_jwt_secret_here

# Timezone
TZ=Asia/Seoul
```

#### 3. 데이터베이스 설정
```bash
# PostgreSQL 접속
psql -U postgres

# 데이터베이스 생성
CREATE DATABASE adr;
CREATE USER tech_adr WITH PASSWORD 'Tech1324!db';
GRANT ALL PRIVILEGES ON DATABASE adr TO tech_adr;
ALTER DATABASE adr SET timezone TO 'Asia/Seoul';
\q

# 스키마 임포트
psql -U tech_adr -d adr -f database/01_schema.sql
psql -U tech_adr -d adr -f database/02_initial_data.sql
```

#### 4. 관리자 계정 생성
```bash
# 비밀번호 해시 생성
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('admin', 10, (err, hash) => console.log(hash));"

# 생성된 해시를 복사한 후
psql -U tech_adr -d adr
```

```sql
INSERT INTO users (username, password_hash, name, role, is_active)
VALUES ('admin', '복사한_해시값', '관리자', 'admin', true);

INSERT INTO point_balances (user_id, available_points, pending_points, total_earned, total_spent)
SELECT id, 0, 0, 0, 0 FROM users WHERE username = 'admin';
```

#### 5. 의존성 설치
```bash
# 프론트엔드
npm install

# 백엔드
cd server
npm install
cd ..
```

#### 6. 개발 서버 실행
```bash
# 프론트엔드 + 백엔드 동시 실행
npm run dev

# 또는 개별 실행
npm run dev:frontend  # http://localhost:5173
npm run dev:backend   # http://localhost:3001
```

## 📦 프로덕션 빌드

```bash
# 프론트엔드 빌드
npm run build

# 백엔드 빌드
cd server
npm run build
cd ..
```

## 🌐 배포

자세한 배포 가이드는 [DEPLOYMENT.md](./DEPLOYMENT.md)를 참조하세요.

### 빠른 배포 체크리스트
1. Git 저장소 설정
2. 서버 환경 준비 (Node.js, PostgreSQL, Nginx)
3. 데이터베이스 설정
4. 환경 변수 설정
5. 애플리케이션 빌드
6. PM2로 백엔드 실행
7. Nginx 설정
8. SSL 인증서 설정

## 🔐 기본 계정

개발 환경에서 테스트용 계정:
- **관리자**: `admin` / `admin`

⚠️ **프로덕션 배포 시 반드시 비밀번호를 변경하세요!**

## 📊 데이터베이스 구조

### 주요 테이블
- `users` - 사용자 계정
- `places` - 플레이스 정보
- `place_receipts` - 리뷰 (영수증)
- `point_balances` - 포인트 잔액
- `point_transactions` - 포인트 거래 내역
- `content_pricing` - 컨텐츠 단가 설정
- `system_settings` - 시스템 설정

## 🔑 역할(Role) 구조

| Role | 권한 | 설명 |
|------|------|------|
| **developer** | 전체 + 사용자 전환 | 최고 관리자 권한 |
| **admin** | 관리 기능 전체 | 일반 관리자 |
| **distributor** | 제한적 관리 | 총판 (미완성) |
| **advertiser** | 플레이스/리뷰 관리 | 광고주 |
| **writer** | - | 미사용 |

## 📝 API 문서

### 인증
- `POST /api/auth/login` - 로그인
- `POST /api/auth/logout` - 로그아웃
- `POST /api/auth/switch-user` - 사용자 전환 (developer만)
- `POST /api/auth/switch-back` - 원래 계정 복귀

### 사용자 관리
- `GET /api/users` - 사용자 목록
- `POST /api/users` - 사용자 생성
- `PUT /api/users/:id` - 사용자 수정
- `DELETE /api/users/:id` - 사용자 삭제

### 플레이스 관리
- `GET /api/places` - 플레이스 목록
- `POST /api/places` - 플레이스 생성
- `PUT /api/places/:id` - 플레이스 수정
- `DELETE /api/places/:id` - 플레이스 삭제

### 리뷰 관리
- `GET /api/receipts/admin/pending` - 승인 대기 리뷰
- `GET /api/receipts/admin/all` - 전체 리뷰
- `POST /api/receipts/:id/approve` - 리뷰 승인
- `POST /api/receipts/:id/reject` - 리뷰 반려
- `PUT /api/receipts/:id/update-review-status` - 리뷰 상태 변경

### 포인트 관리
- `GET /api/points/balance` - 포인트 잔액 조회
- `POST /api/points/grant` - 포인트 지급 (admin만)
- `GET /api/points/transactions` - 거래 내역

## 🐛 트러블슈팅

### 포트 충돌
```bash
# 프론트엔드 (5173 포트)
lsof -ti:5173 | xargs kill -9

# 백엔드 (3001 포트)
lsof -ti:3001 | xargs kill -9
```

### 데이터베이스 연결 오류
```bash
# PostgreSQL 서비스 상태 확인
sudo systemctl status postgresql

# 연결 테스트
psql -U tech_adr -d adr -c "SELECT 1;"
```

### 빌드 오류
```bash
# node_modules 재설치
rm -rf node_modules package-lock.json
npm install

# 캐시 정리
npm cache clean --force
```

## 📄 라이선스

이 프로젝트는 비공개 프로젝트입니다.

## 👥 개발팀

- **Backend**: Node.js + TypeScript
- **Frontend**: React + TypeScript
- **Database**: PostgreSQL
- **Deployment**: Nginx + PM2

## 📞 문의

프로젝트 관련 문의사항은 이슈를 등록해주세요.

---

**마지막 업데이트**: 2025-10-24
