-- ========================================
-- 항목 관리 카테고리 Prefix 매핑 테이블 생성
-- 자동 코드 생성을 위한 Prefix 관리
-- ========================================

CREATE TABLE IF NOT EXISTS item_category_prefixes (
  category_name TEXT PRIMARY KEY,
  prefix TEXT NOT NULL UNIQUE,
  next_sequence INTEGER DEFAULT 1,
  description TEXT
);

-- Prefix 매핑 데이터 삽입
INSERT OR IGNORE INTO item_category_prefixes (category_name, prefix, next_sequence, description) VALUES
-- 상담 관련
('inflow_source', 'CST_IN', 1, '상담 유입경로'),
('consulting_purpose', 'CST_PUR', 1, '상담 목적'),
('consulting_route', 'CST_ROU', 1, '상담 경로'),

-- 계약 관련
('contract_type', 'CTR_TYP', 1, '약정 구분'),

-- 설치 관련
('installation_type', 'INS_TYP', 1, '설치 유형'),

-- 공통 정보
('department', 'DEPT', 1, '부서'),
('position', 'POS', 1, '직책'),

-- 금융 정보
('bank', 'BANK', 1, '은행명'),

-- 지역 정보
('region', 'RGN', 1, '지역 (수도권/지방)'),
('region_type', 'RGN_TYP', 1, '지역 타입 (광역시/시/군)'),

-- POS 관련
('pos_agency', 'POS_AGY', 1, 'POS 대리점 (자사/타사)'),
('pos_vendor', 'POS_VEN', 1, 'POS 밴사'),
('pos_model', 'POS_MDL', 1, 'POS 모델명'),
('pos_program', 'POS_PRG', 1, 'POS 프로그램 (OK/Easy/Expert/Union)'),

-- 하드웨어
('hardware_model', 'HW_MDL', 1, '하드웨어 모델명'),
('stand_type', 'HW_STD', 1, '거치대 타입'),

-- 네트워크
('telecom', 'TEL', 1, '통신사'),
('network_type', 'NET_TYP', 1, '네트워크 타입 (유선/무선)');

-- ========================================
-- 항목 관리 카테고리 대폭 확장
-- ========================================

-- 기존 카테고리 삭제 (재생성)
DELETE FROM item_categories;

-- 카테고리 재삽입 (확장)
INSERT INTO item_categories (name, label, page, description, sort_order) VALUES
-- 상담현황 (Consultation)
('inflow_source', '유입경로', 'consultation', '고객이 어떤 경로로 상담을 신청했는지', 1),
('consulting_purpose', '상담목적', 'consultation', '고객의 상담 목적', 2),
('consulting_route', '상담경로', 'consultation', '상담이 진행된 경로 (전화/방문/온라인 등)', 3),

-- 계약현황 (Contract)
('contract_type', '약정구분', 'contract', '계약 약정 구분 (24개월/36개월 등)', 4),

-- 설치현황 (Installation)
('installation_type', '설치유형', 'installation', '설치 유형 (신규설치/교체설치 등)', 5),

-- 공통 (Common)
('department', '부서', 'common', '직원 소속 부서', 100),
('position', '직책', 'common', '직원 직책', 101),

-- 금융 정보 (Finance)
('bank', '은행명', 'finance', '계좌 은행명', 200),

-- 지역 정보 (Location)
('region', '지역구분', 'location', '수도권/지방 구분', 300),
('region_type', '지역타입', 'location', '광역시/시/군 구분', 301),

-- POS 관련 (POS)
('pos_agency', 'POS 대리점', 'pos', '자사/타사 구분', 400),
('pos_vendor', 'POS 밴사', 'pos', 'POS 밴 업체', 401),
('pos_model', 'POS 모델명', 'pos', 'POS 기기 모델명', 402),
('pos_program', 'POS 프로그램', 'pos', 'POS 프로그램 종류', 403),

-- 하드웨어 (Hardware)
('hardware_model', '하드웨어 모델명', 'hardware', '테이블오더/키오스크 모델명', 500),
('stand_type', '거치대 타입', 'hardware', '표준/평판/확장 거치대', 501),

-- 네트워크 (Network)
('telecom', '통신사', 'network', '네트워크 통신사', 600),
('network_type', '네트워크 타입', 'network', '유선/무선 구분', 601);

-- ========================================
-- 항목 값 (Item Values) 시드 데이터
-- ========================================

-- 기존 값 삭제
DELETE FROM item_values;

