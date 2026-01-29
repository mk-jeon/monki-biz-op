-- 상담현황 및 계약현황 데이터 초기화

-- 계약현황 데이터 삭제
DELETE FROM contracts;

-- 상담현황 데이터 삭제
DELETE FROM consultations;

-- AUTO_INCREMENT 초기화 (SQLite는 자동으로 처리됨)
DELETE FROM sqlite_sequence WHERE name IN ('consultations', 'contracts');

-- 확인
SELECT 'consultations' as table_name, COUNT(*) as count FROM consultations
UNION ALL
SELECT 'contracts' as table_name, COUNT(*) as count FROM contracts;
