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

## Architecture

### 데이터 흐름

```
노션 DB
  ↓  (NOTION_API_KEY, NOTION_DATABASE_ID)
src/lib/notion.ts         — @notionhq/client 싱글톤, server-only
  ↓
src/lib/invoice.ts        — getInvoiceBySlug(slug) : Invoice | null
  ↓  slug 필터 + IsPublic 필터로 DB 쿼리
     페이지 본문 table 블록에서 LineItem[] 파싱 (getLineItems)
     노션 속성 → Invoice 타입 변환 (mapPageToInvoice)
  ↓
src/app/invoice/[slug]/page.tsx   — RSC, revalidate=60
  ↓  invoice 없으면 notFound()
src/components/invoice/InvoiceView.tsx
  └─ InvoiceHeader / PartiesSection / ItemsTable
     SummarySection / NoteSection / PdfDownloadButton
```

### 핵심 설계 결정

**Items는 DB 속성이 아니라 페이지 본문 테이블**  
`invoice.ts`의 `getLineItems`가 페이지 자식 블록에서 `table` 블록을 찾아 행별로 파싱한다. 노션에서 품목을 입력할 때 페이지 본문에 4열 테이블(품목명·수량·단가·금액)을 작성해야 한다. `has_column_header = true`이면 첫 번째 행을 헤더로 건너뛴다.

**Notion SDK v5의 API 차이**  
`databases.query` 대신 `notion.dataSources.query({ data_source_id })` 를 사용한다. v5 이전 코드로 되돌리지 말 것.

**InvoiceNumber 이중 처리**  
노션 DB에서 `InvoiceNumber`가 `title` 타입일 수도, `rich_text` 타입일 수도 있어 `readTitle || readText`로 둘 다 시도한다.

**접근 제어**  
`getInvoiceBySlug`가 `IsPublic = true` 필터를 쿼리에 포함하므로, 비공개 견적서는 DB에서 애초에 반환되지 않는다. 페이지 컴포넌트에서 별도로 `isPublic` 여부를 확인하지 않아도 된다.

**서버 전용 모듈**  
`notion.ts`와 `invoice.ts` 최상단에 `import 'server-only'`가 있어 클라이언트 번들에 포함되면 빌드 에러가 발생한다. 이 모듈을 클라이언트 컴포넌트에서 직접 import하지 말 것.

**PDF 출력**  
`PdfDownloadButton`은 `"use client"` 컴포넌트로 `window.print()`를 호출한다. `print:hidden` Tailwind 유틸리티로 출력 시 숨길 요소를 지정한다.

### 주요 파일

| 파일 | 역할 |
|------|------|
| `src/lib/notion.ts` | Notion 클라이언트 싱글톤 |
| `src/lib/invoice.ts` | DB 쿼리, 파싱, `getInvoiceBySlug` |
| `src/lib/format.ts` | `formatKRW`, `formatDate` 포맷 유틸 |
| `src/lib/env.ts` | Zod 환경 변수 스키마 |
| `src/types/invoice.ts` | `Invoice`, `Issuer`, `Client`, `LineItem` 인터페이스 |
| `src/app/invoice/[slug]/page.tsx` | RSC 진입점, ISR revalidate=60 |
| `src/app/api/invoice/[slug]/route.ts` | 동일 데이터를 JSON으로 반환하는 Route Handler |

### 환경 변수

```bash
NOTION_API_KEY=secret_...
NOTION_DATABASE_ID=...   # 32자 hex 또는 하이픈 포함 UUID
```

### Styling

TailwindCSS v4 (설정 파일 없는 새 엔진). 디자인 토큰은 `globals.css`의 `@theme inline` 블록에서 CSS 변수로 정의된다. shadcn/ui는 new-york 스타일(`components.json` 참조).
