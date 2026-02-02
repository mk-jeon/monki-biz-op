-- ========================================
-- Migration: 50개 컬럼 완전 확장 (Phase 2 Complete)
-- Date: 2026-02-02
-- Purpose: 모든 테이블에 업무 필수 컬럼 추가
-- ========================================

-- ========================================
-- PART 1: Consultations 테이블 확장
-- ========================================

-- 기본 정보
ALTER TABLE consultations ADD COLUMN birth_date TEXT;
ALTER TABLE consultations ADD COLUMN email TEXT;
ALTER TABLE consultations ADD COLUMN business_number TEXT;
ALTER TABLE consultations ADD COLUMN representative TEXT;
ALTER TABLE consultations ADD COLUMN road_address TEXT;
ALTER TABLE consultations ADD COLUMN detail_address TEXT;
ALTER TABLE consultations ADD COLUMN region TEXT;
ALTER TABLE consultations ADD COLUMN region_type TEXT;

-- 금융 정보
ALTER TABLE consultations ADD COLUMN bank_name TEXT;
ALTER TABLE consultations ADD COLUMN account_number TEXT;
ALTER TABLE consultations ADD COLUMN account_holder TEXT;
ALTER TABLE consultations ADD COLUMN contract_type TEXT;
ALTER TABLE consultations ADD COLUMN withdrawal_day INTEGER;
ALTER TABLE consultations ADD COLUMN monthly_rental_fee INTEGER;
ALTER TABLE consultations ADD COLUMN deposit INTEGER;

-- H/W 정보: POS
ALTER TABLE consultations ADD COLUMN pos_agency TEXT;
ALTER TABLE consultations ADD COLUMN pos_vendor TEXT;
ALTER TABLE consultations ADD COLUMN pos_model TEXT;
ALTER TABLE consultations ADD COLUMN pos_program TEXT;
ALTER TABLE consultations ADD COLUMN asp_id TEXT;
ALTER TABLE consultations ADD COLUMN asp_password TEXT;
ALTER TABLE consultations ADD COLUMN asp_url TEXT;

-- H/W 정보: 테이블오더 & 거치대
ALTER TABLE consultations ADD COLUMN table_order_qty INTEGER DEFAULT 0;
ALTER TABLE consultations ADD COLUMN stand_standard INTEGER DEFAULT 0;
ALTER TABLE consultations ADD COLUMN stand_flat INTEGER DEFAULT 0;
ALTER TABLE consultations ADD COLUMN stand_extended INTEGER DEFAULT 0;
ALTER TABLE consultations ADD COLUMN charger_qty INTEGER DEFAULT 0;
ALTER TABLE consultations ADD COLUMN battery_qty INTEGER DEFAULT 0;

-- H/W 정보: 네트워크 & 기타
ALTER TABLE consultations ADD COLUMN router_qty INTEGER DEFAULT 0;
ALTER TABLE consultations ADD COLUMN kiosk_qty INTEGER DEFAULT 0;
ALTER TABLE consultations ADD COLUMN kitchen_printer_qty INTEGER DEFAULT 0;
ALTER TABLE consultations ADD COLUMN call_bell_qty INTEGER DEFAULT 0;

-- 관리 정보
ALTER TABLE consultations ADD COLUMN crm_service INTEGER DEFAULT 0;
ALTER TABLE consultations ADD COLUMN ai_sales_service INTEGER DEFAULT 0;

-- ========================================
-- PART 2: Contracts 테이블 확장
-- ========================================

-- 기본 정보
ALTER TABLE contracts ADD COLUMN birth_date TEXT;
ALTER TABLE contracts ADD COLUMN email TEXT;
ALTER TABLE contracts ADD COLUMN business_number TEXT;
ALTER TABLE contracts ADD COLUMN representative TEXT;
ALTER TABLE contracts ADD COLUMN road_address TEXT;
ALTER TABLE contracts ADD COLUMN detail_address TEXT;
ALTER TABLE contracts ADD COLUMN region TEXT;
ALTER TABLE contracts ADD COLUMN region_type TEXT;

