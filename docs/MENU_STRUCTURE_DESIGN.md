# ADR 시스템 메뉴 구조 설계

작성일: 2025-10-21

## 1. 개요

ADR(Advertising Review) 시스템의 메뉴 구조를 광고주와 관리자의 니즈에 맞게 재설계

### 주요 원칙
- **광고주**: 플레이스 중심, 신청/작성 위주
- **관리자**: 작업 중심, 승인/모니터링 위주
- **컨텐츠 관계**:
  - 트래픽: 1:1 (플레이스당 1개)
  - 리뷰/블로그: 1:N (플레이스당 여러 개)

---

## 2. 광고주 메뉴 구조

### 2.1 대시보드 (`/admin`)
- 전체 요약 정보
- 포인트 현황
- 최근 활동

### 2.2 플레이스 관리 (`/admin/places`)

#### 목록 페이지
```
┌─────────────────────────────────────────────────────────┐
│ 플레이스명    주소        트래픽 현황      작업          │
├─────────────────────────────────────────────────────────┤
│ 강남떡볶이   강남구...    50/100회 12위  [트래픽] [상세] │
│ 이태원카페   용산구...    0/30회   없음   [트래픽] [상세] │
│ 홍대맛집     마포구...    100/100회 5위  [트래픽] [상세] │
└─────────────────────────────────────────────────────────┘
```

**기능**:
- 플레이스 목록 조회 (내 플레이스만)
- 트래픽 현황 표시 (작업량/목표량, 현재 순위)
- [트래픽] 버튼: 모달로 트래픽 신청/설정
- [상세] 버튼: 플레이스 상세 페이지 이동
- 플레이스 추가 버튼

#### 상세 페이지 (`/admin/places/:id`)

**탭 구조**:

1. **대시보드 탭** (기본)
   - 포인트 현황 (5개 카드)
     - 보유 포인트
     - 대기 포인트
     - 획득 포인트
     - 사용 포인트 (리뷰 작성만)
     - 회수 포인트 (관리자 회수만)
   - 트래픽 요약 (현재 순위, 이번달 작업량)
   - 리뷰 요약 (총 리뷰 수, 승인대기 수)
   - 블로그 요약 (총 블로그 수)

2. **트래픽 탭**
   - 트래픽 신청/설정
   - 상세 통계
   - 히스토리
   - 순위 변화 그래프
   - 월별/일별 데이터

3. **리뷰 탭**
   - 이 플레이스의 리뷰 목록
   - 리뷰 작성 버튼
   - 상태별 필터 (작성중/승인대기/승인완료/반려)

4. **블로그 탭** (향후)
   - 이 플레이스의 블로그 목록
   - 블로그 작성 버튼
   - 상태별 필터

### 2.3 리뷰 관리 (`/admin/reviews`)
- 전체 플레이스의 리뷰 목록 (내 것만)
- 플레이스별 필터
- 상태별 필터
- 리뷰 수정/삭제

### 2.4 포인트 요청 (`/admin/points`)
- 포인트 충전 요청
- 요청 내역

### 2.5 포인트 내역 (`/admin/points-history`)
- 포인트 거래 내역
- 5개 카드 (보유/대기/획득/사용/회수)
- 거래 타입별 필터
  - 획득 (earn)
  - 사용 (spend)
  - 발급 (admin_add)
  - 회수 (admin_subtract)
  - 이체 (transfer)
  - 환불 (refund)

---

## 3. 관리자 메뉴 구조

### 3.1 대시보드 (`/admin`)
- 전체 통계
  - 총 플레이스 수
  - 총 광고주 수
  - 총 트래픽 작업량
  - 총 리뷰 수
- 승인 대기 알림
  - 트래픽 신청 대기
  - 리뷰 승인 대기
  - 블로그 승인 대기
- 최근 활동

### 3.2 계정 관리 (`/admin/accounts`)
- 광고주/총판 계정 관리
- 계정 생성/수정/삭제
- 권한 관리

### 3.3 플레이스 관리 (`/admin/places`)

#### 목록 페이지
```
┌───────────────────────────────────────────────────────────┐
│ 광고주     플레이스명    트래픽      리뷰   상태   작업    │
├───────────────────────────────────────────────────────────┤
│ atest1    강남떡볶이    50/100 12위  3건   활성  [상세]   │
│ atest2    이태원카페    0/30 없음    0건   대기  [상세]   │
│ atest3    홍대맛집      100/100 5위  12건  활성  [상세]   │
└───────────────────────────────────────────────────────────┘
```

