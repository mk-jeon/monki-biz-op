-- 공지사항 테이블에 분류, 중요도, 연관채널 필드 추가
ALTER TABLE notices ADD COLUMN category TEXT DEFAULT 'general'; -- 'update', 'info', 'general'
ALTER TABLE notices ADD COLUMN is_important INTEGER DEFAULT 0; -- 중요 공지 여부
ALTER TABLE notices ADD COLUMN channels TEXT DEFAULT ''; -- 연관채널 (쉼표로 구분된 문자열)

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_notices_category ON notices(category);
CREATE INDEX IF NOT EXISTS idx_notices_important ON notices(is_important);
