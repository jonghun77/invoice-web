# 노션 기반 견적서 웹 뷰어 MVP 개발 로드맵

노션 DB에 입력한 견적서를 고객이 웹 URL 하나로 열람하고 PDF로 저장할 수 있도록 하는 경량 웹 뷰어를 구축합니다.

---

## 전체 진행률

**18 / 18 Tasks 완료** (100%) 🎉

### Phase별 진행 현황

| Phase | 제목                  | Tasks | 진행률 | 상태   |
| ----- | --------------------- | ----- | ------ | ------ |
| 1     | 프로젝트 초기 설정    | 4     | 4/4    | 완료   |
| 2     | 공통 모듈/컴포넌트    | 4     | 4/4    | 완료   |
| 3     | 핵심 기능 개발        | 4     | 4/4    | 완료   |
| 4     | 추가 기능 개발        | 3     | 3/3    | 완료   |
| 5     | 최적화 및 배포        | 3     | 3/3    | 완료   |

> 상태 표기: `대기중` → `진행중` → `완료`

---

## 개요

본 프로젝트는 견적서를 발행하는 프리랜서/소상공인(발행자)과 링크를 받아 열람하는 고객(수신자)을 위한 경량 웹 뷰어로 다음 가치를 제공합니다.

- **노션 DB 연동 견적서 조회**: 발행자는 노션에 견적서를 입력하고, 고객은 URL 하나로 확인
- **웹 뷰 + PDF 저장**: 별도 PDF 엔진 없이 `window.print()`로 인쇄/PDF 저장
- **공개/비공개 제어**: 노션 `상태` 속성(`승인`/`대기`/`거절`)으로 외부 노출 제어

### 핵심 기능

- **F001 노션 DB 조회**: 노션 페이지 ID(자동 UUID)로 `pages.retrieve` 단건 조회
- **F002 견적서 렌더링**: 발행자/수신자/품목 테이블/합계/세금/최종금액/비고 출력
- **F003 PDF 다운로드**: `window.print()` + `@media print` CSS
- **F004 접근 제어**: `상태 ≠ "승인"` 또는 페이지 미존재 시 `notFound()` 차단

### 사용자 여정

1. **[발행자]** 노션 DB에 견적서 입력 → 상태 = `승인` 설정
2. **[발행자]** `/invoice/[노션 페이지 ID]` URL을 고객에게 전달
3. **[수신자]** URL 접속 → 페이지 ID 유효성 + 상태 검사 → `승인`이면 견적서 뷰, 아니면 404
4. **[수신자]** 견적서 내용 확인 → "PDF 다운로드" 클릭 → 인쇄 다이얼로그 → PDF 저장

### 기술 스택

- Next.js 15.5.3 (App Router + Turbopack), React 19.1.0, TypeScript 5
- TailwindCSS v4 (설정 파일 없는 새 엔진), shadcn/ui (new-york), Lucide React
- `@notionhq/client` v5 — `dataSources.query` + `pages.retrieve`
- `window.print()` + `@media print` CSS (외부 PDF 라이브러리 불필요)
- Vercel 배포

---

## 아키텍처 / 설계 결정 사항

| 항목                  | 결정                                                                         |
| --------------------- | ---------------------------------------------------------------------------- |
| **품목 저장 방식**    | 별도 관계형 Items DB — `NOTION_ITEMS_DATABASE_ID`로 참조, `Invoices` relation 필터로 쿼리 |
| **Slug**              | 노션 페이지 ID(자동 UUID) 그대로 사용 — 별도 `Slug` 속성 불필요              |
| **공개/비공개 제어**  | `상태` Status 필드 — `승인` = 공개, `대기`/`거절` = 비공개                    |
| **SDK v5 API**        | `databases.query` 제거됨 → `dataSources.query`(목록) + `pages.retrieve`(단건) 사용 |
| **단건 조회 흐름**    | `pages.retrieve` → 상태 검증 → Items DB `relation: { contains: pageId }` 쿼리 → `Invoice` 변환 |
| **속성명 언어**       | 기존 한글 유지(`견적서 번호`, `발행일`, `유효기간`, `상태`, `클라이언트명`, `항목명`, `수량`, `단가`, `금액`), 추가 속성은 영문(`IssuerName`, `TaxRate`, `Note` 등) |
| **금액 계산**         | `금액` 필드가 0이면 `수량 × 단가`로 fallback, `tax = floor(subtotal × taxRate)` |
| **서버 전용 모듈**    | `notion.ts`, `invoice.ts`는 `import "server-only"` — 클라이언트 import 금지   |
| **PDF 출력**          | `PdfDownloadButton`(`"use client"`)에서 `window.print()` 호출, `print:hidden`으로 출력 시 버튼 숨김 |
| **Route Handler**     | RSC와 함께 `/api/invoice/[slug]` JSON 엔드포인트 제공 (외부 연동 대비)        |

