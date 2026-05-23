# 노션 기반 견적서 웹 뷰어 고도화 개발 로드맵

MVP(견적서 공개 뷰 + PDF 저장)를 기반으로, 발행자를 위한 관리자 견적서 목록·링크 공유·다크모드 경험을 추가해 운영 편의성과 사용성을 끌어올립니다.

---

## 전체 진행률

**MVP 18 / 18 완료** (100%) · **고도화 0 / 11 Tasks 진행 예정**

### Phase별 진행 현황

| Phase | 제목                            | Tasks | 진행률 | 상태   |
| ----- | ------------------------------- | ----- | ------ | ------ |
| 1     | 프로젝트 초기 설정 (MVP)        | 4     | 4/4    | 완료   |
| 2     | 공통 모듈/컴포넌트 (MVP)        | 4     | 4/4    | 완료   |
| 3     | 핵심 기능 개발 (MVP)            | 4     | 4/4    | 완료   |
| 4     | 추가 기능 개발 (MVP)            | 3     | 3/3    | 완료   |
| 5     | 최적화 및 배포 (MVP)            | 3     | 3/3    | 완료   |
| 6     | 관리자 골격 & 인증 구조         | 3     | 0/3    | 대기중 |
| 7     | 관리자 UI/UX (더미 데이터)      | 2     | 0/2    | 대기중 |
| 8     | 관리자 데이터 연동 & 링크 공유  | 3     | 0/3    | 대기중 |
| 9     | 다크모드 & 마무리               | 3     | 0/3    | 대기중 |

> 상태 표기: `대기중` → `진행중` → `완료`

---

## 개요

본 고도화는 MVP의 공개 견적서 뷰어 위에, 견적서를 **발행하는 사용자(관리자)**의 운영 흐름을 보강합니다.

- **관리자 견적서 목록**: 노션 Invoices DB의 전체 견적서를 한 화면에서 조회하고 상세 뷰로 이동
- **클라이언트 링크 복사**: 공개(`승인`) 견적서의 공유 URL을 목록에서 한 번에 클립보드로 복사
- **다크모드**: 시스템 설정 연동 + 사용자 토글 + `localStorage` 저장, 인쇄 시 항상 라이트모드

### 고도화 핵심 기능

- **F005 관리자 견적서 목록**: `/admin`에서 Invoices DB 전체 목록(번호·클라이언트·발행일·상태·금액)을 테이블/카드로 표시, 행 클릭 시 `/invoice/[slug]` 이동
- **F006 관리자 인증**: 미들웨어 + 환경 변수 패스워드 기반 경량 접근 제어로 `/admin` 외부 노출 방지
- **F007 링크 복사**: 각 행의 "링크 복사" 버튼 → 공개 견적서 URL을 클립보드 복사 + 토스트 피드백, `승인` 상태만 활성화
- **F008 다크모드**: `prefers-color-scheme` 연동, 토글 버튼, `localStorage` 저장, 인쇄 시 라이트모드 강제

### 사용자 여정 (고도화 반영)

1. **[발행자]** `/admin` 접속 → 패스워드 인증 → 견적서 목록 확인
2. **[발행자]** 목록에서 `승인` 견적서의 "링크 복사" 클릭 → 공유 URL 클립보드 복사 → 고객에게 전달
3. **[발행자/수신자]** 우상단 토글로 다크/라이트 전환 (설정은 `localStorage`에 유지)
4. **[수신자]** 공유 URL 접속 → 견적서 확인 → "PDF 다운로드" → 인쇄 시 항상 라이트모드로 깔끔하게 출력

### 기술 스택 (변경/추가)

