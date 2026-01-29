-- Master 계정 추가
-- 비밀번호: Master1234! (bcrypt 해시)
INSERT OR IGNORE INTO users (id, username, password, name, role, created_at, updated_at)
VALUES (
  100,
  'master',
  '$2a$10$YourBcryptHashHere',
  'Master',
  'master',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);