**기능**:
- 전체 플레이스 조회 (모든 광고주)
- 광고주별 필터
- 상태별 필터
- 트래픽/리뷰 현황 한눈에 보기
- [상세] 버튼: 플레이스 상세 페이지

#### 상세 페이지
- 광고주와 동일한 구조 (읽기 전용 또는 관리자 권한)
- 추가 관리 기능 (강제 삭제, 상태 변경 등)

### 3.4 트래픽 관리 (`/admin/traffic`)

#### 목록 페이지
```
┌──────────────────────────────────────────────────────────┐
│ 광고주   플레이스    요청량   현재   상태    신청일  작업 │
├──────────────────────────────────────────────────────────┤
│ atest1  강남떡볶이   100회   50회   진행중  10/15  [보기]│
│ atest2  이태원카페   30회    0회    대기    10/20  [승인]│
│ atest3  홍대맛집     50회    50회   완료    10/10  [보기]│
└──────────────────────────────────────────────────────────┘
```

**기능**:
- 전체 트래픽 신청 조회
- 상태별 필터 (대기/진행중/완료/반려)
- 광고주별 필터
- 승인/반려 처리
- 일괄 승인 기능
- 상세 모니터링

### 3.5 리뷰 승인 (`/admin/review-management`)
**현재 구현됨**

- 승인 대기 리뷰 목록
- 리뷰 상세 보기
- 승인/반려 처리
- 반려 시 포인트 환불

### 3.6 블로그 승인 (`/admin/blog-management`)
**향후 구현**

- 리뷰 승인과 유사한 구조
- 승인 대기 블로그 목록
- 승인/반려 처리

### 3.7 포인트 지급 (`/admin/points-management`)
**현재 구현됨**

- 광고주별 포인트 발급/회수
- 포인트 요청 승인

### 3.8 포인트 요청 (`/admin/points`)
- 포인트 요청 내역 조회
- 요청 승인/반려

### 3.9 포인트 내역 (`/admin/points-history`)
- 전체 포인트 거래 내역 (모든 광고주)
- 광고주별 필터
- 거래 타입별 필터

### 3.10 시스템 설정 (`/admin/settings`)
**현재 구현됨**

- 컨텐츠 단가 설정
  - 리뷰 단가
  - 블로그 단가
  - 트래픽 단가

---

## 4. 역할별 메뉴 접근 권한

### Developer (개발자)
- 모든 메뉴 접근 가능
- 사용자 전환 기능

### Admin (최고관리자)
- 모든 관리자 메뉴 접근 가능
- 계정 관리
- 시스템 설정

### Distributor (총판)
- 대시보드
- 자기 하위 광고주 관리
- 포인트 요청
- 포인트 내역

### Advertiser (광고주)
- 대시보드
- 플레이스 관리
- 리뷰 관리
- 포인트 요청
- 포인트 내역

---

## 5. 주요 차이점 요약

| 항목 | 광고주 | 관리자 |
|------|--------|--------|
| **플레이스 관리** | 내 플레이스만 | 전체 플레이스 |
| **트래픽** | 목록에서 버튼으로 신청 | 별도 메뉴로 승인 관리 |
| **리뷰** | 작성/수정 중심 | 승인/반려 중심 |
| **포인트** | 요청/사용 | 발급/회수 |
| **목적** | "내 것 관리" | "전체 모니터링" |

---

## 6. 데이터 구조

### 트래픽 테이블 (신규 필요)
```sql
CREATE TABLE traffic_requests (
  id SERIAL PRIMARY KEY,
  place_id INTEGER REFERENCES places(id),
  user_id INTEGER REFERENCES users(id),
  target_amount INTEGER NOT NULL,          -- 목표 트래픽 량
  current_amount INTEGER DEFAULT 0,        -- 현재 작업량
  current_rank VARCHAR(50),                -- 현재 순위
  status VARCHAR(20) DEFAULT 'pending',    -- pending/approved/in_progress/completed/rejected
  point_amount INTEGER,                    -- 차감 포인트
  point_transaction_id INTEGER REFERENCES point_transactions(id),
  admin_note TEXT,                         -- 관리자 메모
  created_at TIMESTAMP DEFAULT NOW(),
  submitted_at TIMESTAMP,                  -- 제출 시간
  approved_at TIMESTAMP,                   -- 승인 시간
  rejected_at TIMESTAMP,                   -- 반려 시간
  reject_reason TEXT                       -- 반려 사유
);

-- 트래픽 히스토리 (순위 변화 추적)
CREATE TABLE traffic_history (
  id SERIAL PRIMARY KEY,
  traffic_request_id INTEGER REFERENCES traffic_requests(id),
  rank_position VARCHAR(50),               -- 순위
  work_amount INTEGER,                     -- 작업량
  recorded_at TIMESTAMP DEFAULT NOW()      -- 기록 시간
);
```