- 기존: Next.js 15.5.x (App Router + Turbopack), React 19.1.0, TypeScript 5, TailwindCSS v4, shadcn/ui (new-york), `@notionhq/client` v5
- **추가**:
  - 관리자 인증: Next.js `middleware.ts` + 환경 변수(`ADMIN_PASSWORD`) 기반 쿠키 세션
  - 목록 조회: `notion.dataSources.query` (Invoices DB 데이터 소스 ID = `NOTION_DATABASE_ID`)
  - 다크모드: `next-themes`(권장) 또는 자체 `ThemeProvider` + `localStorage`
  - 토스트: 기존 `sonner`(이미 설치됨, `src/components/ui/sonner.tsx`) 재사용

---

## 아키텍처 / 설계 결정 사항

| 항목                  | 결정                                                                                          |
| --------------------- | --------------------------------------------------------------------------------------------- |
| **관리자 경로**       | `/admin` 신설. 공개 뷰(`/invoice/[slug]`)와 분리된 `app/admin/` 세그먼트 + 전용 레이아웃        |
| **관리자 인증**       | MVP 수준 경량 인증 — `middleware.ts`가 `/admin/*`를 보호, `ADMIN_PASSWORD` 일치 시 서명 쿠키 발급 |
| **목록 데이터 소스**  | Invoices DB(`NOTION_DATABASE_ID`)를 `dataSources.query`로 조회 → `InvoiceSummary[]` 변환        |
| **목록 vs 상세 타입** | 목록은 경량 `InvoiceSummary`(번호·클라이언트·발행일·상태·총액·slug)만 파싱, 상세는 기존 `Invoice` 재사용 |
| **링크 복사**         | `"use client"` 컴포넌트에서 `navigator.clipboard.writeText` + `sonner` 토스트, `승인`만 활성화   |
| **공유 URL 생성**     | `NEXT_PUBLIC_APP_URL`(또는 `VERCEL_URL`) + `/invoice/[slug]`로 절대 URL 조합                     |
| **다크모드 구현**     | `globals.css`에 이미 `@custom-variant dark`·`.dark` 토큰·`@media print` 존재 → 토글/저장/SSR 무점멸 처리에 집중 |
| **인쇄 시 라이트모드**| `@media print`에서 `.dark` 토큰을 라이트값으로 강제 오버라이드하여 PDF 가독성 보장               |
| **서버 전용 모듈 유지**| 목록 조회 로직도 `import "server-only"` 모듈(`src/lib/invoice-list.ts`)에 둔다                  |
| **기존 MVP 불변**     | 공개 뷰 데이터 흐름(`getInvoiceBySlug`)과 접근 제어는 그대로 유지, 회귀 없도록 보호             |

### 데이터 흐름 (고도화 추가분)

```
노션 Invoices DB (NOTION_DATABASE_ID)
  ↓  notion.dataSources.query (목록 전체)
src/lib/invoice-list.ts   — listInvoices(): InvoiceSummary[]  (server-only)
  ↓
src/app/admin/page.tsx    — RSC, 인증 통과 후 목록 렌더링
  ↓
src/components/admin/InvoiceListTable.tsx
  └─ 행: 번호 · 클라이언트 · 발행일 · 상태 배지 · 총액 · CopyLinkButton
       클릭 → /invoice/[slug] 이동

middleware.ts  — /admin/* 요청 가로채 쿠키 검증, 미인증 시 /admin/login 리다이렉트
```

---

## 개발 워크플로우

1. **작업 계획**: 기존 코드베이스를 학습하고 현재 상태를 파악한 뒤, 우선순위 작업을 마지막 완료 작업 다음에 삽입한다.
2. **작업 생성**: `/tasks` 디렉터리에 `XXX-description.md` 형식으로 작업 파일을 만든다. 고수준 명세·관련 파일·수락 기준·구현 단계를 정의하고, API/비즈니스 로직 작업은 "## 테스트 체크리스트 (Playwright MCP)"를 포함한다. 직전 완료 작업을 예시로 참조한다(초기 상태는 빈 체크박스, 변경 요약 없음).
3. **작업 구현**: 명세를 따라 구현하고, API 연동/비즈니스 로직은 Playwright MCP로 E2E 테스트를 수행한다. 각 단계 완료 후 진행 상황을 갱신하고 추가 지시를 기다린다.
4. **로드맵 업데이트**: 완료된 Task를 ✅로 표시하고 상단 진행률 테이블을 갱신한다.