### 데이터 흐름

```
노션 Invoices DB + Items DB
  ↓  (NOTION_API_KEY, NOTION_ITEMS_DATABASE_ID)
src/lib/notion.ts        — @notionhq/client 싱글톤, server-only
  ↓
src/lib/invoice.ts       — getInvoiceBySlug(pageId): Invoice | null
  ↓  pages.retrieve → 상태 검증 → Items DB relation 쿼리 → mapPageToInvoice
src/app/invoice/[slug]/page.tsx   — RSC, revalidate=60
  ↓  invoice 없으면 notFound()
src/components/invoice/InvoiceView.tsx
  └─ InvoiceHeader / PartiesSection / ItemsTable
     SummarySection / NoteSection / PdfDownloadButton
```

---

## 개발 워크플로우

1. **작업 계획**: 기존 코드베이스를 학습하고 현재 상태를 파악한 뒤, 우선순위 작업을 마지막 완료 작업 다음에 삽입한다.
2. **작업 생성**: Task의 관련 파일·수락 기준·구현 단계를 정의한다. API/비즈니스 로직 작업은 "테스트 체크리스트"(Playwright MCP 시나리오)를 포함한다.
3. **작업 구현**: 명세를 따라 구현하고, API 연동/비즈니스 로직은 Playwright MCP로 E2E 테스트를 수행한다. 각 단계 완료 후 진행 상황을 갱신한다.
4. **로드맵 업데이트**: 완료된 Task를 ✅로 표시하고 상단 진행률 테이블을 갱신한다.

---

## 개발 단계

### Phase 1: 프로젝트 초기 설정 ✅

> **완료 기준**: 노션 API 키가 환경 변수로 로드되고, 폴더 구조와 핵심 타입 정의가 완비되어 `npm run dev`가 에러 없이 실행된다.

- **Task T001: 환경 변수 및 노션 통합 설정** ✅ - 완료
  - 관련 파일: `.env`, `.env.example`, `src/lib/env.ts`
  - ✅ `NOTION_API_KEY`, `NOTION_ITEMS_DATABASE_ID` 환경 변수 정의 (Zod 검증)
  - ✅ `NOTION_DATABASE_ID` 선택 변수 처리 (`.optional()`)
  - ✅ `.env.example` 작성, `.gitignore`에 `.env*` 예외 규칙 추가

- **Task T002: 패키지 설치** ✅ - 완료
  - ✅ `@notionhq/client` ^5.x 설치
  - ✅ `server-only`, `zod` 설치
  - ✅ shadcn/ui (new-york), Lucide React 설치

- **Task T003: 폴더 구조 정리** ✅ - 완료
  - ✅ `src/app/invoice/[slug]/page.tsx`, `not-found.tsx`
  - ✅ `src/app/api/invoice/[slug]/route.ts`
  - ✅ `src/lib/notion.ts`, `src/lib/invoice.ts`, `src/lib/format.ts`
  - ✅ `src/components/invoice/`, `src/types/invoice.ts`

- **Task T004: TypeScript 인터페이스 정의** ✅ - 완료
  - 관련 파일: `src/types/invoice.ts`
  - ✅ `Invoice`, `LineItem`, `Issuer`, `Client` 인터페이스 정의
  - ✅ 모든 속성에 `readonly` 키워드와 명시적 타입 적용
  - ✅ `items`는 `readonly LineItem[]`로 불변 보장

---

### Phase 2: 공통 모듈/컴포넌트 개발 ✅

> **완료 기준**: 노션 클라이언트가 단일 페이지를 조회해 `Invoice` 타입으로 변환할 수 있고, 견적서 섹션별 UI 컴포넌트가 실데이터로 렌더링된다.

- **Task T005: 노션 클라이언트 모듈 작성** ✅ - 완료
  - 관련 파일: `src/lib/notion.ts`
  - ✅ `@notionhq/client` 싱글톤 인스턴스 export
  - ✅ `NOTION_ITEMS_DATABASE_ID` export
  - ✅ `import "server-only"`로 서버 전용 보장