-- 자동 코드 생성 시뮬레이션 (실제는 API에서 자동 생성)
-- 여기서는 예시 데이터만 수동 삽입

-- 유입경로 (inflow_source)
INSERT INTO item_values (category_id, value, label, sort_order, is_active) VALUES
((SELECT id FROM item_categories WHERE name = 'inflow_source'), 'CST_IN_0001', '네이버 검색', 1, 1),
((SELECT id FROM item_categories WHERE name = 'inflow_source'), 'CST_IN_0002', '구글 검색', 2, 1),
((SELECT id FROM item_categories WHERE name = 'inflow_source'), 'CST_IN_0003', '인스타그램', 3, 1),
((SELECT id FROM item_categories WHERE name = 'inflow_source'), 'CST_IN_0004', '페이스북', 4, 1),
((SELECT id FROM item_categories WHERE name = 'inflow_source'), 'CST_IN_0005', '지인 추천', 5, 1),
((SELECT id FROM item_categories WHERE name = 'inflow_source'), 'CST_IN_0006', '전화 문의', 6, 1);

-- 상담목적 (consulting_purpose)
INSERT INTO item_values (category_id, value, label, sort_order, is_active) VALUES
((SELECT id FROM item_categories WHERE name = 'consulting_purpose'), 'CST_PUR_0001', '신규 도입', 1, 1),
((SELECT id FROM item_categories WHERE name = 'consulting_purpose'), 'CST_PUR_0002', '교체', 2, 1),
((SELECT id FROM item_categories WHERE name = 'consulting_purpose'), 'CST_PUR_0003', '추가 설치', 3, 1),
((SELECT id FROM item_categories WHERE name = 'consulting_purpose'), 'CST_PUR_0004', '견적 문의', 4, 1);

-- 상담경로 (consulting_route)
INSERT INTO item_values (category_id, value, label, sort_order, is_active) VALUES
((SELECT id FROM item_categories WHERE name = 'consulting_route'), 'CST_ROU_0001', '전화 상담', 1, 1),
((SELECT id FROM item_categories WHERE name = 'consulting_route'), 'CST_ROU_0002', '방문 상담', 2, 1),
((SELECT id FROM item_categories WHERE name = 'consulting_route'), 'CST_ROU_0003', '온라인 상담', 3, 1),
((SELECT id FROM item_categories WHERE name = 'consulting_route'), 'CST_ROU_0004', '카카오톡', 4, 1);

-- 약정구분 (contract_type)
INSERT INTO item_values (category_id, value, label, sort_order, is_active) VALUES
((SELECT id FROM item_categories WHERE name = 'contract_type'), 'CTR_TYP_0001', '24개월 약정', 1, 1),
((SELECT id FROM item_categories WHERE name = 'contract_type'), 'CTR_TYP_0002', '36개월 약정', 2, 1),
((SELECT id FROM item_categories WHERE name = 'contract_type'), 'CTR_TYP_0003', '48개월 약정', 3, 1),
((SELECT id FROM item_categories WHERE name = 'contract_type'), 'CTR_TYP_0004', '무약정', 4, 1);

-- 설치유형 (installation_type)
INSERT INTO item_values (category_id, value, label, sort_order, is_active) VALUES
((SELECT id FROM item_categories WHERE name = 'installation_type'), 'INS_TYP_0001', '신규 설치', 1, 1),
((SELECT id FROM item_categories WHERE name = 'installation_type'), 'INS_TYP_0002', '교체 설치', 2, 1),
((SELECT id FROM item_categories WHERE name = 'installation_type'), 'INS_TYP_0003', '추가 설치', 3, 1);

-- 부서 (department)
INSERT INTO item_values (category_id, value, label, sort_order, is_active) VALUES
((SELECT id FROM item_categories WHERE name = 'department'), 'DEPT_0001', '영업팀', 1, 1),
((SELECT id FROM item_categories WHERE name = 'department'), 'DEPT_0002', '기술팀', 2, 1),
((SELECT id FROM item_categories WHERE name = 'department'), 'DEPT_0003', '관리팀', 3, 1),
((SELECT id FROM item_categories WHERE name = 'department'), 'DEPT_0004', 'CS팀', 4, 1);

-- 직책 (position)
INSERT INTO item_values (category_id, value, label, sort_order, is_active) VALUES
((SELECT id FROM item_categories WHERE name = 'position'), 'POS_0001', '팀장', 1, 1),
((SELECT id FROM item_categories WHERE name = 'position'), 'POS_0002', '대리', 2, 1),
((SELECT id FROM item_categories WHERE name = 'position'), 'POS_0003', '사원', 3, 1);