-- 금융 정보
ALTER TABLE contracts ADD COLUMN bank_name TEXT;
ALTER TABLE contracts ADD COLUMN account_number TEXT;
ALTER TABLE contracts ADD COLUMN account_holder TEXT;
ALTER TABLE contracts ADD COLUMN contract_type TEXT;
ALTER TABLE contracts ADD COLUMN withdrawal_day INTEGER;
ALTER TABLE contracts ADD COLUMN monthly_rental_fee INTEGER;
ALTER TABLE contracts ADD COLUMN deposit INTEGER;
ALTER TABLE contracts ADD COLUMN contract_date DATE;
ALTER TABLE contracts ADD COLUMN contract_number TEXT;

-- H/W 정보: POS
ALTER TABLE contracts ADD COLUMN pos_agency TEXT;
ALTER TABLE contracts ADD COLUMN pos_vendor TEXT;
ALTER TABLE contracts ADD COLUMN pos_model TEXT;
ALTER TABLE contracts ADD COLUMN pos_program TEXT;
ALTER TABLE contracts ADD COLUMN asp_id TEXT;
ALTER TABLE contracts ADD COLUMN asp_password TEXT;
ALTER TABLE contracts ADD COLUMN asp_url TEXT;

-- H/W 정보: 테이블오더 & 거치대
ALTER TABLE contracts ADD COLUMN table_order_qty INTEGER DEFAULT 0;
ALTER TABLE contracts ADD COLUMN stand_standard INTEGER DEFAULT 0;
ALTER TABLE contracts ADD COLUMN stand_flat INTEGER DEFAULT 0;
ALTER TABLE contracts ADD COLUMN stand_extended INTEGER DEFAULT 0;
ALTER TABLE contracts ADD COLUMN charger_qty INTEGER DEFAULT 0;
ALTER TABLE contracts ADD COLUMN battery_qty INTEGER DEFAULT 0;

-- H/W 정보: 네트워크 & 기타
ALTER TABLE contracts ADD COLUMN router_qty INTEGER DEFAULT 0;
ALTER TABLE contracts ADD COLUMN kiosk_qty INTEGER DEFAULT 0;
ALTER TABLE contracts ADD COLUMN kitchen_printer_qty INTEGER DEFAULT 0;
ALTER TABLE contracts ADD COLUMN call_bell_qty INTEGER DEFAULT 0;

-- 관리 정보
ALTER TABLE contracts ADD COLUMN crm_service INTEGER DEFAULT 0;
ALTER TABLE contracts ADD COLUMN ai_sales_service INTEGER DEFAULT 0;

-- ========================================
-- PART 3: Installations 테이블 확장
-- ========================================

-- 기본 정보
ALTER TABLE installations ADD COLUMN birth_date TEXT;
ALTER TABLE installations ADD COLUMN email TEXT;
ALTER TABLE installations ADD COLUMN business_number TEXT;
ALTER TABLE installations ADD COLUMN representative TEXT;
ALTER TABLE installations ADD COLUMN road_address TEXT;
ALTER TABLE installations ADD COLUMN detail_address TEXT;
ALTER TABLE installations ADD COLUMN region TEXT;
ALTER TABLE installations ADD COLUMN region_type TEXT;

-- 금융 정보
ALTER TABLE installations ADD COLUMN bank_name TEXT;
ALTER TABLE installations ADD COLUMN account_number TEXT;
ALTER TABLE installations ADD COLUMN account_holder TEXT;
ALTER TABLE installations ADD COLUMN contract_type TEXT;
ALTER TABLE installations ADD COLUMN withdrawal_day INTEGER;
ALTER TABLE installations ADD COLUMN monthly_rental_fee INTEGER;
ALTER TABLE installations ADD COLUMN deposit INTEGER;
ALTER TABLE installations ADD COLUMN contract_date DATE;
ALTER TABLE installations ADD COLUMN contract_number TEXT;