---

## 개발 단계

### Phase 1~5: MVP (완료) ✅

> MVP 전체(18 Tasks)는 완료되었습니다. 상세 Task 내역은 `docs/roadmaps/ROADMAP_v1.md`를 참조하세요.

- **Phase 1: 프로젝트 초기 설정** ✅ — 환경 변수(Zod), 패키지 설치, 폴더 구조, `Invoice`/`LineItem`/`Issuer`/`Client` 타입 정의
- **Phase 2: 공통 모듈/컴포넌트** ✅ — Notion 클라이언트 싱글톤, Invoice 파서(`getInvoiceBySlug`), 포맷 유틸(`formatKRW`/`formatDate`), 견적서 섹션 UI 컴포넌트
- **Phase 3: 핵심 기능 개발** ✅ — 페이지 ID 조회, 견적서 뷰 페이지(ISR `revalidate=60`), 공개/비공개 접근 제어, 통합 테스트
- **Phase 4: 추가 기능 개발** ✅ — PDF 다운로드(`window.print()`), not-found 페이지, JSON API Route
- **Phase 5: 최적화 및 배포** ✅ — 인쇄 CSS(A4/`break-inside`), `React.cache` 캐싱, 로컬 E2E 검증 (Vercel 환경 변수 등록은 사용자 직접 수행)

---

### Phase 6: 관리자 골격 & 인증 구조

> **완료 기준**: `/admin` 라우트와 빈 페이지 골격, 관리자 전용 레이아웃, 미들웨어 기반 인증이 동작해 미인증 사용자는 로그인 페이지로 리다이렉트되고 인증 사용자는 빈 목록 페이지에 진입한다.

- **Task T019: 관리자 라우팅 구조 및 레이아웃 골격** - 우선순위
  - 관련 파일: `src/app/admin/layout.tsx`, `src/app/admin/page.tsx`, `src/app/admin/login/page.tsx`
  - Next.js App Router 기반 `/admin`, `/admin/login` 라우트의 빈 껍데기 페이지 생성
  - 관리자 전용 레이아웃 컴포넌트 골격 구현 (헤더 영역 + 본문 슬롯, 공개 뷰 레이아웃과 분리)
  - 헤더에 페이지 제목·테마 토글 자리(placeholder) 배치
  - `npm run dev`에서 `/admin` 접속 시 골격 렌더링 확인 (기능 없음)

- **Task T020: 관리자 데이터 타입 및 목록 조회 인터페이스 설계**
  - 관련 파일: `src/types/invoice.ts`, `src/lib/invoice-list.ts`(시그니처만)
  - 목록 전용 경량 타입 `InvoiceSummary` 정의 (`slug`, `invoiceNumber`, `clientName`, `issuedAt`, `status`, `total`, `isPublic`)
  - `listInvoices(): Promise<InvoiceSummary[]>` 함수 시그니처 및 docstring 정의 (구현은 T024)
  - `NOTION_DATABASE_ID`(Invoices DB 데이터 소스 ID) 환경 변수를 `src/lib/env.ts` Zod 스키마에 추가
  - `.env.example`에 `NOTION_DATABASE_ID`, `ADMIN_PASSWORD` 항목 추가

