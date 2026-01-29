-- 설치현황 테이블 생성
CREATE TABLE IF NOT EXISTS installations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- 연결 정보
  contract_id INTEGER,
  consultation_id INTEGER,
  
  -- 고객 정보 (계약에서 복사)
  customer_name TEXT,
  phone TEXT NOT NULL,
  inflow_source TEXT,
  
  -- 설치 정보
  status TEXT DEFAULT 'waiting',  -- waiting(설치대기), in_progress(설치 중), hold(설치보류), completed(설치완료), cancelled(설치취소)
  
  -- 선설치 관련
  is_pre_installation INTEGER DEFAULT 0,  -- 선설치 건 여부
  contract_completed INTEGER DEFAULT 0,   -- 계약 완료 여부 (선설치 건용)
  
  -- 확인 체크리스트
  has_confirmation_doc INTEGER DEFAULT 0,  -- 설치확인서 유무
  has_photos INTEGER DEFAULT 0,            -- 설치사진 유무
  has_drive_upload INTEGER DEFAULT 0,      -- 드라이브 업로드 유무
  
  -- 재방문 관련
  revisit_1st INTEGER DEFAULT 0,           -- 1차 재방문 필요
  revisit_1st_paid INTEGER DEFAULT 0,      -- 1차 유상(1)/무상(0)
  revisit_1st_cost INTEGER DEFAULT 0,      -- 1차 비용
  revisit_1st_collected INTEGER DEFAULT 0, -- 1차 비용 수령 여부
  
  revisit_2nd INTEGER DEFAULT 0,
  revisit_2nd_paid INTEGER DEFAULT 0,
  revisit_2nd_cost INTEGER DEFAULT 0,
  revisit_2nd_collected INTEGER DEFAULT 0,
  
  revisit_3rd INTEGER DEFAULT 0,
  revisit_3rd_paid INTEGER DEFAULT 0,
  revisit_3rd_cost INTEGER DEFAULT 0,
  revisit_3rd_collected INTEGER DEFAULT 0,
  
  revisit_4th INTEGER DEFAULT 0,
  revisit_4th_paid INTEGER DEFAULT 0,
  revisit_4th_cost INTEGER DEFAULT 0,
  revisit_4th_collected INTEGER DEFAULT 0,
  
  revisit_5th INTEGER DEFAULT 0,
  revisit_5th_paid INTEGER DEFAULT 0,
  revisit_5th_cost INTEGER DEFAULT 0,
  revisit_5th_collected INTEGER DEFAULT 0,
  
  -- 메모
  notes TEXT,
  
  -- 이관 정보
  migrated_to_operation INTEGER DEFAULT 0,
  migrated_at DATETIME,
  
  -- 생성/수정 정보
  created_by INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_by INTEGER,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (contract_id) REFERENCES contracts(id),
  FOREIGN KEY (consultation_id) REFERENCES consultations(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_installations_contract ON installations(contract_id);
CREATE INDEX IF NOT EXISTS idx_installations_consultation ON installations(consultation_id);
CREATE INDEX IF NOT EXISTS idx_installations_status ON installations(status);
CREATE INDEX IF NOT EXISTS idx_installations_migrated ON installations(migrated_to_operation);
CREATE INDEX IF NOT EXISTS idx_installations_pre_installation ON installations(is_pre_installation);
CREATE INDEX IF NOT EXISTS idx_installations_created_at ON installations(created_at);