-- H/W 정보: POS
ALTER TABLE installations ADD COLUMN pos_agency TEXT;
ALTER TABLE installations ADD COLUMN pos_vendor TEXT;
ALTER TABLE installations ADD COLUMN pos_model TEXT;
ALTER TABLE installations ADD COLUMN pos_program TEXT;
ALTER TABLE installations ADD COLUMN asp_id TEXT;
ALTER TABLE installations ADD COLUMN asp_password TEXT;
ALTER TABLE installations ADD COLUMN asp_url TEXT;

-- H/W 정보: 테이블오더 & 거치대
ALTER TABLE installations ADD COLUMN table_order_qty INTEGER DEFAULT 0;
ALTER TABLE installations ADD COLUMN stand_standard INTEGER DEFAULT 0;
ALTER TABLE installations ADD COLUMN stand_flat INTEGER DEFAULT 0;
ALTER TABLE installations ADD COLUMN stand_extended INTEGER DEFAULT 0;
ALTER TABLE installations ADD COLUMN charger_qty INTEGER DEFAULT 0;
ALTER TABLE installations ADD COLUMN battery_qty INTEGER DEFAULT 0;

-- H/W 정보: 네트워크 & 기타
ALTER TABLE installations ADD COLUMN router_qty INTEGER DEFAULT 0;
ALTER TABLE installations ADD COLUMN kiosk_qty INTEGER DEFAULT 0;
ALTER TABLE installations ADD COLUMN kitchen_printer_qty INTEGER DEFAULT 0;
ALTER TABLE installations ADD COLUMN call_bell_qty INTEGER DEFAULT 0;

-- 관리 정보
ALTER TABLE installations ADD COLUMN crm_service INTEGER DEFAULT 0;
ALTER TABLE installations ADD COLUMN ai_sales_service INTEGER DEFAULT 0;

-- ========================================
-- PART 4: Operations 테이블 확장
-- ========================================

-- 기본 정보
ALTER TABLE operations ADD COLUMN birth_date TEXT;
ALTER TABLE operations ADD COLUMN email TEXT;
ALTER TABLE operations ADD COLUMN business_number TEXT;
ALTER TABLE operations ADD COLUMN representative TEXT;
ALTER TABLE operations ADD COLUMN road_address TEXT;
ALTER TABLE operations ADD COLUMN detail_address TEXT;
ALTER TABLE operations ADD COLUMN region TEXT;
ALTER TABLE operations ADD COLUMN region_type TEXT;

-- 금융 정보
ALTER TABLE operations ADD COLUMN bank_name TEXT;
ALTER TABLE operations ADD COLUMN account_number TEXT;
ALTER TABLE operations ADD COLUMN account_holder TEXT;
ALTER TABLE operations ADD COLUMN contract_type TEXT;
ALTER TABLE operations ADD COLUMN withdrawal_day INTEGER;
ALTER TABLE operations ADD COLUMN monthly_rental_fee INTEGER;
ALTER TABLE operations ADD COLUMN deposit INTEGER;
ALTER TABLE operations ADD COLUMN contract_date DATE;
ALTER TABLE operations ADD COLUMN contract_number TEXT;

-- H/W 정보: POS
ALTER TABLE operations ADD COLUMN pos_agency TEXT;
ALTER TABLE operations ADD COLUMN pos_vendor TEXT;
ALTER TABLE operations ADD COLUMN pos_model TEXT;
ALTER TABLE operations ADD COLUMN pos_program TEXT;
ALTER TABLE operations ADD COLUMN asp_id TEXT;
ALTER TABLE operations ADD COLUMN asp_password TEXT;
ALTER TABLE operations ADD COLUMN asp_url TEXT;

-- H/W 정보: 테이블오더 & 거치대
ALTER TABLE operations ADD COLUMN table_order_qty INTEGER DEFAULT 0;
ALTER TABLE operations ADD COLUMN stand_standard INTEGER DEFAULT 0;
ALTER TABLE operations ADD COLUMN stand_flat INTEGER DEFAULT 0;
ALTER TABLE operations ADD COLUMN stand_extended INTEGER DEFAULT 0;
ALTER TABLE operations ADD COLUMN charger_qty INTEGER DEFAULT 0;
ALTER TABLE operations ADD COLUMN battery_qty INTEGER DEFAULT 0;