-- 은행명 (bank)
INSERT INTO item_values (category_id, value, label, sort_order, is_active) VALUES
((SELECT id FROM item_categories WHERE name = 'bank'), 'BANK_0001', 'KB국민은행', 1, 1),
((SELECT id FROM item_categories WHERE name = 'bank'), 'BANK_0002', '신한은행', 2, 1),
((SELECT id FROM item_categories WHERE name = 'bank'), 'BANK_0003', '우리은행', 3, 1),
((SELECT id FROM item_categories WHERE name = 'bank'), 'BANK_0004', '하나은행', 4, 1),
((SELECT id FROM item_categories WHERE name = 'bank'), 'BANK_0005', 'NH농협은행', 5, 1),
((SELECT id FROM item_categories WHERE name = 'bank'), 'BANK_0006', '기업은행', 6, 1),
((SELECT id FROM item_categories WHERE name = 'bank'), 'BANK_0007', '카카오뱅크', 7, 1),
((SELECT id FROM item_categories WHERE name = 'bank'), 'BANK_0008', '토스뱅크', 8, 1),
((SELECT id FROM item_categories WHERE name = 'bank'), 'BANK_0009', 'SC제일은행', 9, 1),
((SELECT id FROM item_categories WHERE name = 'bank'), 'BANK_0010', '부산은행', 10, 1);

-- 지역구분 (region)
INSERT INTO item_values (category_id, value, label, sort_order, is_active) VALUES
((SELECT id FROM item_categories WHERE name = 'region'), 'RGN_0001', '수도권', 1, 1),
((SELECT id FROM item_categories WHERE name = 'region'), 'RGN_0002', '지방', 2, 1);

-- 지역타입 (region_type)
INSERT INTO item_values (category_id, value, label, sort_order, is_active) VALUES
((SELECT id FROM item_categories WHERE name = 'region_type'), 'RGN_TYP_0001', '광역시', 1, 1),
((SELECT id FROM item_categories WHERE name = 'region_type'), 'RGN_TYP_0002', '시', 2, 1),
((SELECT id FROM item_categories WHERE name = 'region_type'), 'RGN_TYP_0003', '군', 3, 1);

-- POS 대리점 (pos_agency)
INSERT INTO item_values (category_id, value, label, sort_order, is_active) VALUES
((SELECT id FROM item_categories WHERE name = 'pos_agency'), 'POS_AGY_0001', '자사', 1, 1),
((SELECT id FROM item_categories WHERE name = 'pos_agency'), 'POS_AGY_0002', '타사', 2, 1);

-- POS 밴사 (pos_vendor)
INSERT INTO item_values (category_id, value, label, sort_order, is_active) VALUES
((SELECT id FROM item_categories WHERE name = 'pos_vendor'), 'POS_VEN_0001', 'NICE', 1, 1),
((SELECT id FROM item_categories WHERE name = 'pos_vendor'), 'POS_VEN_0002', 'KIS', 2, 1),
((SELECT id FROM item_categories WHERE name = 'pos_vendor'), 'POS_VEN_0003', 'KSNET', 3, 1),
((SELECT id FROM item_categories WHERE name = 'pos_vendor'), 'POS_VEN_0004', 'KICC', 4, 1);

-- POS 모델명 (pos_model)
INSERT INTO item_values (category_id, value, label, sort_order, is_active) VALUES
((SELECT id FROM item_categories WHERE name = 'pos_model'), 'POS_MDL_0001', 'SUNMI T2', 1, 1),
((SELECT id FROM item_categories WHERE name = 'pos_model'), 'POS_MDL_0002', 'SUNMI T2 Mini', 2, 1),
((SELECT id FROM item_categories WHERE name = 'pos_model'), 'POS_MDL_0003', 'SUNMI P2', 3, 1),
((SELECT id FROM item_categories WHERE name = 'pos_model'), 'POS_MDL_0004', 'PAX A920', 4, 1);

