-- 상담현황에 이관 플래그 추가
ALTER TABLE consultations ADD COLUMN migrated_to_contract INTEGER DEFAULT 0;
ALTER TABLE consultations ADD COLUMN migrated_at DATETIME;

-- 계약현황에 이관 플래그 추가
ALTER TABLE contracts ADD COLUMN migrated_to_installation INTEGER DEFAULT 0;
ALTER TABLE contracts ADD COLUMN migrated_at DATETIME;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_consultations_migrated ON consultations(migrated_to_contract);
CREATE INDEX IF NOT EXISTS idx_contracts_migrated ON contracts(migrated_to_installation);