- **Task T021: 미들웨어 기반 관리자 인증 구현**
  - 관련 파일: `middleware.ts`, `src/app/admin/login/page.tsx`, `src/app/api/admin/login/route.ts`, `src/lib/env.ts`
  - `ADMIN_PASSWORD` 환경 변수를 Zod 스키마에 추가
  - `middleware.ts`에서 `matcher: ['/admin/:path*']`로 `/admin/*` 보호, 인증 쿠키 없으면 `/admin/login`으로 리다이렉트
  - 로그인 페이지: 패스워드 입력 폼(shadcn `input`/`button`/`form` 재사용) → `POST /api/admin/login`
  - 로그인 Route Handler: `ADMIN_PASSWORD` 일치 시 서명/만료 쿠키(`httpOnly`, `sameSite`) 발급, 불일치 시 401
  - 로그아웃 처리(쿠키 제거) 및 인증 실패 메시지 표시
  - **## 테스트 체크리스트 (Playwright MCP)**
    - `browser_navigate`로 미인증 상태 `/admin` 접속 → `/admin/login` 리다이렉트 확인
    - 잘못된 패스워드 입력 → 인증 실패 메시지 노출 및 진입 차단 확인
    - 올바른 패스워드 입력 → 쿠키 발급 후 `/admin` 진입 성공 확인
    - 로그아웃 후 `/admin` 재접속 시 다시 로그인 페이지로 리다이렉트 확인

---

### Phase 7: 관리자 UI/UX (더미 데이터)

> **완료 기준**: 더미 `InvoiceSummary[]`로 견적서 목록 화면이 완성되고(테이블/카드, 상태 배지, 정렬), 행 클릭 시 상세 뷰로 이동하며, 반응형 레이아웃이 데스크톱·모바일에서 깨지지 않는다.

- **Task T022: 관리자 목록 컴포넌트 및 더미 데이터 구현**
  - 관련 파일: `src/components/admin/InvoiceListTable.tsx`, `src/components/admin/StatusBadge.tsx`, `src/lib/dummy/invoices.ts`
  - `InvoiceSummary[]` 더미 데이터 생성 유틸 작성 (다양한 상태: `승인`/`대기`/`거절` 포함)
  - 데스크톱: 테이블(번호·클라이언트·발행일·상태 배지·총액·액션 열), 모바일: 카드 형태로 반응형 전환
  - 상태 배지 컴포넌트(`승인`=공개/`대기`/`거절` 색상 구분), 금액 `formatKRW`·날짜 `formatDate` 재사용
  - 발행일/금액 기준 정렬 또는 상태 필터 UI(클라이언트 측, 더미 데이터 기준) 골격
  - 빈 목록·로딩 상태(skeleton) 처리

- **Task T023: 관리자 페이지 조합 및 상세 뷰 네비게이션**
  - 관련 파일: `src/app/admin/page.tsx`, `src/components/admin/InvoiceListTable.tsx`
  - `/admin` 페이지에 목록 컴포넌트를 더미 데이터로 조합 렌더링
  - 각 행/카드 클릭 시 `/invoice/[slug]`로 이동(공개 뷰는 새 탭, 관리자 흐름 유지 고려)
  - 헤더에 견적서 개수·간단 요약 표시
  - **## 테스트 체크리스트 (Playwright MCP)**
    - `browser_navigate`로 (인증 우회/테스트 쿠키) `/admin` 접속 → `browser_snapshot`으로 목록 렌더링 확인
    - 행 클릭 → `/invoice/[slug]` 이동 동작 확인
    - `browser_resize` 데스크톱(1280px)·모바일(375px) 두 뷰포트에서 테이블↔카드 전환 및 레이아웃 검증

---

### Phase 8: 관리자 데이터 연동 & 링크 공유

> **완료 기준**: 더미 데이터가 실제 노션 Invoices DB 조회로 교체되어 전체 견적서가 목록에 표시되고, `승인` 견적서의 "링크 복사" 버튼이 공유 URL을 클립보드에 복사하며 토스트로 피드백한다.