### 블로그 테이블 (향후 필요)
```sql
CREATE TABLE blog_posts (
  id SERIAL PRIMARY KEY,
  place_id INTEGER REFERENCES places(id),
  user_id INTEGER REFERENCES users(id),
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  images TEXT[],                           -- 이미지 URL 배열
  blog_url VARCHAR(1000),                  -- 실제 발행된 블로그 URL
  status VARCHAR(20) DEFAULT 'draft',      -- draft/submitted/approved/rejected
  point_amount INTEGER,
  point_transaction_id INTEGER REFERENCES point_transactions(id),
  created_at TIMESTAMP DEFAULT NOW(),
  submitted_at TIMESTAMP,
  approved_at TIMESTAMP,
  rejected_at TIMESTAMP,
  reject_reason TEXT
);
```

---

## 7. 컴포넌트 구조

### 공통 컴포넌트
- `PlaceCard.tsx` - 플레이스 카드 표시
- `PointCard.tsx` - 포인트 카드 (5개 타입)
- `TrafficModal.tsx` - 트래픽 신청 모달 (신규)
- `ReviewCreateModal.tsx` - 리뷰 작성 모달 (기존)
- `BlogCreateModal.tsx` - 블로그 작성 모달 (향후)
- `StatusBadge.tsx` - 상태 배지

### 광고주 페이지
- `DashboardPage.tsx` - 대시보드
- `PlacesPage.tsx` - 플레이스 목록 (수정 필요)
- `PlaceDetailPage.tsx` - 플레이스 상세 (수정 필요)
- `ReviewsPage.tsx` - 리뷰 관리
- `PointRequestPage.tsx` - 포인트 요청
- `PointHistoryPage.tsx` - 포인트 내역 (완료)

### 관리자 페이지
- `AdminDashboardPage.tsx` - 관리자 대시보드
- `AccountsPage.tsx` - 계정 관리 (기존)
- `AdminPlacesPage.tsx` - 플레이스 관리
- `TrafficManagementPage.tsx` - 트래픽 관리 (신규)
- `ReviewManagementPage.tsx` - 리뷰 승인 (기존)
- `BlogManagementPage.tsx` - 블로그 승인 (향후)
- `PointsManagementPage.tsx` - 포인트 지급 (기존)
- `SettingsPage.tsx` - 시스템 설정 (기존)

---

## 8. API 엔드포인트

### 트래픽 관련 (신규)
```
광고주:
GET    /api/traffic/my-places           # 내 플레이스의 트래픽 현황
POST   /api/traffic/request             # 트래픽 신청
GET    /api/traffic/:id                 # 트래픽 상세
PUT    /api/traffic/:id                 # 트래픽 수정 (임시저장만)
DELETE /api/traffic/:id                 # 트래픽 삭제 (임시저장만)

관리자:
GET    /api/traffic/admin/all           # 전체 트래픽 조회
GET    /api/traffic/admin/pending       # 승인 대기 트래픽
POST   /api/traffic/:id/approve         # 트래픽 승인
POST   /api/traffic/:id/reject          # 트래픽 반려
POST   /api/traffic/:id/update-progress # 작업 진행상황 업데이트
GET    /api/traffic/:id/history         # 트래픽 히스토리
```

### 블로그 관련 (향후)
```
광고주:
GET    /api/blogs/place/:placeId        # 플레이스별 블로그
POST   /api/blogs                       # 블로그 작성
PUT    /api/blogs/:id                   # 블로그 수정
DELETE /api/blogs/:id                   # 블로그 삭제

관리자:
GET    /api/blogs/admin/pending         # 승인 대기 블로그
POST   /api/blogs/:id/approve           # 블로그 승인
POST   /api/blogs/:id/reject            # 블로그 반려
```

---

## 9. 변경 이력

### 2025-10-21
- 초안 작성
- 광고주/관리자 메뉴 구조 정의
- 트래픽/블로그 테이블 설계
