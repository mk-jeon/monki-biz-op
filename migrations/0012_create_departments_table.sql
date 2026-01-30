-- 부서 테이블 생성
CREATE TABLE IF NOT EXISTS departments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 기본 부서 데이터 삽입
INSERT INTO departments (name) VALUES 
('선택하세요'),
('디지털사업본부'),
('마케팅팀'),
('디지털사업팀'),
('운영파트'),
('대표이사'),
('수석부사장'),
('디지털프로덕트본부'),
('개발팀'),
('디지털기획팀'),
('QA팀'),
('UIUX디자인파트'),
('경영지원그룹'),
('법무파트'),
('재무회계파트'),
('인사파트'),
('총무파트')
ON CONFLICT(name) DO NOTHING;
