# 노션 기반 견적서 웹 뷰어 MVP 개발 로드맵

노션 DB에 입력한 견적서를 고객이 웹 URL로 열람하고 PDF로 저장할 수 있도록 하는 경량 웹 뷰어를 구축합니다.

---

## 전체 진행률

**0 / 18 Tasks 완료** (0%)

### Phase별 진행 현황

| Phase | 제목 | Tasks | 진행률 | 상태 |
|-------|------|-------|--------|------|
| 1 | 프로젝트 초기 설정 | 4 | 0/4 | 대기중 |
| 2 | 공통 모듈/컴포넌트 개발 | 4 | 0/4 | 대기중 |
| 3 | 핵심 기능 개발 | 4 | 0/4 | 대기중 |
| 4 | 추가 기능 개발 | 3 | 0/3 | 대기중 |
| 5 | 최적화 및 배포 | 3 | 0/3 | 대기중 |

---

## 개요

본 프로젝트는 다음 가치를 제공합니다.

- **노션 DB 연동 견적서 조회**: 발행자는 노션에 견적서를 입력하고, 고객은 URL 하나로 확인
- **웹 뷰 + PDF 저장**: 별도 PDF 엔진 없이 `window.print()`로 인쇄/PDF 저장
- **공개/비공개 제어**: 노션 `IsPublic` 속성으로 접근 제어

### 핵심 기능

- **F001 노션 DB 조회**: `slug(UUID)`로 노션 API 호출
- **F002 견적서 렌더링**: 발행자/수신자/품목/합계/세금/비고 출력
- **F003 PDF 다운로드**: `window.print()` + `@media print` CSS
- **F004 접근 제어**: `IsPublic === false` 또는 slug 미존재 시 차단

### 기술 스택

- Next.js 15.5.3 (App Router + Turbopack), React 19.1.0, TypeScript 5
- TailwindCSS v4, shadcn/ui (new-york), Lucide React
- `@notionhq/client` (노션 공식 SDK)
- `window.print()` + `@media print` CSS
- Vercel 배포

---

## 개발 단계

### Phase 1: 프로젝트 초기 설정

> **왜 이 순서인지**: 환경 변수와 타입을 먼저 확정해야 이후 모듈/컴포넌트 개발에서 흔들림 없이 작업할 수 있다.
>
> **예상 소요 시간**: 1~2시간
>
> **완료 기준**: 노션 API 키가 환경 변수로 로드되고, 폴더 구조와 핵심 타입 정의가 완비되어 `npm run dev`가 에러 없이 실행된다.

- **Task T001: 환경 변수 및 노션 통합 설정** - 대기중 - 우선순위
  - 관련 파일: `.env.local`, `.env.example`, `next.config.ts`
  - 세부 구현:
    - [ ] `NOTION_API_KEY`, `NOTION_DATABASE_ID` 환경 변수 정의
    - [ ] `.env.example` 작성 (커밋 가능한 샘플)
    - [ ] 노션 인티그레이션 생성 및 DB 공유 권한 부여 가이드 문서화
    - [ ] 환경 변수 누락 시 친절한 에러 메시지 처리

- **Task T002: 패키지 설치** - 대기중
  - 관련 파일: `package.json`
  - 세부 구현:
    - [ ] `@notionhq/client` 설치
    - [ ] 필요 시 `date-fns` 등 날짜 포맷 라이브러리 설치
    - [ ] `npm run check-all` 통과 확인

- **Task T003: 폴더 구조 정리** - 대기중
  - 관련 파일: `src/app/`, `src/lib/`, `src/components/`, `src/types/`
  - 세부 구현:
    - [ ] `src/app/invoice/[slug]/page.tsx` 빈 껍데기 생성
    - [ ] `src/app/invoice/[slug]/not-found.tsx` 빈 껍데기 생성
    - [ ] `src/lib/notion/` 디렉토리 생성 (client, parser)
    - [ ] `src/components/invoice/` 디렉토리 생성
    - [ ] `src/types/invoice.ts` 파일 생성

- **Task T004: TypeScript 인터페이스 정의** - 대기중
  - 관련 파일: `src/types/invoice.ts`, `src/types/notion.ts`
  - 세부 구현:
    - [ ] `Invoice` 인터페이스 정의 (PRD 사양 기준)
    - [ ] `InvoiceItem` 인터페이스 분리 정의
    - [ ] 노션 raw 응답 타입 정의 (`NotionInvoicePage`)
    - [ ] `readonly` 키워드와 명시적 타입 적용 (코드 스타일 가이드 준수)

---

### Phase 2: 공통 모듈/컴포넌트 개발