-- POS 프로그램 (pos_program)
INSERT INTO item_values (category_id, value, label, sort_order, is_active) VALUES
((SELECT id FROM item_categories WHERE name = 'pos_program'), 'POS_PRG_0001', 'OK포스', 1, 1),
((SELECT id FROM item_categories WHERE name = 'pos_program'), 'POS_PRG_0002', 'Easy포스', 2, 1),
((SELECT id FROM item_categories WHERE name = 'pos_program'), 'POS_PRG_0003', 'Expert포스', 3, 1),
((SELECT id FROM item_categories WHERE name = 'pos_program'), 'POS_PRG_0004', 'Union포스', 4, 1);

-- 하드웨어 모델명 (hardware_model)
INSERT INTO item_values (category_id, value, label, sort_order, is_active) VALUES
((SELECT id FROM item_categories WHERE name = 'hardware_model'), 'HW_MDL_0001', '테이블오더 10인치', 1, 1),
((SELECT id FROM item_categories WHERE name = 'hardware_model'), 'HW_MDL_0002', '테이블오더 8인치', 2, 1),
((SELECT id FROM item_categories WHERE name = 'hardware_model'), 'HW_MDL_0003', '키오스크 21인치', 3, 1),
((SELECT id FROM item_categories WHERE name = 'hardware_model'), 'HW_MDL_0004', '키오스크 27인치', 4, 1);

-- 거치대 타입 (stand_type)
INSERT INTO item_values (category_id, value, label, sort_order, is_active) VALUES
((SELECT id FROM item_categories WHERE name = 'stand_type'), 'HW_STD_0001', '표준 거치대', 1, 1),
((SELECT id FROM item_categories WHERE name = 'stand_type'), 'HW_STD_0002', '평판 거치대', 2, 1),
((SELECT id FROM item_categories WHERE name = 'stand_type'), 'HW_STD_0003', '확장 거치대', 3, 1);

-- 통신사 (telecom)
INSERT INTO item_values (category_id, value, label, sort_order, is_active) VALUES
((SELECT id FROM item_categories WHERE name = 'telecom'), 'TEL_0001', 'SKT', 1, 1),
((SELECT id FROM item_categories WHERE name = 'telecom'), 'TEL_0002', 'KT', 2, 1),
((SELECT id FROM item_categories WHERE name = 'telecom'), 'TEL_0003', 'LG U+', 3, 1);

-- 네트워크 타입 (network_type)
INSERT INTO item_values (category_id, value, label, sort_order, is_active) VALUES
((SELECT id FROM item_categories WHERE name = 'network_type'), 'NET_TYP_0001', '유선', 1, 1),
((SELECT id FROM item_categories WHERE name = 'network_type'), 'NET_TYP_0002', '무선', 2, 1),
((SELECT id FROM item_categories WHERE name = 'network_type'), 'NET_TYP_0003', '유무선 혼용', 3, 1);

-- Prefix 테이블의 next_sequence 업데이트
UPDATE item_category_prefixes SET next_sequence = 7 WHERE category_name = 'inflow_source';
UPDATE item_category_prefixes SET next_sequence = 5 WHERE category_name = 'consulting_purpose';
UPDATE item_category_prefixes SET next_sequence = 5 WHERE category_name = 'consulting_route';
UPDATE item_category_prefixes SET next_sequence = 5 WHERE category_name = 'contract_type';
UPDATE item_category_prefixes SET next_sequence = 4 WHERE category_name = 'installation_type';
UPDATE item_category_prefixes SET next_sequence = 5 WHERE category_name = 'department';
UPDATE item_category_prefixes SET next_sequence = 4 WHERE category_name = 'position';
UPDATE item_category_prefixes SET next_sequence = 11 WHERE category_name = 'bank';
UPDATE item_category_prefixes SET next_sequence = 3 WHERE category_name = 'region';
UPDATE item_category_prefixes SET next_sequence = 4 WHERE category_name = 'region_type';
UPDATE item_category_prefixes SET next_sequence = 3 WHERE category_name = 'pos_agency';
UPDATE item_category_prefixes SET next_sequence = 5 WHERE category_name = 'pos_vendor';
UPDATE item_category_prefixes SET next_sequence = 5 WHERE category_name = 'pos_model';
UPDATE item_category_prefixes SET next_sequence = 5 WHERE category_name = 'pos_program';
UPDATE item_category_prefixes SET next_sequence = 5 WHERE category_name = 'hardware_model';
UPDATE item_category_prefixes SET next_sequence = 4 WHERE category_name = 'stand_type';
UPDATE item_category_prefixes SET next_sequence = 4 WHERE category_name = 'telecom';
UPDATE item_category_prefixes SET next_sequence = 4 WHERE category_name = 'network_type';
