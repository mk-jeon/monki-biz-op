-- 계약현황 테이블
CREATE TABLE IF NOT EXISTS contracts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- 상담현황에서 이관된 정보
  consultation_id INTEGER, -- 원본 상담 ID (추적용)
  customer_name TEXT,
  phone TEXT NOT NULL,
  inflow_source TEXT,
  
  -- 진행 상태
  status TEXT DEFAULT 'waiting', -- 'waiting', 'in_progress', 'signature_pending', 'hold', 'completed', 'cancelled'
  
  -- 세부 옵션
  pre_installation INTEGER DEFAULT 0, -- 선 설치진행 여부
  
  -- 메모
  notes TEXT,
  
  -- 메타 정보
  created_by INTEGER NOT NULL,
  updated_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (consultation_id) REFERENCES consultations(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_consultation_id ON contracts(consultation_id);
CREATE INDEX IF NOT EXISTS idx_contracts_phone ON contracts(phone);
CREATE INDEX IF NOT EXISTS idx_contracts_created_at ON contracts(created_at DESC);
