-- ========================================
-- Migration: Phase 2 - 핵심 컬럼만 추가 (기존 컬럼 제외)
-- Date: 2026-02-02
-- Purpose: 중복 없이 필수 컬럼만 추가
-- ========================================

-- ========================================
-- Operations 테이블: 첨부 증빙 컬럼 추가
-- ========================================
ALTER TABLE operations ADD COLUMN contract_checked INTEGER DEFAULT 0;
ALTER TABLE operations ADD COLUMN installation_cert_checked INTEGER DEFAULT 0;
ALTER TABLE operations ADD COLUMN installation_photo_checked INTEGER DEFAULT 0;

-- ========================================
-- RBAC (권한 관리) 기초 테이블 생성
-- ========================================

CREATE TABLE IF NOT EXISTS pages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  path TEXT,
  group_name TEXT,
  is_active INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS role_permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role TEXT NOT NULL,
  page_id INTEGER NOT NULL,
  can_read INTEGER DEFAULT 0,
  can_write INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (page_id) REFERENCES pages(id)
);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role);
CREATE INDEX IF NOT EXISTS idx_role_permissions_page_id ON role_permissions(page_id);

-- ========================================
-- 기본 페이지 데이터 시딩
-- ========================================

INSERT OR IGNORE INTO pages (name, display_name, path, group_name, sort_order) VALUES
  ('dashboard', '업무 대시보드', '/dashboard', 'main', 1),
  ('notice', '공지사항', '/notice', 'main', 2),
  ('consultation', '상담현황', '/consultation', 'main', 10),
  ('contract', '계약현황', '/contract', 'main', 11),
  ('installation', '설치현황', '/installation', 'main', 12),
  ('operation', '운영등재', '/operation', 'main', 13),
  ('franchise', '가맹점현황', '/franchise', 'main', 14),
  ('user-management', '사용자 관리', '/user-management', 'admin', 50),
  ('item-management', '항목 관리', '/item-management', 'admin', 51);

-- ========================================
-- Master 계정 전체 권한 부여
-- ========================================

INSERT OR IGNORE INTO role_permissions (role, page_id, can_read, can_write)
SELECT 'master', id, 1, 1 FROM pages;

INSERT OR IGNORE INTO role_permissions (role, page_id, can_read, can_write)
SELECT 'admin', id, 1, 
  CASE 
    WHEN name IN ('user-management') THEN 0 
    ELSE 1 
  END
FROM pages;

INSERT OR IGNORE INTO role_permissions (role, page_id, can_read, can_write)
SELECT 'user', id, 
  CASE 
    WHEN group_name IN ('main') THEN 1 
    ELSE 0 
  END,
  0
FROM pages
WHERE group_name IN ('main');
