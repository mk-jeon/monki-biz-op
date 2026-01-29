-- 항목 관리 테이블 (유입경로 등 드롭다운 항목 관리)
CREATE TABLE IF NOT EXISTS item_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_type TEXT NOT NULL, -- 'inflow_source', 'contract_type', etc.
  value TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 상담현황 테이블
CREATE TABLE IF NOT EXISTS consultations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- 기본 정보
  customer_name TEXT, -- 고객명 (선택)
  phone TEXT NOT NULL, -- 전화번호 (필수)
  inflow_source TEXT, -- 유입경로
  notes TEXT, -- 요청사항/메모
  
  -- 진행 상태
  status TEXT DEFAULT 'waiting', -- 'waiting', 'in_progress', 'hold', 'completed', 'cancelled'
  
  -- 세부 옵션
  is_visit_consultation INTEGER DEFAULT 0, -- 방문상담 여부
  has_quotation INTEGER DEFAULT 0, -- 견적서 여부
  
  -- 메타 정보
  created_by INTEGER NOT NULL, -- 등록자
  updated_by INTEGER, -- 수정자
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_item_categories_type ON item_categories(category_type);
CREATE INDEX IF NOT EXISTS idx_consultations_status ON consultations(status);
CREATE INDEX IF NOT EXISTS idx_consultations_phone ON consultations(phone);
CREATE INDEX IF NOT EXISTS idx_consultations_created_at ON consultations(created_at DESC);

-- 기본 유입경로 데이터 삽입
INSERT INTO item_categories (category_type, value, display_order) VALUES
  ('inflow_source', '네이버 검색', 1),
  ('inflow_source', '구글 검색', 2),
  ('inflow_source', '지인 추천', 3),
  ('inflow_source', '기존 고객', 4),
  ('inflow_source', '전화 문의', 5),
  ('inflow_source', '홈페이지', 6),
  ('inflow_source', '기타', 99);
