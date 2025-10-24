-- system_settings 테이블 생성
-- 관리자가 설정할 수 있는 시스템 전역 설정값들

CREATE TABLE IF NOT EXISTS system_settings (
  id SERIAL PRIMARY KEY,
  setting_key VARCHAR(50) UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  description VARCHAR(200),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(setting_key);

-- 기본 설정값 삽입
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
  ('auto_refund_days', '7', '승인되지 않은 리뷰의 자동 환불 기간 (일)'),
  ('review_require_approval', 'true', '리뷰 제출 시 관리자 승인 필요 여부')
ON CONFLICT (setting_key) DO NOTHING;

-- updated_at 자동 업데이트 트리거 생성
CREATE OR REPLACE FUNCTION update_system_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_system_settings_updated_at
BEFORE UPDATE ON system_settings
FOR EACH ROW
EXECUTE FUNCTION update_system_settings_updated_at();

COMMENT ON TABLE system_settings IS '시스템 전역 설정';
COMMENT ON COLUMN system_settings.setting_key IS '설정 키 (고유값)';
COMMENT ON COLUMN system_settings.setting_value IS '설정 값 (문자열로 저장)';
COMMENT ON COLUMN system_settings.description IS '설정 설명';
