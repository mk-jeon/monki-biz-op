-- 가맹점 상세 정보 테이블 (franchises 테이블 대체)
DROP TABLE IF EXISTS franchises;

CREATE TABLE franchises (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- 기본정보
  franchise_name TEXT NOT NULL,           -- 가맹점명
  business_number TEXT,                   -- 사업자번호
  representative TEXT,                    -- 대표자
  contact TEXT,                           -- 연락처
  email TEXT,                             -- 이메일
  
  -- 계약정보
  contract_date DATE,                     -- 계약일
  contract_year TEXT,                     -- 연
  contract_month TEXT,                    -- 월
  contract_quarter TEXT,                  -- 분기
  installation_date DATE,                 -- 설치일
  termination_date DATE,                  -- 해지일
  contract_end_date DATE,                 -- 계약종료일
  installation_type TEXT,                 -- 설치구분 (신규/교체/이전/추가)
  contract_number TEXT,                   -- 계약번호
  operation_status TEXT DEFAULT 'active', -- 운영상태 (active/terminated/suspended)
  
  -- 주소정보
  region_type TEXT,                       -- 지역타입 (수도권/지방)
  region TEXT,                            -- 지역구분 (서울/경기/인천 등)
  district TEXT,                          -- 행정구역
  road_address TEXT,                      -- 도로명주소
  detail_address TEXT,                    -- 상세주소
  
  -- 결제정보
  bank_name TEXT,                         -- 은행명
  account_number TEXT,                    -- 계좌번호
  account_holder TEXT,                    -- 예금주
  unit_price INTEGER,                     -- 단가
  contract_type TEXT,                     -- 약정구분
  withdrawal_day INTEGER,                 -- 출금일
  rental_fee_total INTEGER,               -- 렌탈료 계
  
  -- 운영정보
  crm_type TEXT,                          -- CRM 구분
  ai_sales_type TEXT,                     -- Ai매출업
  rental_company TEXT,                    -- 렌탈사
  operation_type TEXT,                    -- 동작구분 (선불/후불)
  installation_manager TEXT,              -- 설치담당처
  management_agency TEXT,                 -- 관리대리점
  
  -- 장비정보
  model_name TEXT,                        -- 모델명
  pos_type TEXT,                          -- POS
  to_count INTEGER DEFAULT 0,             -- T/O 계
  quantity INTEGER DEFAULT 0,             -- 수량
  master_count INTEGER DEFAULT 0,         -- 마스터
  qr_count INTEGER DEFAULT 0,             -- QR
  stand_total INTEGER DEFAULT 0,          -- 거치대 계
  stand_standard INTEGER DEFAULT 0,       -- 표준
  stand_flat INTEGER DEFAULT 0,           -- 평판
  stand_extended INTEGER DEFAULT 0,       -- 확장
  charger_set INTEGER DEFAULT 0,          -- 충전기set
  router INTEGER DEFAULT 0,               -- 공유기
  battery INTEGER DEFAULT 0,              -- 배터리
  
  -- VAN/ASP 정보
  van_type TEXT,                          -- VAN
  asp_id TEXT,                            -- ASP ID
  asp_pw TEXT,                            -- ASP PW
  asp_url TEXT,                           -- ASP URL
  
  -- 기타
  notes TEXT,                             -- 비고
  
  -- 시스템 필드
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 인덱스 생성
CREATE INDEX idx_franchises_name ON franchises(franchise_name);
CREATE INDEX idx_franchises_business_number ON franchises(business_number);
CREATE INDEX idx_franchises_status ON franchises(operation_status);
CREATE INDEX idx_franchises_region ON franchises(region);
CREATE INDEX idx_franchises_contract_date ON franchises(contract_date);
