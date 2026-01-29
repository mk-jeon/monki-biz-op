# 몽키비즈옵 (Monki-Biz-Op)

## 프로젝트 개요
- **이름**: 몽키비즈옵 (Monki-Biz-Op)
- **목표**: 통합 업무 플랫폼 구축
- **주요 기능**: 
  - 사용자 인증 및 권한 관리
  - 대시보드 (상담현황, 계약현황, 설치현황, 운영등재)
  - 권한 기반 메뉴 시스템
  - 반응형 UI/UX

## URLs
- **개발 서버**: https://3000-ikweelui4r2y3zoxxkatc-d0b9e1e2.sandbox.novita.ai
- **GitHub**: https://github.com/mk-jeon/monki-biz-op

## 로그인 정보
### 마스터 계정
- **아이디**: minhiti88
- **비밀번호**: Axieslin12!
- **권한**: 모든 권한 (master)

## 데이터 아키텍처
- **데이터 모델**:
  - Users (사용자)
  - Sessions (세션)
  - Permissions (권한)
- **스토리지 서비스**: Cloudflare D1 (SQLite)
- **인증 방식**: 세션 기반 인증 (쿠키)

## 현재 구현된 기능

### ✅ 완료된 기능
1. **로그인 시스템**
   - 사용자 인증 (아이디/비밀번호)
   - 세션 관리 (24시간 유지)
   - 로그아웃 기능

2. **대시보드**
   - 4개 주요 현황 카드 (상담/계약/설치/운영)
   - 실시간 진행 건수 표시 (현재 0건)
   - 카드 클릭 시 상세 페이지 이동

3. **좌측 메뉴바**
   - 사용자 정보 표시
   - 홈/앞으로/뒤로 네비게이션 버튼
   - 권한 기반 메뉴 표시
   - 서브메뉴 지원 (접기/펼치기)
   - 사이드바 토글 (축소/확장)

4. **메뉴 구성**
   - 공지사항
   - 상담현황
   - 계약현황
   - 설치현황
   - 운영등재
   - 가맹점현황
   - 정산관리 (서브메뉴: CMS/CRM/Ai매출업/대시보드)
   - 재고관리 (서브메뉴: 현황/요청/반납/대여/대시보드)
   - CS관리 (서브메뉴: 인바운드/방문A/S/H/W QA)
   - 관리자 메뉴 (서브메뉴: 사용자/로케이션/페이지/항목/품목 관리)

5. **권한 시스템**
   - 역할 기반 접근 제어 (master, admin, user)
   - 메뉴별 권한 설정
   - 관리자 메뉴는 master/admin만 접근

### 🚧 준비 중인 기능
- 각 페이지 상세 구현 (리스트형식/칸반형식)
- 드래그앤드롭 기능
- 양식 다운로드/업로드 기능
- 정산 전용 디자인
- 재고 대시보드
- 사용자 관리 페이지
- 로케이션/페이지/항목/품목 관리

## 사용자 가이드

### 로그인
1. 브라우저에서 https://3000-ikweelui4r2y3zoxxkatc-d0b9e1e2.sandbox.novita.ai 접속
2. 마스터 계정 정보 입력 (minhiti88 / Axieslin12!)
3. 로그인 버튼 클릭

### 대시보드 사용
1. 로그인 후 자동으로 대시보드로 이동
2. 4개의 현황 카드에서 각 업무 진행 상황 확인
3. 카드 클릭 시 상세 페이지로 이동 (준비중)

### 메뉴 탐색
1. 좌측 사이드바에서 원하는 메뉴 선택
2. 서브메뉴가 있는 경우 클릭하여 펼치기/접기
3. 사이드바 상단의 햄버거 버튼으로 축소/확장 가능

### 네비게이션
- **홈 버튼**: 대시보드로 돌아가기
- **뒤로 버튼**: 이전 페이지로
- **앞으로 버튼**: 다음 페이지로

### 로그아웃
- 좌측 하단의 로그아웃 버튼 클릭
- 확인 후 로그인 페이지로 이동

## 배포

### 로컬 개발
```bash
# 빌드
npm run build

# 데이터베이스 마이그레이션
npm run db:migrate:local

# 개발 서버 시작 (PM2)
pm2 start ecosystem.config.cjs

# 서버 확인
curl http://localhost:3000
```

### Cloudflare Pages 배포
```bash
# Cloudflare 인증 설정 필요
# API 키 설정 후 배포
npm run deploy:prod
```

### 플랫폼
- **플랫폼**: Cloudflare Pages + Workers
- **상태**: ✅ 개발 서버 실행 중
- **기술 스택**: 
  - Backend: Hono + TypeScript
  - Frontend: Vanilla JS + TailwindCSS
  - Database: Cloudflare D1 (SQLite)
  - 인증: bcrypt + Session Cookie
- **마지막 업데이트**: 2026-01-29

## 개발 정보

### 프로젝트 구조
```
/home/user/webapp/
├── src/
│   ├── index.tsx           # 메인 애플리케이션
│   ├── types.ts            # TypeScript 타입 정의
│   ├── lib/
│   │   └── auth.ts         # 인증 유틸리티
│   ├── middleware/
│   │   └── auth.ts         # 인증 미들웨어
│   └── routes/
│       └── auth.ts         # 인증 API 라우트
├── public/static/
│   ├── app.js              # 대시보드 JavaScript
│   └── login.js            # 로그인 JavaScript
├── migrations/
│   └── 0001_initial_schema.sql  # 데이터베이스 스키마
├── ecosystem.config.cjs    # PM2 설정
├── wrangler.jsonc          # Cloudflare 설정
└── package.json
```

### API 엔드포인트
- `POST /api/auth/login` - 로그인
- `POST /api/auth/logout` - 로그아웃
- `GET /api/auth/me` - 현재 사용자 정보

## 다음 개발 단계
1. 공지사항 게시판 구현
2. 상담현황 페이지 (리스트/칸반 뷰)
3. 계약현황 페이지 (리스트/칸반 뷰 + 드래그앤드롭)
4. 설치현황 페이지
5. 운영등재 페이지
6. 가맹점현황 테이블
7. 정산관리 페이지들
8. 재고관리 시스템
9. CS관리 시스템
10. 관리자 페이지들