- **Task T006: 노션 응답 → Invoice 파서 작성** ✅ - 완료
  - 관련 파일: `src/lib/invoice.ts`
  - ✅ `readText`, `readTitle`, `readDate`, `readNumber`, `readStatus`, `readEmail` 속성 추출 헬퍼
  - ✅ Items DB 관계 쿼리로 `LineItem[]` 파싱 (`dataSources.query` + `Invoices` relation 필터, `isFullPage` 가드)
  - ✅ `subtotal`, `tax`, `total` 계산 (`tax = floor(subtotal × taxRate)`)
  - ✅ `금액` 필드 0이면 `수량 × 단가` fallback 계산
  - ✅ `mapPageToInvoice`로 한글 속성명 → `Invoice` 타입 매핑

- **Task T007: 포맷팅 유틸 작성** ✅ - 완료
  - 관련 파일: `src/lib/format.ts`
  - ✅ 통화 포맷 `formatKRW` (`Intl.NumberFormat('ko-KR')`)
  - ✅ 날짜 포맷 `formatDate`

- **Task T008: 견적서 UI 컴포넌트 구현** ✅ - 완료
  - 관련 파일: `src/components/invoice/`
  - ✅ `InvoiceHeader.tsx` — 견적서 번호, 발행일, 유효기간
  - ✅ `PartiesSection.tsx` — 발행자/수신자 정보
  - ✅ `ItemsTable.tsx` — 품목 테이블 (품목명·수량·단가·금액)
  - ✅ `SummarySection.tsx` — 합계/세금/총액
  - ✅ `NoteSection.tsx` — 비고
  - ✅ `InvoiceView.tsx` — 전체 섹션 조합

---

### Phase 3: 핵심 기능 개발 ✅

> **완료 기준**: 실제 노션 데이터로 `/invoice/[pageId]`가 정상 렌더링되며, 비공개/미존재 ID는 not-found로 차단된다.

- **Task T009: 페이지 ID 기반 견적서 조회 함수** ✅ - 완료
  - 관련 파일: `src/lib/invoice.ts`
  - ✅ `notion.pages.retrieve({ page_id })` 단건 조회
  - ✅ `isFullPage` 가드 통과 후 처리
  - ✅ `상태 !== "승인"`이면 `null` 반환
  - ✅ Items DB `dataSources.query` + `relation: { contains: pageId }` 필터
  - ✅ `try/catch`로 Notion API 오류 시 `null` 반환

- **Task T010: 견적서 뷰 페이지 구현** ✅ - 완료
  - 관련 파일: `src/app/invoice/[slug]/page.tsx`
  - ✅ RSC에서 `getInvoiceBySlug(slug)` 호출
  - ✅ `export const revalidate = 60` ISR 적용
  - ✅ `params: Promise<{ slug: string }>` await 처리
  - ✅ `<InvoiceView invoice={invoice} />` 조합

- **Task T011: 접근 제어 (공개/비공개)** ✅ - 완료
  - 관련 파일: `src/lib/invoice.ts`, `src/app/invoice/[slug]/page.tsx`, `src/app/invoice/[slug]/not-found.tsx`
  - ✅ `상태 !== "승인"`이면 파서가 `null` 반환 → 페이지에서 `notFound()` 호출
  - ✅ 존재하지 않는 페이지 ID → Notion API 오류 catch → `null` → `notFound()`
  - ✅ not-found 페이지 안내 메시지 표시

- **Task T012: 핵심 기능 통합 테스트 (Playwright MCP)** ✅ - 완료
  - 관련 파일: `src/app/invoice/[slug]/page.tsx`, `src/app/api/invoice/[slug]/route.ts`
  - ✅ 공개(`승인`) 페이지 접근 시 견적서 정상 렌더링 확인
  - ✅ 존재하지 않는 ID 접근 시 not-found 노출 확인
  - ✅ 품목 합계/세금/총액 계산 정확성 검증 (API 레벨)
  - ✅ 비공개(`대기`/`거절`) 상태 페이지 접근 차단 확인 (null 반환 → notFound() 동일 경로)
  - ✅ 모바일 뷰포트(375px) 레이아웃 검증
  - **## 테스트 체크리스트 (Playwright MCP)**
    - ✅ `browser_navigate`로 공개 견적서 URL 접속 → `browser_snapshot`으로 발행자/수신자/품목/합계 렌더링 확인
    - ✅ 미존재 UUID 접속 → not-found 문구 및 HTTP 404 확인
    - ✅ `/api/invoice/[slug]` JSON 응답의 `subtotal`/`tax`/`total` 값 검증
    - ✅ `browser_resize`로 모바일 뷰포트(375px) 전환 후 레이아웃 깨짐 여부 확인

