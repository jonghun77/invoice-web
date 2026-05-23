# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Project Context

- PRD 문서: @docs/PRD.md
- 개발 로드맵: @docs/ROADMAP.md

---

## Commands

```bash
npm run dev          # 개발 서버 (Turbopack)
npm run build        # 프로덕션 빌드
npm run check-all    # typecheck + lint + format 검사 (커밋 전 필수)
npm run lint:fix     # ESLint 자동 수정
npm run format       # Prettier 자동 포맷
npm run typecheck    # TypeScript 타입 검사만

npx shadcn@latest add <component>   # shadcn/ui 컴포넌트 추가
```

Husky pre-commit 훅이 `lint-staged`를 실행해 `.ts/.tsx` 파일에 ESLint + Prettier를 자동 적용한다.

---

## 작업 완료 체크리스트

코드 변경 후 커밋/배포 전에 반드시 아래 순서로 실행한다.

```bash
npm run check-all   # 1단계: typecheck + lint + format 검사
npm run build       # 2단계: 프로덕션 빌드 통과 확인
```

- `check-all` 실패 시 → `npm run lint:fix` 또는 `npm run format`으로 자동 수정 후 재실행
- `build` 실패 시 → 타입 오류 또는 import 문제를 먼저 해결

---

## Architecture

### 데이터 흐름

```
노션 Invoices DB + Items DB
  ↓  (NOTION_API_KEY, NOTION_ITEMS_DATABASE_ID)
src/lib/notion.ts         — @notionhq/client 싱글톤, server-only
  ↓
src/lib/invoice.ts        — getInvoiceBySlug(pageId) : Invoice | null
  ↓  notion.pages.retrieve({ page_id }) 단건 조회
     상태 !== "승인" 이면 null 반환
     dataSources.query + relation 필터로 LineItem[] 파싱 (getLineItems)
     노션 속성 → Invoice 타입 변환 (mapPageToInvoice)
  ↓
src/app/invoice/[slug]/page.tsx   — RSC, revalidate=60
  ↓  invoice 없으면 notFound()
src/components/invoice/InvoiceView.tsx
  └─ InvoiceHeader / PartiesSection / ItemsTable
     SummarySection / NoteSection / PdfDownloadButton
```

### 핵심 설계 결정

**Items는 별도 관계형 Items DB**  
`invoice.ts`의 `getLineItems`가 `notion.dataSources.query`를 호출해 `Invoices` relation 속성으로 해당 견적서 페이지 ID를 포함하는 항목만 가져온다. Items DB 속성: `항목명`(title), `수량`(number), `단가`(number), `금액`(number). `금액`이 0이면 `수량 × 단가`로 fallback 계산한다. DB ID는 `NOTION_ITEMS_DATABASE_ID` 환경 변수로 참조한다.

**Notion SDK v5의 API 차이**  
`databases.query` 대신 `notion.dataSources.query({ data_source_id })` 를 사용한다. v5 이전 코드로 되돌리지 말 것.

**⚠️ data_source_id ≠ database_id (URL의 UUID)**  
`dataSources.query`에 넘기는 `data_source_id`는 Notion URL에서 복사한 데이터베이스 페이지 ID와 **다른 값**이다. 실제 `data_source_id`는 `GET /v1/databases/{database_id}` 응답의 `data_sources[0].id`에서 가져와야 한다. 이 변환은 `src/lib/notion.ts`의 `getDataSourceId(databaseId)` 함수가 담당하며, 결과를 모듈 수준 캐시에 저장해 중복 API 호출을 방지한다. 환경 변수에는 기존대로 데이터베이스 페이지 ID를 넣으면 된다.

**InvoiceNumber 이중 처리**  
노션 DB에서 `InvoiceNumber`가 `title` 타입일 수도, `rich_text` 타입일 수도 있어 `readTitle || readText`로 둘 다 시도한다.

**접근 제어**  
`getInvoiceBySlug`가 `IsPublic = true` 필터를 쿼리에 포함하므로, 비공개 견적서는 DB에서 애초에 반환되지 않는다. 페이지 컴포넌트에서 별도로 `isPublic` 여부를 확인하지 않아도 된다.

**서버 전용 모듈**  
`notion.ts`와 `invoice.ts` 최상단에 `import 'server-only'`가 있어 클라이언트 번들에 포함되면 빌드 에러가 발생한다. 이 모듈을 클라이언트 컴포넌트에서 직접 import하지 말 것.

**PDF 출력**  
`PdfDownloadButton`은 `"use client"` 컴포넌트로 `window.print()`를 호출한다. `print:hidden` Tailwind 유틸리티로 출력 시 숨길 요소를 지정한다.

### 주요 파일

| 파일                                  | 역할                                                 |
| ------------------------------------- | ---------------------------------------------------- |
| `src/lib/notion.ts`                   | Notion 클라이언트 싱글톤                             |
| `src/lib/invoice.ts`                  | DB 쿼리, 파싱, `getInvoiceBySlug`                    |
| `src/lib/format.ts`                   | `formatKRW`, `formatDate` 포맷 유틸                  |
| `src/lib/env.ts`                      | Zod 환경 변수 스키마                                 |
| `src/types/invoice.ts`                | `Invoice`, `Issuer`, `Client`, `LineItem` 인터페이스 |
| `src/app/invoice/[slug]/page.tsx`     | RSC 진입점, ISR revalidate=60                        |
| `src/app/api/invoice/[slug]/route.ts` | 동일 데이터를 JSON으로 반환하는 Route Handler        |

### 환경 변수

```bash
NOTION_API_KEY=secret_...
NOTION_ITEMS_DATABASE_ID=...   # Items DB — 32자 hex 또는 하이픈 포함 UUID
```

### Styling

TailwindCSS v4 (설정 파일 없는 새 엔진). 디자인 토큰은 `globals.css`의 `@theme inline` 블록에서 CSS 변수로 정의된다. shadcn/ui는 new-york 스타일(`components.json` 참조).