- **Task T024: 노션 Invoices DB 목록 조회 구현** - 우선순위
  - 관련 파일: `src/lib/invoice-list.ts`, `src/app/admin/page.tsx`
  - `import "server-only"` 모듈에서 `notion.dataSources.query({ data_source_id: NOTION_DATABASE_ID })`로 전체 견적서 조회
  - 페이지네이션(`start_cursor`/`has_more`) 처리로 100건 초과 시에도 전체 수집
  - 노션 속성 → `InvoiceSummary` 변환 (`견적서 번호`/`클라이언트명`/`발행일`/`상태`/총액), 총액은 목록 단계에서 Items 비용을 고려해 성능 전략 결정(요약값 또는 지연 로딩)
  - `try/catch`로 API 오류 시 빈 배열 반환 + 에러 로깅
  - `/admin` 페이지에서 더미 데이터를 `listInvoices()` 실호출로 교체
  - **## 테스트 체크리스트 (Playwright MCP)**
    - `browser_navigate`로 인증 후 `/admin` 접속 → 실제 노션 견적서 목록 렌더링 확인
    - `browser_snapshot`으로 번호·클라이언트·발행일·상태·금액 값이 노션 데이터와 일치하는지 검증
    - 노션 응답 지연/오류 시 빈 목록·에러 처리(앱 크래시 없음) 확인
    - 100건 초과 시나리오(또는 모킹)에서 페이지네이션 누락 없이 전체 표시 확인

- **Task T025: 클라이언트 링크 복사 기능 구현**
  - 관련 파일: `src/components/admin/CopyLinkButton.tsx`, `src/components/ui/sonner.tsx`, `src/app/admin/layout.tsx`
  - `"use client"` `CopyLinkButton`: `navigator.clipboard.writeText(공유 URL)` 호출
  - 공유 URL = `NEXT_PUBLIC_APP_URL`(또는 `VERCEL_URL`) + `/invoice/[slug]`로 절대 URL 조합
  - 복사 성공/실패를 `sonner` 토스트로 피드백, 관리자 레이아웃에 `<Toaster />` 마운트
  - `승인`(공개) 상태 견적서만 버튼 활성화, 비공개는 비활성(툴팁으로 사유 안내)
  - `clipboard` API 미지원/HTTP 환경 fallback(임시 textarea 복사) 처리
  - **## 테스트 체크리스트 (Playwright MCP)**
    - `browser_navigate` 후 `승인` 견적서 행의 "링크 복사" 클릭 → `browser_evaluate`로 `navigator.clipboard.readText()` 값이 정확한 `/invoice/[slug]` URL인지 검증
    - 복사 성공 토스트 노출 확인
    - 비공개(`대기`/`거절`) 견적서의 복사 버튼 비활성 상태 확인
    - 복사 실패/미지원 환경에서 fallback 동작 및 실패 피드백 확인

- **Task T026: 관리자 기능 통합 테스트 (Playwright MCP)**
  - 관련 파일: `middleware.ts`, `src/app/admin/page.tsx`, `src/components/admin/*`
  - 전체 관리자 플로우 E2E: 로그인 → 목록 조회 → 링크 복사 → 상세 뷰 이동
  - 인증·목록·복사 기능 간 연동 및 비즈니스 로직 검증
  - 에러 핸들링/엣지 케이스: 빈 목록, 노션 오류, 만료 쿠키, 비공개 견적서 복사 차단
  - **## 테스트 체크리스트 (Playwright MCP)**
    - `browser_navigate`로 로그인 → 목록 → 복사 → 상세 이동 전체 플로우 무중단 확인
    - 만료/위조 쿠키로 `/admin` 접근 시 차단 확인
    - 빈 목록·노션 오류 상황에서 사용자 친화적 처리 확인
    - 데스크톱(1280px)·모바일(375px) 두 뷰포트 스냅샷 검증

---

### Phase 9: 다크모드 & 마무리

> **완료 기준**: 공개 뷰·관리자 페이지 전반에서 다크모드 토글이 동작하고, 시스템 설정 연동·`localStorage` 저장·SSR 무점멸(no-flash)이 보장되며, 인쇄 시 항상 라이트모드로 출력된다.

