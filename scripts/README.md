# ADR 데이터베이스 스크립트

## 📁 파일 구조

### 메인 파일 (2개로 통합)
- **`schema.sql`** - 전체 데이터베이스 스키마 (테이블, 인덱스, 뷰, 함수)
- **`sample_data.sql`** - 개발/테스트용 샘플 데이터

### 백업 폴더
- **`old/`** - 이전 버전의 23개 SQL 파일들 (참고용)

## 🚀 설치 방법

### 1. 새로운 데이터베이스 설정

```bash
# 데이터베이스 생성 (처음 설치 시)
createdb adr

# 스키마 적용
PGPASSWORD='Tech1324!db' psql -U tech_adr -d adr -f schema.sql

# 샘플 데이터 추가 (선택사항 - 개발/테스트용)
PGPASSWORD='Tech1324!db' psql -U tech_adr -d adr -f sample_data.sql
```

### 2. 기존 데이터베이스 초기화

```bash
# 모든 테이블 삭제 후 재생성
PGPASSWORD='Tech1324!db' psql -U tech_adr -d adr -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
PGPASSWORD='Tech1324!db' psql -U tech_adr -d adr -f schema.sql
PGPASSWORD='Tech1324!db' psql -U tech_adr -d adr -f sample_data.sql
```

## 📋 테이블 구조

### 사용자 관련
- `users` - 사용자 정보 (admin, distributor, advertiser, writer)
- `sessions` - 세션 관리
- `login_logs` - 로그인 이력
- `user_referrals` - 추천인 관계

### 영수증 관련
- `receipts` - 영수증 정보
- `receipt_reviews` - 영수증 리뷰

### 작업 시스템
- `work_requests` - 작업 요청 (영수증 리뷰, 블로그 포스팅)
- `work_history` - 작업 이력
- `writer_settings` - 작성자 설정 (일일/주간 제한 등)

## 🔑 기본 계정

샘플 데이터에 포함된 테스트 계정:

| 사용자명 | 역할 | 비밀번호 | 설명 |
|---------|------|----------|------|
| admin | admin | password123! | 관리자 |
| dist01 | distributor | password123! | 총판 |
| adv01 | advertiser | password123! | 광고주 |
| writer01 | writer | password123! | 작성자1 |
| writer02 | writer | password123! | 작성자2 |

⚠️ **주의**: 프로덕션 환경에서는 반드시 비밀번호를 변경하세요!

## 🔧 유용한 명령어

### 테이블 확인
```bash
# 테이블 목록 확인
PGPASSWORD='Tech1324!db' psql -U tech_adr -d adr -c "\dt"

# 특정 테이블 구조 확인
PGPASSWORD='Tech1324!db' psql -U tech_adr -d adr -c "\d work_requests"
PGPASSWORD='Tech1324!db' psql -U tech_adr -d adr -c "\d work_history"
```

### 데이터 확인
```bash
# 사용자 목록
PGPASSWORD='Tech1324!db' psql -U tech_adr -d adr -c "SELECT username, email, role, status FROM users;"

# 작업 상태 확인
PGPASSWORD='Tech1324!db' psql -U tech_adr -d adr -c "SELECT type, title, status, point_value FROM work_requests;"

# 데이터 건수 확인
PGPASSWORD='Tech1324!db' psql -U tech_adr -d adr -c "
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL SELECT 'work_requests', COUNT(*) FROM work_requests
UNION ALL SELECT 'receipts', COUNT(*) FROM receipts
UNION ALL SELECT 'receipt_reviews', COUNT(*) FROM receipt_reviews;"
```

## 📝 버전 관리

### v1.0 (2025-09-22)
- 23개의 개별 SQL 파일을 2개로 통합
  - `schema.sql`: 모든 테이블 구조 및 설정
  - `sample_data.sql`: 테스트 데이터
- 작업 시스템 추가
  - work_requests: 작업 요청 관리
  - work_history: 작업 이력 추적
  - writer_settings: 작성자 제한 설정
- 동시성 제어 구현 (optimistic locking with version field)

## 🏗️ 주요 기능

### 1. 계층형 사용자 관리
- admin → distributor → advertiser → writer 계층 구조
- parent_id를 통한 관계 관리

### 2. 작업 시스템
- 영수증 리뷰와 블로그 포스팅 지원
- 동시 선택 방지 (FOR UPDATE NOWAIT)
- 자동 만료 처리 (24시간)
- 포인트 자동 계산

### 3. 리뷰 시스템
- 영수증 기반 리뷰 작성
- 승인/거절 프로세스
- 삭제 요청 기능

## 🔒 보안 고려사항

1. **비밀번호**: bcrypt 해시 사용 (샘플은 테스트용)
2. **SQL Injection**: Prepared statements 사용 권장
3. **권한 관리**: 역할 기반 접근 제어 (RBAC)
4. **데이터 검증**: CHECK constraints로 데이터 무결성 보장

## 🚨 프로덕션 체크리스트

- [ ] 모든 테스트 계정 비밀번호 변경
- [ ] 샘플 데이터 제거
- [ ] 백업 스크립트 설정
- [ ] 모니터링 설정
- [ ] 인덱스 최적화
- [ ] 파티셔닝 검토 (대용량 테이블)