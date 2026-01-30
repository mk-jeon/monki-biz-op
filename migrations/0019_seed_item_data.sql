-- 카테고리 등록
INSERT INTO item_categories (name, label, page, description, sort_order) VALUES
('inflow_source', '유입경로', 'consultation', '고객이 어떤 경로로 유입되었는지', 1);

INSERT INTO item_categories (name, label, page, description, sort_order) VALUES
('consultation_purpose', '상담목적', 'consultation', '상담의 주요 목적', 2);

INSERT INTO item_categories (name, label, page, description, sort_order) VALUES
('consultation_channel', '상담경로', 'consultation', '상담이 이루어진 채널', 3);

INSERT INTO item_categories (name, label, page, description, sort_order) VALUES
('contract_type', '계약유형', 'contract', '계약의 종류', 1);

INSERT INTO item_categories (name, label, page, description, sort_order) VALUES
('installation_type', '설치유형', 'installation', '설치의 종류', 1);

INSERT INTO item_categories (name, label, page, description, sort_order) VALUES
('department', '부서', 'common', '조직 부서', 1);

INSERT INTO item_categories (name, label, page, description, sort_order) VALUES
('position', '직책', 'common', '직위 및 직책', 2);

-- 유입경로 항목
INSERT INTO item_values (category_id, value, label, sort_order) VALUES (1, 'existing_customer', '기존 고객', 1);
INSERT INTO item_values (category_id, value, label, sort_order) VALUES (1, 'naver_search', '네이버 검색', 2);
INSERT INTO item_values (category_id, value, label, sort_order) VALUES (1, 'google_search', '구글 검색', 3);
INSERT INTO item_values (category_id, value, label, sort_order) VALUES (1, 'referral', '지인 추천', 4);
INSERT INTO item_values (category_id, value, label, sort_order) VALUES (1, 'phone_inquiry', '전화 문의', 5);
INSERT INTO item_values (category_id, value, label, sort_order) VALUES (1, 'homepage', '홈페이지', 6);
INSERT INTO item_values (category_id, value, label, sort_order) VALUES (1, 'other', '기타', 99);

-- 상담목적 항목
INSERT INTO item_values (category_id, value, label, sort_order) VALUES (2, 'new_contract', '신규 계약', 1);
INSERT INTO item_values (category_id, value, label, sort_order) VALUES (2, 'renewal', '계약 갱신', 2);
INSERT INTO item_values (category_id, value, label, sort_order) VALUES (2, 'inquiry', '문의사항', 3);
INSERT INTO item_values (category_id, value, label, sort_order) VALUES (2, 'complaint', '불만사항', 4);
INSERT INTO item_values (category_id, value, label, sort_order) VALUES (2, 'other', '기타', 99);

-- 상담경로 항목
INSERT INTO item_values (category_id, value, label, sort_order) VALUES (3, 'phone', '전화', 1);
INSERT INTO item_values (category_id, value, label, sort_order) VALUES (3, 'email', '이메일', 2);
INSERT INTO item_values (category_id, value, label, sort_order) VALUES (3, 'visit', '방문', 3);
INSERT INTO item_values (category_id, value, label, sort_order) VALUES (3, 'online', '온라인', 4);
INSERT INTO item_values (category_id, value, label, sort_order) VALUES (3, 'other', '기타', 99);

-- 계약유형 항목
INSERT INTO item_values (category_id, value, label, sort_order) VALUES (4, 'new', '신규', 1);
INSERT INTO item_values (category_id, value, label, sort_order) VALUES (4, 'renewal', '갱신', 2);
INSERT INTO item_values (category_id, value, label, sort_order) VALUES (4, 'upgrade', '업그레이드', 3);
INSERT INTO item_values (category_id, value, label, sort_order) VALUES (4, 'downgrade', '다운그레이드', 4);

-- 설치유형 항목
INSERT INTO item_values (category_id, value, label, sort_order) VALUES (5, 'new', '신규 설치', 1);
INSERT INTO item_values (category_id, value, label, sort_order) VALUES (5, 'replacement', '교체 설치', 2);
INSERT INTO item_values (category_id, value, label, sort_order) VALUES (5, 'relocation', '이전 설치', 3);
INSERT INTO item_values (category_id, value, label, sort_order) VALUES (5, 'additional', '추가 설치', 4);

-- 직책 항목
INSERT INTO item_values (category_id, value, label, sort_order) VALUES (7, 'staff', '사원', 1);
INSERT INTO item_values (category_id, value, label, sort_order) VALUES (7, 'senior_staff', '주임', 2);
INSERT INTO item_values (category_id, value, label, sort_order) VALUES (7, 'assistant_manager', '대리', 3);
INSERT INTO item_values (category_id, value, label, sort_order) VALUES (7, 'manager', '과장', 4);
INSERT INTO item_values (category_id, value, label, sort_order) VALUES (7, 'deputy_general_manager', '차장', 5);
INSERT INTO item_values (category_id, value, label, sort_order) VALUES (7, 'general_manager', '부장', 6);
INSERT INTO item_values (category_id, value, label, sort_order) VALUES (7, 'director', '이사', 7);
INSERT INTO item_values (category_id, value, label, sort_order) VALUES (7, 'senior_director', '상무', 8);
INSERT INTO item_values (category_id, value, label, sort_order) VALUES (7, 'executive_director', '전무', 9);
INSERT INTO item_values (category_id, value, label, sort_order) VALUES (7, 'vice_president', '부사장', 10);
INSERT INTO item_values (category_id, value, label, sort_order) VALUES (7, 'president', '사장', 11);
INSERT INTO item_values (category_id, value, label, sort_order) VALUES (7, 'ceo', '대표이사', 12);
