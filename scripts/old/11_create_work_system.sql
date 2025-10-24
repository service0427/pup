-- 작업 관리 시스템 테이블 생성

-- 1. 작업 요청 테이블
CREATE TABLE IF NOT EXISTS work_requests (
  id SERIAL PRIMARY KEY,
  type VARCHAR(50) NOT NULL CHECK (type IN ('receipt_review', 'blog_post')),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  receipt_id INTEGER REFERENCES receipts(id) ON DELETE SET NULL,
  keywords TEXT[],
  guidelines TEXT,
  point_value INTEGER NOT NULL DEFAULT 100,
  status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'in_progress', 'completed', 'expired', 'cancelled')),
  version INTEGER DEFAULT 0,  -- 낙관적 잠금용
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMP,
  expires_at TIMESTAMP,
  completed_at TIMESTAMP,
  review_url TEXT,  -- 작성 완료된 URL
  review_notes TEXT,  -- 작성자 메모
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스
CREATE INDEX idx_work_status ON work_requests(status);
CREATE INDEX idx_work_assigned ON work_requests(assigned_to, status);
CREATE INDEX idx_work_type ON work_requests(type);
CREATE INDEX idx_work_created ON work_requests(created_at DESC);

-- 2. 작성자 설정 테이블
CREATE TABLE IF NOT EXISTS writer_settings (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  max_concurrent_works INTEGER DEFAULT 1,
  daily_limit INTEGER DEFAULT 5,
  weekly_limit INTEGER DEFAULT 20,
  current_daily_count INTEGER DEFAULT 0,
  current_weekly_count INTEGER DEFAULT 0,
  last_daily_reset DATE DEFAULT CURRENT_DATE,
  last_weekly_reset DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. 작업 히스토리 테이블 (통계용)
CREATE TABLE IF NOT EXISTS work_history (
  id SERIAL PRIMARY KEY,
  work_request_id INTEGER REFERENCES work_requests(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL, -- 'selected', 'completed', 'expired', 'cancelled'
  action_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  details JSONB
);

-- 인덱스
CREATE INDEX idx_history_user ON work_history(user_id);
CREATE INDEX idx_history_work ON work_history(work_request_id);
CREATE INDEX idx_history_action ON work_history(action, action_at);

-- 4. 트리거: updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_work_requests_updated_at
  BEFORE UPDATE ON work_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_writer_settings_updated_at
  BEFORE UPDATE ON writer_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 5. 기본 writer_settings 생성 (모든 writer 권한 사용자)
INSERT INTO writer_settings (user_id)
SELECT id FROM users WHERE role = 'writer'
ON CONFLICT (user_id) DO NOTHING;

-- 확인
\d work_requests
\d writer_settings
\d work_history