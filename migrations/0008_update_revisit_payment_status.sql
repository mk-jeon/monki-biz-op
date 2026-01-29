-- 재방문 입금 상태 필드 추가
-- 입금상태: pending(입금대기), completed(입금완료), rejected(입금거부/비고)

ALTER TABLE installations ADD COLUMN revisit_1st_payment_status TEXT DEFAULT 'pending';
ALTER TABLE installations ADD COLUMN revisit_1st_payment_note TEXT;

ALTER TABLE installations ADD COLUMN revisit_2nd_payment_status TEXT DEFAULT 'pending';
ALTER TABLE installations ADD COLUMN revisit_2nd_payment_note TEXT;

ALTER TABLE installations ADD COLUMN revisit_3rd_payment_status TEXT DEFAULT 'pending';
ALTER TABLE installations ADD COLUMN revisit_3rd_payment_note TEXT;

ALTER TABLE installations ADD COLUMN revisit_4th_payment_status TEXT DEFAULT 'pending';
ALTER TABLE installations ADD COLUMN revisit_4th_payment_note TEXT;

ALTER TABLE installations ADD COLUMN revisit_5th_payment_status TEXT DEFAULT 'pending';
ALTER TABLE installations ADD COLUMN revisit_5th_payment_note TEXT;