- **Task T027: 테마 프로바이더 및 다크모드 토글 구현**
  - 관련 파일: `src/app/layout.tsx`, `src/components/theme/ThemeProvider.tsx`, `src/components/theme/ThemeToggle.tsx`
  - `next-themes`(권장) 또는 자체 `ThemeProvider`로 `class` 전략(`html.dark`) 적용 — `globals.css`의 `@custom-variant dark`·`.dark` 토큰 활용
  - 루트 `layout.tsx`에 프로바이더 마운트, `suppressHydrationWarning`으로 SSR 무점멸 처리
  - `prefers-color-scheme` 시스템 설정 연동 + `localStorage` 사용자 설정 저장(시스템/라이트/다크 3-state)
  - `ThemeToggle` 버튼(Lucide 아이콘) — 관리자 헤더 및 공개 뷰 우상단(`print:hidden`) 배치

- **Task T028: 전체 화면 다크모드 적용 및 인쇄 라이트모드 강제**
  - 관련 파일: `src/app/globals.css`, `src/components/invoice/*`, `src/components/admin/*`
  - 공개 견적서 뷰 + 관리자 목록 전 컴포넌트에 다크모드 토큰 적용 및 대비/가독성 점검(하드코딩 색상 → 토큰화)
  - `@media print` 블록에서 `.dark` 토큰을 라이트값으로 강제 오버라이드 → PDF는 항상 라이트모드
  - 토글 버튼·관리자 액션 등 `print:hidden` 일관 적용 확인
  - **## 테스트 체크리스트 (Playwright MCP)**
    - `browser_navigate` 후 토글 클릭 → `html` 클래스 `dark` 토글 및 색상 전환 확인
    - 페이지 새로고침 후 `localStorage` 설정 유지 확인, `browser_emulate`로 `prefers-color-scheme: dark` 시 초기 다크 적용 확인
    - 다크모드 상태에서 인쇄 미리보기(또는 `print` 미디어 에뮬레이션) 시 라이트모드 출력 확인
    - 다크/라이트 양쪽에서 공개 뷰·관리자 페이지 스냅샷 대비 가독성 검증

- **Task T029: 최종 회귀 검증 · 빌드 · 배포 점검**
  - 관련 파일: 전체
  - MVP 공개 뷰 회귀 확인(견적서 조회·PDF·접근 제어가 고도화로 깨지지 않음)
  - `npm run check-all`(typecheck+lint+format) + `npm run build` 통과
  - `.env.example`·`README`·`CLAUDE.md`에 신규 환경 변수(`NOTION_DATABASE_ID`, `ADMIN_PASSWORD`, `NEXT_PUBLIC_APP_URL`) 반영
  - Vercel 환경 변수 등록 안내 및 프로덕션 동작 점검(사용자 직접 수행 항목 명시)
  - **## 테스트 체크리스트 (Playwright MCP)**
    - 공개 견적서 전체 플로우(조회 → PDF) 회귀 확인
    - 관리자 플로우(로그인 → 목록 → 복사 → 상세) 회귀 확인
    - 다크/라이트 + 데스크톱/모바일 조합 스냅샷 최종 검증

---

## 작업 진행 가이드

1. **Task 시작 전**: 해당 Task의 관련 파일과 세부 체크박스를 확인하고, `/tasks` 디렉터리의 직전 완료 작업을 예시로 참조한다.
2. **Task 진행 중**: 세부 체크박스를 하나씩 완료하며 체크하고, API/비즈니스 로직은 Playwright MCP로 검증한다.
3. **Task 완료 후**: 상단 진행률 테이블과 Task 상태를 `완료`(✅)로 업데이트하고, 완료 작업에는 `See: /tasks/XXX-xxx.md` 참조를 추가한다.
4. **Phase 전환 시**: 해당 Phase의 "완료 기준"을 만족하는지 검증한다.

> 상태 표기: `대기중` → `진행중` → `완료` / Task 완료 시 ✅, 즉시 착수 작업은 `- 우선순위`로 표기.
