# Development Guidelines — 노션 기반 견적서 웹 뷰어

## 1. Project Overview

- **목적**: 노션 DB 견적서를 `/invoice/[pageId]` URL로 공개 열람 + PDF 저장
- **스택**: Next.js 15.5.3 App Router, React 19, TypeScript 5, TailwindCSS v4, shadcn/ui (new-york), `@notionhq/client` v5
- **배포**: Vercel

---

## 2. Directory Structure

```
src/
├── app/
│   ├── invoice/[slug]/
│   │   ├── page.tsx          # RSC 진입점 (revalidate=60)
│   │   └── not-found.tsx     # 접근 차단/미존재 404 페이지
│   ├── api/invoice/[slug]/
│   │   └── route.ts          # JSON API Route Handler
│   ├── globals.css           # TailwindCSS v4 @theme 토큰 정의
│   └── layout.tsx
├── components/
│   ├── invoice/              # 견적서 UI 컴포넌트
│   └── ui/                   # shadcn/ui 자동 생성 컴포넌트
├── lib/
│   ├── notion.ts             # Notion 클라이언트 싱글톤 (server-only)
│   ├── invoice.ts            # getInvoiceBySlug, 파싱 로직 (server-only)
│   ├── format.ts             # formatKRW, formatDate
│   └── env.ts                # Zod 환경 변수 검증
└── types/
    └── invoice.ts            # Invoice, Issuer, Client, LineItem 인터페이스
docs/
├── PRD.md                    # 요구사항 문서
└── ROADMAP.md                # 개발 로드맵 (진행 상황 추적)
CLAUDE.md                     # 아키텍처 가이드
```

---

## 3. Notion SDK v5 Rules

### 필수 API 패턴

| 용도 | 올바른 방법 | 금지 |
|------|------------|------|
| Items DB 목록 조회 | `notion.dataSources.query({ data_source_id, filter })` | `notion.databases.query(...)` |
| 견적서 단건 조회 | `notion.pages.retrieve({ page_id })` | — |
| 페이지 속성 접근 전 | `isFullPage(page)` 가드 통과 후 접근 | 가드 없이 직접 `.properties` 접근 |

### Items DB 쿼리 패턴 (변경 금지)

```ts
const res = await notion.dataSources.query({
  data_source_id: NOTION_ITEMS_DATABASE_ID,
  filter: {
    property: 'Invoices',
    relation: { contains: invoicePageId },
  },
})
```

### 속성 추출 헬퍼 (`src/lib/invoice.ts` 내부)

- `readText(page, prop)` — `rich_text` 타입
- `readTitle(page, prop)` — `title` 타입
- `readEmail(page, prop)` — `email` 타입
- `readNumber(page, prop)` — `number` 타입 (없으면 `0`)
- `readStatus(page, prop)` — `status` 타입
- `readDate(page, prop)` — `date` 타입 (`.start` 값)
- 새 속성 추출 시 위 헬퍼 패턴을 따라 동일 파일에 추가

---

## 4. Notion DB Attribute Names

### Invoices DB

| 속성명 | 노션 타입 | 매핑 필드 | 언어 |
|--------|----------|-----------|------|
| `견적서 번호` | title | `invoiceNumber` | 한글 |
| `발행일` | date | `issuedAt` | 한글 |
| `유효기간` | date | `dueDate` | 한글 |
| `상태` | status | `isPublic` | 한글 |
| `클라이언트명` | rich_text | `client.name` | 한글 |
| `IssuerName` | rich_text | `issuer.name` | 영문 |
| `IssuerContact` | rich_text | `issuer.contact` | 영문 |
| `IssuerEmail` | email | `issuer.email` | 영문 |
| `ClientContact` | rich_text | `client.contact` | 영문 |
| `TaxRate` | number | `taxRate` | 영문 |
| `Note` | rich_text | `note` | 영문 |

### Items DB

| 속성명 | 노션 타입 | 매핑 필드 | 언어 |
|--------|----------|-----------|------|
| `항목명` | title | `name` | 한글 |
| `수량` | number | `quantity` | 한글 |
| `단가` | number | `unitPrice` | 한글 |
| `금액` | number | `amount` | 한글 |
| `Invoices` | relation | (역방향 관계 필터용) | 영문 |

- **속성명 오타 시 빈 값/0이 반환됨** — 오타에 주의
- 새 속성 추가 시 반드시 위 테이블에 추가

---

## 5. Access Control Logic

- `readStatus(page, '상태') === '승인'` → `isPublic = true`
- `getInvoiceBySlug`가 `null` 반환 → 페이지 컴포넌트에서 `notFound()` 호출
- **페이지 컴포넌트에서 `isPublic` 별도 체크 금지** (파서에서 이미 처리)
- 비공개/미존재 모두 동일하게 `null` 반환 → `not-found.tsx` 렌더링

---

## 6. Amount Calculation Rules

```ts
// amount fallback: 금액 필드가 0이면 수량 × 단가로 계산
const amount = readNumber(page, '금액') || quantity * unitPrice

// tax: 소수점 버림 (floor)
const tax = Math.floor(subtotal * taxRate)

// total: subtotal + tax
const total = subtotal + tax
```

- `Math.round`, `Math.ceil` 사용 금지 — 반드시 `Math.floor`

---

## 7. Server-Only Module Rules

- `src/lib/notion.ts`, `src/lib/invoice.ts` — **클라이언트 컴포넌트에서 import 금지**
- 두 파일 최상단에 `import 'server-only'` 존재 → 클라이언트 번들 포함 시 빌드 에러 발생
- 새 서버 전용 lib 파일 추가 시 최상단에 `import 'server-only'` 추가

---

## 8. Environment Variables

