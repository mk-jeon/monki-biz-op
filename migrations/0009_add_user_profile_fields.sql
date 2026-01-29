-- 사용자 프로필 필드 추가
ALTER TABLE users ADD COLUMN nickname TEXT;
ALTER TABLE users ADD COLUMN phone TEXT;
ALTER TABLE users ADD COLUMN department TEXT; -- 디지털사업본부, 마케팅팀, 디지털사업팀, 운영파트
ALTER TABLE users ADD COLUMN position TEXT; -- 직책: 스태프, 시니어, 프로, 매니저, 파트장, 팀장, 그룹장, 본부장, CTO, SEVP, CEO