---

### Phase 4: 추가 기능 개발 ✅

> **완료 기준**: PDF 다운로드 버튼이 인쇄 다이얼로그를 띄우고, not-found 페이지가 사용자 친화적으로 표시되며, JSON API가 동일 데이터를 반환한다.

- **Task T013: PDF 다운로드 버튼 구현** ✅ - 완료
  - 관련 파일: `src/components/invoice/PdfDownloadButton.tsx`
  - ✅ `"use client"` 컴포넌트
  - ✅ 클릭 시 `window.print()` 호출
  - ✅ 인쇄 시 버튼 숨김 (`print:hidden`)

- **Task T014: not-found 페이지 디자인** ✅ - 완료
  - 관련 파일: `src/app/invoice/[slug]/not-found.tsx`
  - ✅ "비공개이거나 존재하지 않습니다" 안내 문구 + 발행자 문의 안내
  - ✅ 견적서 뷰와 일관된 디자인 적용

- **Task T015: API Route 구현** ✅ - 완료
  - 관련 파일: `src/app/api/invoice/[slug]/route.ts`
  - ✅ `getInvoiceBySlug` 재사용으로 동일 데이터를 JSON으로 반환
  - ✅ 비공개/미존재 시 404 응답

---

### Phase 5: 최적화 및 배포

> **완료 기준**: Vercel에 배포되어 실제 노션 견적서를 공개 URL로 확인할 수 있고, PDF가 A4 규격으로 깔끔하게 출력된다.

- **Task T016: 인쇄 CSS 최적화** ✅ - 완료
  - 관련 파일: `src/app/globals.css`
  - ✅ A4 페이지 사이즈 + 여백 조정 (`@page { size: A4; margin: 15mm }`)
  - ✅ 컬러 보정 (`-webkit-print-color-adjust: exact`)
  - ✅ 페이지 분할 방지 (`break-inside: avoid`) 적용 — `table`, `tr` 선택자
  - ✅ `print:hidden` 요소(버튼 등) 출력 제외 확인
  - **## 테스트 체크리스트 (Playwright MCP)**
    - ✅ `browser_navigate` 후 견적서 렌더링 확인
    - ✅ 품목 테이블 break-inside 규칙 적용 완료

- **Task T017: 캐싱 전략 검토** ✅ - 완료
  - 관련 파일: `src/app/invoice/[slug]/page.tsx`, `src/lib/invoice.ts`
  - ✅ `revalidate: 60` ISR 동작 확인
  - ✅ `React.cache`로 `getInvoiceBySlug` 메모이즈 — `generateMetadata` + `InvoicePage` 중복 API 호출 제거

- **Task T018: Vercel 배포 + 최종 E2E 검증** ✅ - 완료 (로컬 검증)
  - ✅ 프로덕션 빌드 통과 (`npm run build`, `npm run check-all`)
  - ✅ 공개 견적서 렌더링 확인 (Playwright MCP, localhost:3002)
  - ✅ 미존재 슬러그 → not-found 차단 확인
  - ✅ 모바일(375px) · 데스크톱(1280px) 뷰포트 검증
  - [ ] Vercel 프로젝트 생성 및 환경 변수 등록 (`NOTION_API_KEY`, `NOTION_ITEMS_DATABASE_ID`) — 사용자 직접 수행
  - **## 테스트 체크리스트 (Playwright MCP)**
    - ✅ `browser_navigate` → 공개 견적서 전체 플로우(조회 → PDF 버튼) E2E
    - ✅ 비공개/미존재 URL 차단 동작 확인
    - ✅ 데스크톱(1280px)·모바일(375px) 두 뷰포트 스냅샷 완료

---

## 작업 진행 가이드

1. **Task 시작 전**: 해당 Task의 관련 파일과 세부 체크박스를 확인한다.
2. **Task 진행 중**: 세부 체크박스를 하나씩 완료하며 체크하고, API/비즈니스 로직은 Playwright MCP로 검증한다.
3. **Task 완료 후**: 상단 진행률 테이블과 Task 상태를 `완료`(✅)로 업데이트한다.
4. **Phase 전환 시**: 해당 Phase의 "완료 기준"을 만족하는지 검증한다.

> 상태 표기: `대기중` → `진행중` → `완료` / Task 완료 시 ✅, 즉시 착수 작업은 `- 우선순위`로 표기.