> **왜 이 순서인지**: 페이지를 만들기 전에 데이터 페칭/파싱 로직과 UI 빌딩 블록을 먼저 만들어 두면 페이지 조립이 단순해진다.
>
> **예상 소요 시간**: 3~4시간
>
> **완료 기준**: 노션 클라이언트가 단일 페이지를 조회해 `Invoice` 타입으로 변환할 수 있고, 견적서 섹션별 UI 컴포넌트가 더미 데이터로 렌더링된다.

- **Task T005: 노션 클라이언트 모듈 작성** - 대기중
  - 관련 파일: `src/lib/notion/client.ts`
  - 세부 구현:
    - [ ] `@notionhq/client` 싱글톤 인스턴스 export
    - [ ] 환경 변수 검증 로직
    - [ ] 서버 전용 모듈임을 보장 (`import "server-only"`)

- **Task T006: 노션 응답 → Invoice 파서 작성** - 대기중
  - 관련 파일: `src/lib/notion/parser.ts`
  - 세부 구현:
    - [ ] rich_text/date/number/checkbox/email 속성 추출 헬퍼
    - [ ] `Items` JSON 문자열 파싱 + 유효성 검증
    - [ ] subtotal, tax, total 계산 함수 (단위: 원, 세율 0.0~1.0)
    - [ ] 파싱 실패 시 명확한 에러 throw

- **Task T007: 포맷팅 유틸 작성** - 대기중
  - 관련 파일: `src/lib/format.ts`
  - 세부 구현:
    - [ ] 통화 포맷 (`Intl.NumberFormat('ko-KR')`)
    - [ ] 날짜 포맷 (`YYYY-MM-DD`)
    - [ ] 세율 퍼센트 표시 (0.1 → "10%")

- **Task T008: 견적서 UI 컴포넌트 골격 구현** - 대기중
  - 관련 파일: `src/components/invoice/InvoiceHeader.tsx`, `InvoicePartyInfo.tsx`, `InvoiceItemsTable.tsx`, `InvoiceSummary.tsx`, `InvoiceNote.tsx`
  - 세부 구현:
    - [ ] 헤더 (견적서 번호, 발행일, 유효기한)
    - [ ] 발행자/수신자 정보 카드
    - [ ] 품목 테이블 (품명, 수량, 단가, 금액)
    - [ ] 합계/세금/총액 요약
    - [ ] 비고 영역
    - [ ] 더미 데이터로 시각 확인

---

### Phase 3: 핵심 기능 개발

> **왜 이 순서인지**: 모듈과 컴포넌트가 준비된 상태에서 페이지에 연결하면, 데이터 흐름과 접근 제어를 한 번에 검증할 수 있다.
>
> **예상 소요 시간**: 2~3시간
>
> **완료 기준**: 실제 노션 데이터로 `/invoice/[slug]`가 정상 렌더링되며, 비공개/미존재 slug는 not-found로 차단된다.

- **Task T009: slug 기반 견적서 조회 함수** - 대기중 - 우선순위
  - 관련 파일: `src/lib/notion/getInvoiceBySlug.ts`
  - 세부 구현:
    - [ ] `databases.query` + `filter: Slug equals`
    - [ ] 결과 0건 처리 (null 반환)
    - [ ] 파서를 통해 `Invoice`로 변환
    - [ ] 단위 테스트 또는 디버그 스크립트로 동작 확인

- **Task T010: 견적서 뷰 페이지 구현** - 대기중
  - 관련 파일: `src/app/invoice/[slug]/page.tsx`
  - 세부 구현:
    - [ ] Server Component에서 `getInvoiceBySlug` 호출
    - [ ] Phase 2 컴포넌트 조합으로 전체 레이아웃 구성
    - [ ] `generateMetadata`로 제목/설명 설정
    - [ ] 반응형 디자인 (모바일/태블릿/데스크톱)

- **Task T011: 접근 제어 (공개/비공개)** - 대기중
  - 관련 파일: `src/app/invoice/[slug]/page.tsx`, `src/app/invoice/[slug]/not-found.tsx`
  - 세부 구현:
    - [ ] `isPublic === false`이면 `notFound()` 호출
    - [ ] slug 미존재 시 `notFound()` 호출
    - [ ] not-found 페이지 메시지 디자인 ("견적서를 찾을 수 없습니다")

- **Task T012: 핵심 기능 통합 테스트 (Playwright MCP)** - 대기중
  - 관련 파일: 테스트 시나리오 (수동/Playwright)
  - 테스트 체크리스트:
    - [ ] 공개 slug 접근 시 견적서 정상 렌더링
    - [ ] 비공개 slug 접근 시 not-found 노출
    - [ ] 존재하지 않는 slug 접근 시 not-found 노출
    - [ ] 품목 합계/세금/총액 계산 정확성 검증
    - [ ] 모바일 뷰포트 레이아웃 검증

