-- 사용자 테이블
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user', -- 'master', 'admin', 'user'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 권한 테이블
CREATE TABLE IF NOT EXISTS permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role TEXT NOT NULL,
  menu_id TEXT NOT NULL,
  access_level TEXT NOT NULL DEFAULT 'none', -- 'none', 'read', 'write'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 세션 테이블
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_permissions_role ON permissions(role);

-- 마스터 계정 생성 (비밀번호: Axieslin12! - bcrypt 해시)
INSERT OR IGNORE INTO users (id, username, password, name, role) 
VALUES (1, 'minhiti88', '$2b$10$5QNcfQT/v5JUiENEUHct1OpkluHojcRnIJD5LkPmHEEkjc.lPS4da', '관리자', 'master');
