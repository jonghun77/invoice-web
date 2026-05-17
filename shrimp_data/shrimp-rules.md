# Development Guidelines — invoice-web (AI Agent용)

## 1. Project Overview

- 노션 DB 기반 견적서 웹 뷰어 (Next.js 15.5.3 App Router)
- 유일한 공개 경로: `/invoice/[slug]` — 인증 없음, slug로 접근 제어
- 배포 대상: Vercel
- 기술 스택: Next.js 15.5.3, React 19.1.0, TypeScript 5, TailwindCSS v4, shadcn/ui (new-york), `@notionhq/client` v5

---

## 2. Project Architecture

```
src/
├── app/
│   ├── invoice/[slug]/
│   │   ├── page.tsx          ← RSC, revalidate=60, 진입점
│   │   └── not-found.tsx     ← 비공개/미존재 slug 처리
│   ├── api/invoice/[slug]/
│   │   └── route.ts          ← JSON API Route Handler
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css           ← TailwindCSS v4 CSS 변수 (@theme inline)
├── components/
│   ├── invoice/
│   │   ├── InvoiceView.tsx   ← 견적서 조합 최상위 Server Component
│   │   ├── InvoiceHeader.tsx
│   │   ├── PartiesSection.tsx
│   │   ├── ItemsTable.tsx
│   │   ├── SummarySection.tsx
│   │   ├── NoteSection.tsx
│   │   └── PdfDownloadButton.tsx  ← 유일한 "use client" 컴포넌트
│   └── ui/                   ← shadcn/ui 자동 생성 컴포넌트 (직접 수정 금지)
├── lib/
│   ├── notion.ts             ← Notion 클라이언트 싱글톤 (server-only)
│   ├── invoice.ts            ← DB 쿼리·파싱·getInvoiceBySlug (server-only)
│   ├── format.ts             ← formatKRW, formatDate 유틸
│   ├── env.ts                ← Zod 환경변수 스키마
│   └── utils.ts              ← cn() shadcn 유틸
└── types/
    └── invoice.ts            ← Invoice, Issuer, Client, LineItem 인터페이스
```

---

## 3. 핵심 설계 결정 (변경 금지)

| 결정 | 내용 |
|------|------|
| **Items 저장 위치** | Notion DB 속성 **아님** — 페이지 본문 4열 table 블록에서 파싱 |
| **Notion SDK 버전** | v5: `notion.dataSources.query({ data_source_id })` 사용 |
| **접근 제어** | `getInvoiceBySlug` 쿼리에 `IsPublic=true` 필터 포함 — 페이지 컴포넌트에서 재확인 불필요 |
| **InvoiceNumber** | `title` 또는 `rich_text` 두 타입 모두 처리: `readTitle() || readText()` |
| **PDF 생성** | `window.print()` 전용, 외부 라이브러리 사용 금지 |
| **ISR 캐시** | `revalidate = 60` (page.tsx 최상단 상수) |

---

## 4. Notion SDK 사용 규칙

```typescript
// ✅ 올바른 방법 (v5.x)
await notion.dataSources.query({
  data_source_id: NOTION_DATABASE_ID,
  filter: { ... },
})

// ❌ 금지 (v4 이하 방식 — 컴파일 에러 발생)
await notion.databases.query({ database_id: NOTION_DATABASE_ID })
```

- Notion 클라이언트는 `src/lib/notion.ts`에서만 import
- `NOTION_DATABASE_ID`는 `src/lib/notion.ts`의 export 사용
- 속성 타입별 추출 헬퍼(`readText`, `readTitle`, `readEmail`, `readNumber`, `readCheckbox`, `readDate`)는 `src/lib/invoice.ts`에만 존재 — 다른 파일에 중복 작성 금지

---

## 5. 서버 전용 모듈 규칙

- `src/lib/notion.ts`, `src/lib/invoice.ts` 최상단에 `import 'server-only'` 존재
- 이 두 파일을 **클라이언트 컴포넌트에서 직접 import 금지** (빌드 에러 발생)
- 클라이언트에서 invoice 데이터가 필요하면 `props`로 내려받거나 `/api/invoice/[slug]` Route Handler 사용

---

## 6. 컴포넌트 작성 규칙

- `src/components/invoice/` 하위 컴포넌트는 기본적으로 **Server Component** (지시어 없음)
- `"use client"` 지시어는 `window`, `document`, 이벤트 핸들러가 반드시 필요한 경우에만 사용
  - 현재 유일한 Client Component: `PdfDownloadButton.tsx`
- 새 invoice 컴포넌트 추가 시 `InvoiceView.tsx`에 import하여 조합
- `src/components/ui/` 파일은 `npx shadcn@latest add <component>`로만 추가 — 직접 수정 금지

---

## 7. 타입 규칙

- 모든 타입·인터페이스는 `src/types/invoice.ts`에 정의
- `any` 타입 사용 금지 — Notion SDK 타입(`PageObjectResponse` 등) 활용
- `var` 사용 금지 — `const` 우선, 재할당 필요 시 `let`
- `interface`를 `type` 대신 사용 (객체 형태 정의 시)
- `readonly` 키워드를 불변 속성에 적용

```typescript
// ✅
interface LineItem {
  readonly id: string
  name: string
  quantity: number
}

// ❌
type LineItem = { id: any; name: string }
```

---