-- H/W 정보: 네트워크 & 기타
ALTER TABLE operations ADD COLUMN router_qty INTEGER DEFAULT 0;
ALTER TABLE operations ADD COLUMN kiosk_qty INTEGER DEFAULT 0;
ALTER TABLE operations ADD COLUMN kitchen_printer_qty INTEGER DEFAULT 0;
ALTER TABLE operations ADD COLUMN call_bell_qty INTEGER DEFAULT 0;

-- 관리 정보
ALTER TABLE operations ADD COLUMN crm_service INTEGER DEFAULT 0;
ALTER TABLE operations ADD COLUMN ai_sales_service INTEGER DEFAULT 0;

-- ========================================
-- PART 5: Franchises 테이블 확장
-- ========================================

-- 기본 정보
ALTER TABLE franchises ADD COLUMN birth_date TEXT;
ALTER TABLE franchises ADD COLUMN email TEXT;
ALTER TABLE franchises ADD COLUMN business_number TEXT;
ALTER TABLE franchises ADD COLUMN representative TEXT;
ALTER TABLE franchises ADD COLUMN road_address TEXT;
ALTER TABLE franchises ADD COLUMN detail_address TEXT;
ALTER TABLE franchises ADD COLUMN region TEXT;
ALTER TABLE franchises ADD COLUMN region_type TEXT;

-- 금융 정보
ALTER TABLE franchises ADD COLUMN bank_name TEXT;
ALTER TABLE franchises ADD COLUMN account_number TEXT;
ALTER TABLE franchises ADD COLUMN account_holder TEXT;
ALTER TABLE franchises ADD COLUMN contract_type TEXT;
ALTER TABLE franchises ADD COLUMN withdrawal_day INTEGER;
ALTER TABLE franchises ADD COLUMN monthly_rental_fee INTEGER;
ALTER TABLE franchises ADD COLUMN deposit INTEGER;
ALTER TABLE franchises ADD COLUMN contract_date DATE;
ALTER TABLE franchises ADD COLUMN contract_number TEXT;

-- H/W 정보: POS
ALTER TABLE franchises ADD COLUMN pos_agency TEXT;
ALTER TABLE franchises ADD COLUMN pos_vendor TEXT;
ALTER TABLE franchises ADD COLUMN pos_model TEXT;
ALTER TABLE franchises ADD COLUMN pos_program TEXT;
ALTER TABLE franchises ADD COLUMN asp_id TEXT;
ALTER TABLE franchises ADD COLUMN asp_password TEXT;
ALTER TABLE franchises ADD COLUMN asp_url TEXT;

-- H/W 정보: 테이블오더 & 거치대
ALTER TABLE franchises ADD COLUMN table_order_qty INTEGER DEFAULT 0;
ALTER TABLE franchises ADD COLUMN stand_standard INTEGER DEFAULT 0;
ALTER TABLE franchises ADD COLUMN stand_flat INTEGER DEFAULT 0;
ALTER TABLE franchises ADD COLUMN stand_extended INTEGER DEFAULT 0;
ALTER TABLE franchises ADD COLUMN charger_qty INTEGER DEFAULT 0;
ALTER TABLE franchises ADD COLUMN battery_qty INTEGER DEFAULT 0;

-- H/W 정보: 네트워크 & 기타
ALTER TABLE franchises ADD COLUMN router_qty INTEGER DEFAULT 0;
ALTER TABLE franchises ADD COLUMN kiosk_qty INTEGER DEFAULT 0;
ALTER TABLE franchises ADD COLUMN kitchen_printer_qty INTEGER DEFAULT 0;
ALTER TABLE franchises ADD COLUMN call_bell_qty INTEGER DEFAULT 0;

-- 관리 정보
ALTER TABLE franchises ADD COLUMN crm_service INTEGER DEFAULT 0;
ALTER TABLE franchises ADD COLUMN ai_sales_service INTEGER DEFAULT 0;
