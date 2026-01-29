-- 공지사항 테이블
CREATE TABLE IF NOT EXISTS notices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id INTEGER NOT NULL,
  is_pinned INTEGER DEFAULT 0, -- 상단 고정
  views INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES users(id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_notices_author ON notices(author_id);
CREATE INDEX IF NOT EXISTS idx_notices_pinned ON notices(is_pinned);
CREATE INDEX IF NOT EXISTS idx_notices_created ON notices(created_at DESC);
