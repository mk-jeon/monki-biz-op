-- 가맹점현황 테이블
CREATE TABLE IF NOT EXISTS franchises (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  operation_id INTEGER,
  customer_name TEXT NOT NULL,
  phone TEXT,
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'suspended')),
  address TEXT,
  opening_date DATE,
  memo TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER,
  created_by_name TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_by INTEGER,
  updated_by_name TEXT,
  FOREIGN KEY (operation_id) REFERENCES operations(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (updated_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_franchises_status ON franchises(status);
CREATE INDEX IF NOT EXISTS idx_franchises_operation_id ON franchises(operation_id);
CREATE INDEX IF NOT EXISTS idx_franchises_created_at ON franchises(created_at);
