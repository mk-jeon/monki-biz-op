-- 추가 마스터 계정 생성
-- 아이디: master, 비밀번호: Master1234!
INSERT INTO users (username, password, name, role, created_at) 
VALUES (
  'master',
  '$2b$10$bW5Y/nlKSr/o7ZAYnCQaFu6BRTLBB9ZV6904kHW3Zse2HrxWtQFj.',
  'Master',
  'master',
  CURRENT_TIMESTAMP
)
ON CONFLICT(username) DO NOTHING;
