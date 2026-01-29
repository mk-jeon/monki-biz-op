-- 운영등재 테이블 생성
CREATE TABLE IF NOT EXISTS operations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contract_id INTEGER,
  customer_name TEXT,
  phone TEXT,
  status TEXT DEFAULT 'contract_pending' CHECK(status IN ('contract_pending', 'install_cert_pending', 'install_photo_pending', 'drive_upload_pending', 'completed', 'cancelled')),
  contract_document_url TEXT,
  install_certificate_url TEXT,
  install_photo_url TEXT,
  drive_url TEXT,
  memo TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER,
  created_by_name TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_by INTEGER,
  updated_by_name TEXT,
  FOREIGN KEY (contract_id) REFERENCES contracts(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_operations_status ON operations(status);
CREATE INDEX IF NOT EXISTS idx_operations_contract_id ON operations(contract_id);
CREATE INDEX IF NOT EXISTS idx_operations_created_at ON operations(created_at);