---

### Phase 4: 추가 기능 개발

> **왜 이 순서인지**: 핵심 뷰가 안정화된 뒤 PDF 저장 같은 부가 기능을 얹어야 회귀 위험이 적다.
>
> **예상 소요 시간**: 2시간
>
> **완료 기준**: PDF 다운로드 버튼이 인쇄 다이얼로그를 띄우고, not-found 페이지가 사용자 친화적으로 표시된다.

- **Task T013: PDF 다운로드 버튼 구현** - 대기중
  - 관련 파일: `src/components/invoice/PrintButton.tsx`
  - 세부 구현:
    - [ ] Client Component (`"use client"`)
    - [ ] 클릭 시 `window.print()` 호출
    - [ ] Lucide 아이콘 + shadcn Button 사용
    - [ ] 인쇄 시 버튼 자체는 숨김 처리 (`print:hidden`)

- **Task T014: not-found 페이지 디자인 보강** - 대기중
  - 관련 파일: `src/app/invoice/[slug]/not-found.tsx`
  - 세부 구현:
    - [ ] 안내 문구 + 발행자에게 문의 안내
    - [ ] 일관된 디자인 시스템 적용

- **Task T015: (선택) API Route 분리** - 대기중
  - 관련 파일: `src/app/api/invoice/[slug]/route.ts`
  - 세부 구현:
    - [ ] 외부 클라이언트에서 JSON으로 조회 가능하게 endpoint 제공
    - [ ] 캐싱 헤더 설정
    - [ ] 인증/공개 여부 동일 정책 적용
    - [ ] (필요 없으면 스킵하고 사유 기록)

---

### Phase 5: 최적화 및 배포

> **왜 이 순서인지**: 기능이 모두 동작한 다음에 인쇄 품질, 캐싱, 배포를 마무리해야 한다.
>
> **예상 소요 시간**: 2~3시간
>
> **완료 기준**: Vercel에 배포되어 실제 노션 견적서를 공개 URL로 확인할 수 있고, PDF가 깔끔하게 출력되며, 합리적인 캐싱이 적용되어 있다.

- **Task T016: 인쇄 CSS 최적화** - 대기중
  - 관련 파일: `src/app/globals.css`, 각 컴포넌트의 `print:` 유틸리티
  - 세부 구현:
    - [ ] A4 페이지 사이즈 + 여백 조정 (`@page { size: A4; margin: ... }`)
    - [ ] 네비/버튼 등 인쇄 비표시 요소 `print:hidden`
    - [ ] 컬러 보정 (`-webkit-print-color-adjust: exact`)
    - [ ] 페이지 분할 (`break-inside: avoid`) 적용

- **Task T017: 캐싱 전략 적용** - 대기중
  - 관련 파일: `src/app/invoice/[slug]/page.tsx`, `src/lib/notion/getInvoiceBySlug.ts`
  - 세부 구현:
    - [ ] `revalidate` 또는 `fetch` 옵션으로 ISR 적용 (예: 60초)
    - [ ] 노션 SDK 호출 결과 메모이즈 (`React.cache`)
    - [ ] 캐시 무효화 정책 문서화

- **Task T018: Vercel 배포 + 최종 E2E 검증** - 대기중
  - 관련 파일: `vercel.json`(필요 시), README 업데이트
  - 세부 구현:
    - [ ] Vercel 프로젝트 생성 및 환경 변수 등록
    - [ ] 프로덕션 빌드 통과 (`npm run build`)
    - [ ] 배포 URL에서 공개/비공개 slug 동작 검증
    - [ ] PDF 다운로드 실제 출력 품질 확인 (Chrome/Safari)
    - [ ] README에 사용법/배포 가이드 정리
  - 테스트 체크리스트 (Playwright MCP):
    - [ ] 프로덕션 URL 공개 견적서 접근 → 정상 렌더링
    - [ ] 비공개 견적서 접근 → not-found
    - [ ] PDF 다운로드 버튼 클릭 → 인쇄 다이얼로그 호출
    - [ ] 모바일/데스크톱 뷰포트 회귀 확인

---

## 작업 진행 가이드

1. **Task 시작 전**: 해당 Task의 관련 파일과 세부 체크박스를 확인한다.
2. **Task 진행 중**: 세부 체크박스를 하나씩 완료하며 체크한다.
3. **Task 완료 후**: 상단 진행률 테이블과 Task 상태를 `완료`로 업데이트한다.
4. **Phase 전환 시**: 해당 Phase의 "완료 기준"을 만족하는지 검증한다.

> 상태 표기: `대기중` → `진행중` → `완료`