| 변수 | 필수 여부 | 설명 |
|------|----------|------|
| `NOTION_API_KEY` | **필수** | Notion Integration Secret |
| `NOTION_ITEMS_DATABASE_ID` | **필수** | Items DB ID (32자 hex 또는 UUID) |
| `NOTION_DATABASE_ID` | 선택 | Invoices DB ID (현재 미사용) |

- 환경 변수 접근 방법: `src/lib/env.ts`의 `env` 객체 또는 `src/lib/notion.ts`의 export 사용
- `process.env.NOTION_*` 직접 접근 금지 (Zod 검증 우회됨)
- 새 환경 변수 추가 시 `src/lib/env.ts` `envSchema`에 Zod 스키마 추가 필수

---

## 9. TypeScript Rules

- 모든 인터페이스 속성에 `readonly` 필수
- `interface` 사용 (`type` alias 지양, 객체 형태는 반드시 `interface`)
- `any` 타입 사용 금지
- 함수 반환 타입 명시 필수
- `const` 우선, `let` 필요시만, `var` 절대 금지
- 타입 정의 위치: `src/types/invoice.ts` (도메인 타입), 컴포넌트 Props는 해당 파일 내

---

## 10. Next.js 15 Specific Rules

```ts
// params는 반드시 Promise로 타이핑하고 await
interface Props {
  params: Promise<{ slug: string }>
}
export default async function Page({ params }: Props) {
  const { slug } = await params  // await 필수
}
```

- `params`를 `{ slug: string }` 직접 타입으로 쓰면 빌드 에러 발생
- RSC(서버 컴포넌트) 기본 — 브라우저 이벤트/훅 필요 시에만 `"use client"` 추가
- `export const revalidate = 60` — invoice 페이지 ISR (변경 금지)
- 404 처리: `notFound()` 함수 호출 (throw 또는 return 패턴 금지)

---

## 11. TailwindCSS v4 Rules

- `tailwind.config.ts` 파일 생성 금지 (v4는 설정 파일 없는 엔진)
- 커스텀 디자인 토큰: `src/app/globals.css` `@theme inline` 블록에 CSS 변수로 추가
- 다크모드: `.dark` 클래스 기반 (`@custom-variant dark (&:is(.dark *))`)

### 인쇄 유틸리티

| 유틸 | 용도 |
|------|------|
| `print:hidden` | 인쇄 시 요소 숨김 (버튼, 액션 바 등) |
| `print:bg-white` | 인쇄 시 배경 흰색 |
| `print:shadow-none` | 인쇄 시 그림자 제거 |
| `print:py-0`, `print:px-0` | 인쇄 시 여백 제거 |

---

## 12. shadcn/ui Rules

- 컴포넌트 추가: `npx shadcn@latest add <component-name>`
- 자동 생성 위치: `src/components/ui/` — 직접 수정 가능
- 스타일: new-york (`components.json` 참조)
- 존재하는 컴포넌트 확인 후 중복 추가 금지

---

## 13. Invoice Component Rules

### 컴포넌트 구조 (`src/components/invoice/`)

| 파일 | 역할 | RSC/Client |
|------|------|------------|
| `InvoiceView.tsx` | 전체 레이아웃 조합 | RSC |
| `InvoiceHeader.tsx` | 견적서 번호·발행일·유효기간 | RSC |
| `PartiesSection.tsx` | 발행자·수신자 정보 | RSC |
| `ItemsTable.tsx` | 품목 테이블 | RSC |
| `SummarySection.tsx` | 합계·세금·총액 | RSC |
| `NoteSection.tsx` | 비고 | RSC |
| `PdfDownloadButton.tsx` | window.print() 버튼 | **Client** |

- `PdfDownloadButton`은 반드시 `"use client"` — `window.print()` 사용
- 새 견적서 섹션 컴포넌트는 기본 RSC로 작성

---

## 14. Formatting Rules

```ts
import { formatKRW, formatDate } from '@/lib/format'

formatKRW(1500000)     // → "1,500,000원"
formatDate('2024-01-15')  // → "2024년 1월 15일"
```

- 금액 표시 시 반드시 `formatKRW` 사용 (직접 `toLocaleString` 호출 금지)
- 날짜 표시 시 반드시 `formatDate` 사용

---

## 15. File Sync Requirements

아래 변경 시 **반드시 동시에** 수정해야 할 파일 목록:

| 변경 내용 | 동시 수정 필요 파일 |
|-----------|-------------------|
| `src/types/invoice.ts` 인터페이스 필드 추가/변경 | `src/lib/invoice.ts` — `mapPageToInvoice` 함수 |
| 노션 DB 속성 추가 | `src/types/invoice.ts` + `src/lib/invoice.ts` (헬퍼 + mapPageToInvoice) |
| 데이터 흐름/아키텍처 변경 | `CLAUDE.md` Architecture 섹션 |
| Task 완료/진행 상태 변경 | `docs/ROADMAP.md` 진행률 테이블 + Task 상태 |

---

## 16. Prohibited Actions

- `notion.databases.query(...)` 호출 — v5에서 제거됨, `dataSources.query` 사용
- `isFullPage(page)` 가드 없이 `page.properties` 접근
- `src/lib/notion.ts` 또는 `src/lib/invoice.ts`를 `"use client"` 컴포넌트에서 import
- `process.env.NOTION_*`를 코드에서 직접 접근
- `tailwind.config.ts` 파일 생성
- `any` 타입 사용
- Next.js 15에서 `params`를 `await` 없이 사용
- `Math.round` 또는 `Math.ceil`로 세금 계산
- `isPublic` 체크를 페이지 컴포넌트에서 중복 수행 (파서 내부에서 처리됨)
- `src/components/ui/` 파일을 직접 생성 (반드시 `npx shadcn@latest add` 사용)