## 8. 포맷팅 유틸 규칙

- 통화 표시: `formatKRW(amount)` — `src/lib/format.ts`에서 import
- 날짜 표시: `formatDate(isoString)` — `src/lib/format.ts`에서 import
- 새 포맷 함수는 `src/lib/format.ts`에만 추가, 컴포넌트 내부 인라인 포맷 금지

---

## 9. 스타일링 규칙

- **TailwindCSS v4** — `tailwind.config.ts` 파일 없음 (설정 파일 생성 금지)
- 디자인 토큰 변경: `src/app/globals.css`의 `@theme inline` 블록에서만 수정
- 인쇄 숨김: `print:hidden` Tailwind 유틸리티 사용
- 인쇄 전용 스타일: `print:` 접두사 또는 `globals.css`의 `@media print`
- shadcn/ui 컴포넌트 추가 명령: `npx shadcn@latest add <component>`

---

## 10. 환경변수 규칙

| 변수명 | 위치 | 용도 |
|--------|------|------|
| `NOTION_API_KEY` | `.env.local` | Notion API 인증 |
| `NOTION_DATABASE_ID` | `.env.local` | 견적서 DB ID |

- 환경변수 직접 접근(`process.env.XXX`)은 `src/lib/notion.ts`와 `src/lib/env.ts`에서만 허용
- 새 환경변수 추가 시: `.env.local` + `.env.example` + `src/lib/env.ts` Zod 스키마 **동시 수정**

---

## 11. 파일 상호작용 규칙 (다중 파일 동시 수정)

### Invoice 필드 추가/변경 시

1. `src/types/invoice.ts` — 인터페이스 수정
2. `src/lib/invoice.ts` — `readXxx` 헬퍼 추가 + `mapPageToInvoice` 반영
3. 해당 컴포넌트(`src/components/invoice/`) — UI 반영

### 새 Notion DB 속성 연동 시

1. `src/lib/invoice.ts` — 속성 타입에 맞는 헬퍼 함수 사용
2. `src/types/invoice.ts` — 타입 추가
3. 필요 시 UI 컴포넌트 수정

### 새 환경변수 추가 시

1. `.env.local` — 실제 값
2. `.env.example` — 플레이스홀더 값
3. `src/lib/env.ts` — Zod 스키마에 추가

### 새 UI 컴포넌트 추가 시 (`src/components/invoice/`)

1. 컴포넌트 파일 생성
2. `src/components/invoice/InvoiceView.tsx`에 import 및 배치

---

## 12. 경로 별칭

- `@/` → `src/` (tsconfig.json paths 설정)
- 상대 경로(`../../`) 대신 항상 `@/` 별칭 사용

```typescript
// ✅
import { formatKRW } from '@/lib/format'
import type { Invoice } from '@/types/invoice'

// ❌
import { formatKRW } from '../../lib/format'
```

---

## 13. 코드 품질 검사

```bash
npm run check-all    # typecheck + lint + format:check (커밋 전 필수)
npm run lint:fix     # ESLint 자동 수정
npm run format       # Prettier 자동 포맷
npm run typecheck    # TypeScript 타입 검사만
```

- 코드 수정 후 반드시 `npm run check-all` 통과 확인
- Husky pre-commit 훅이 lint-staged를 자동 실행 (skip 금지)

---

## 14. 금지 행동 목록

| 금지 | 이유 |
|------|------|
| `notion.databases.query()` 사용 | v5에서 `dataSources.query()` 사용 |
| server-only 모듈을 Client Component에서 import | 빌드 에러 발생 |
| Items를 Notion DB 속성으로 저장 | 페이지 본문 table 블록 파싱이 설계 결정 |
| `src/components/ui/` 직접 수정 | shadcn CLI로만 관리 |
| `tailwind.config.ts` 생성 | TailwindCSS v4는 설정 파일 불필요 |
| `any` 타입 사용 | TypeScript 엄격 모드 위반 |
| `var` 사용 | const/let 사용 |
| 인라인 포맷 함수 작성 | `src/lib/format.ts`에 추가 |
| 페이지 컴포넌트에서 `isPublic` 재확인 | 쿼리 레벨에서 이미 필터링됨 |
| PDF 생성 외부 라이브러리 도입 | `window.print()` 전용 |
| `--no-verify`로 husky 우회 | 코드 품질 보장 정책 위반 |

---

## 15. AI 의사결정 기준

### 새 기능이 서버/클라이언트 컴포넌트 중 어디에 속하는가?
- Notion API, 데이터 fetch → **Server Component** (기본값)
- `window`, `document`, onClick, useState → **Client Component** (`"use client"` 추가)

### Notion 속성 타입을 알 수 없을 때?
- `readText` → `rich_text` 타입
- `readTitle` → `title` 타입 (DB primary 필드)
- InvoiceNumber처럼 불확실하면 `readTitle(page, prop) || readText(page, prop)` 패턴 적용

### 새 포맷/계산 로직 위치?
- 화면 표시 포맷 → `src/lib/format.ts`
- 금액 계산 (subtotal, tax, total) → `src/lib/invoice.ts`의 `mapPageToInvoice`

### 컴포넌트를 어디에 배치할 것인가?
- 견적서 전용 UI → `src/components/invoice/`
- 재사용 가능한 일반 UI → shadcn CLI로 추가 후 `src/components/ui/`
