# 노션 기반 견적서 웹 뷰어 MVP PRD

## 핵심 정보

**목적**: 노션 데이터베이스에 입력한 견적서를 고객이 웹 URL로 확인하고 PDF로 저장할 수 있게 한다.
**사용자**: 견적서를 발행하는 프리랜서/소상공인(발행자)과 링크를 받아 견적서를 열람하는 고객(수신자).

---

## 사용자 여정

```
1. [발행자] 노션 DB에 견적서 데이터 입력
   ↓ 상태 = "승인" 으로 설정

2. [발행자] /invoice/[노션 페이지 ID] URL을 고객에게 전달 (이메일·메신저 등)
   ↓

3. [수신자] URL 접속
   ↓ 페이지 ID 유효성 검사
   상태 ≠ "승인"  → 접근 불가 페이지 (404/비공개 안내)
   상태 = "승인"  → 견적서 웹 뷰 페이지
   ID 없음        → 404 페이지
   ↓

4. [수신자] 견적서 웹 뷰 페이지에서 내용 확인
   ↓ "PDF 다운로드" 버튼 클릭

5. [수신자] 브라우저 인쇄 다이얼로그 → "PDF로 저장" 선택
   ↓ 완료
```

---

## 기능 명세

### 1. MVP 핵심 기능

| ID | 기능명 | 설명 | MVP 필수 이유 | 관련 페이지 |
|----|--------|------|--------------|------------|
| **F001** | 노션 DB 견적서 조회 | 노션 페이지 ID로 `pages.retrieve`를 호출해 견적서 데이터를 가져온다. 페이지 ID는 노션이 자동 생성하는 UUID라 별도 Slug 속성이 불필요하다 | 모든 기능의 데이터 소스 | 견적서 뷰 페이지 |
| **F002** | 견적서 웹 뷰 렌더링 | 발행자 정보·수신자 정보·품목 테이블·합계·세금·최종금액·비고를 화면에 출력한다 | 서비스의 핵심 가치 전달 | 견적서 뷰 페이지 |
| **F003** | PDF 다운로드 | "PDF 다운로드" 버튼 클릭 시 `window.print()`를 호출해 브라우저 인쇄 다이얼로그를 연다 | 고객이 견적서를 저장·출력할 수 있어야 함 | 견적서 뷰 페이지 |
| **F004** | 공개/비공개 접근 제어 | 노션 `상태` 속성이 `"승인"`이 아니거나 페이지 ID가 존재하지 않으면 접근을 차단한다 | 미확정·거절된 견적서가 외부에 노출되지 않아야 함 | 견적서 뷰 페이지, 접근 불가 페이지 |

### 2. MVP 이후 기능 (제외)

- 이메일 자동 발송
- 전자서명 및 결제 연동
- 회원가입/로그인 UI
- 다국어 지원
- 견적서 목록 관리 화면

---

## 메뉴 구조

```
공개 URL (인증 없음)
├── /invoice/[pageId]   → 견적서 뷰 페이지  (F001, F002, F003, F004)
└── /invoice/[pageId] 접근 차단 시
    └── 접근 불가 페이지              (F004)
```

> 내비게이션 메뉴 없음. 단일 공개 URL 구조.

---

## 페이지별 상세 기능

### 견적서 뷰 페이지

> **구현 기능:** `F001`, `F002`, `F003`, `F004` | **인증:** 없음 (공개 URL)

| 항목 | 내용 |
|------|------|
| **역할** | 노션 DB의 견적서 데이터를 웹으로 렌더링하는 핵심 페이지 |
| **진입 경로** | 발행자가 공유한 `/invoice/[노션 페이지 ID]` URL 직접 접속 |
| **사용자 행동** | 견적서 내용 전체를 스크롤하며 확인하고, "PDF 다운로드" 버튼을 클릭해 PDF를 저장한다 |
| **주요 기능** | • 페이지 ID로 노션 `pages.retrieve` 호출 및 데이터 파싱 (F001)<br>• `상태 ≠ "승인"`이면 접근 불가 페이지로 교체 렌더링 (F004)<br>• 발행자 정보 섹션 출력 (회사명, 담당자, 연락처) (F002)<br>• 수신자 정보 섹션 출력 (고객명, 연락처) (F002)<br>• 품목 테이블 출력 (품목명, 수량, 단가, 금액) (F002)<br>• 합계 / 세금(부가세) / 최종금액 출력 (F002)<br>• 비고 텍스트 출력 (F002)<br>• **"PDF 다운로드"** 버튼 → `window.print()` 실행, 인쇄 시 버튼 숨김 (F003) |
| **다음 이동** | 상태 ≠ 승인 / 페이지 없음 → 접근 불가 페이지 표시, PDF 저장 → 브라우저 완료 처리 |

---

### 접근 불가 페이지

> **구현 기능:** `F004` | **인증:** 없음

| 항목 | 내용 |
|------|------|
| **역할** | 비공개 또는 존재하지 않는 견적서에 접근 시 사용자에게 안내 메시지를 보여주는 페이지 |
| **진입 경로** | 견적서 뷰 페이지에서 상태 ≠ 승인 또는 페이지 미조회 시 자동 렌더링 |
| **사용자 행동** | 안내 메시지를 확인한다. 추가 액션 없음. |
| **주요 기능** | • "이 견적서는 비공개이거나 존재하지 않습니다" 안내 문구 표시 (F004)<br>• HTTP 상태코드 404 반환 |
| **다음 이동** | 없음 (종단 페이지) |

---

## 데이터 모델

### Invoices DB 속성 매핑

> 기존 한글 속성명은 그대로 유지하고, 신규 추가 속성은 영문으로 작성한다.

| 노션 속성명 | 노션 타입 | 매핑 필드 | 비고 |
|------------|----------|-----------|------|
| *(페이지 ID)* | — | `invoice.slug` | 노션이 자동 생성하는 UUID. 별도 속성 불필요 |
| `견적서 번호` | title | `invoice.invoiceNumber` | 수동 입력 (`INV-YYYY-NNN` 형식 권장) |
| `발행일` | date | `invoice.issuedAt` | |
| `유효기간` | date | `invoice.dueDate` | |
| `상태` | status | `invoice.isPublic` | `승인` = 공개, `대기`/`거절` = 비공개 |
| `클라이언트명` | rich_text | `invoice.client.name` | |
| `항목` | relation → Items DB | `invoice.items` | Items DB와 관계형으로 연결 |
| `IssuerName` | rich_text | `invoice.issuer.name` | **추가 필요** |
| `IssuerContact` | rich_text | `invoice.issuer.contact` | **추가 필요** |
| `IssuerEmail` | email | `invoice.issuer.email` | **추가 필요** |
| `ClientContact` | rich_text | `invoice.client.contact` | **추가 필요** (선택) |
| `TaxRate` | number | `invoice.taxRate` | **추가 필요** (0.1 = 10%) |
| `Note` | rich_text | `invoice.note` | **추가 필요** (선택) |

### Items DB 속성 매핑

> Invoices DB와 관계형으로 연결된 별도 테이블. `NOTION_ITEMS_DATABASE_ID`로 참조.

| 노션 속성명 | 노션 타입 | 매핑 필드 |
|------------|----------|-----------|
| `항목명` | title | `lineItem.name` |
| `수량` | number | `lineItem.quantity` |
| `단가` | number | `lineItem.unitPrice` |
| `금액` | number | `lineItem.amount` (`금액 = 0`이면 `수량 × 단가`로 계산) |
| `Invoices` | relation → Invoices DB | (역방향 관계) |

### TypeScript 인터페이스

```ts
interface Issuer {
  name: string;       // 발행자 회사명 또는 이름
  contact: string;    // 전화번호
  email: string;      // 이메일
}

interface Client {
  name: string;       // 수신자(고객) 이름 또는 회사명
  contact?: string;   // 전화번호 (선택)
}

interface LineItem {
  id: string;         // 노션 Items DB 페이지 ID
  name: string;       // 품목명
  quantity: number;   // 수량
  unitPrice: number;  // 단가 (원)
  amount: number;     // 금액 = quantity * unitPrice
}

interface Invoice {
  id: string;           // 노션 Invoices DB 페이지 ID
  slug: string;         // 노션 페이지 ID (= id, URL용)
  invoiceNumber: string;
  issuedAt: string;     // ISO 8601
  dueDate: string;      // ISO 8601
  issuer: Issuer;
  client: Client;
  items: LineItem[];
  subtotal: number;     // 공급가액 합계 (원)
  taxRate: number;      // 세율 (0.1 = 10%)
  tax: number;          // 세금 = subtotal * taxRate
  total: number;        // 최종금액 = subtotal + tax
  note?: string;        // 비고
  isPublic: boolean;    // 상태 === "승인"
}
```

---

## API 설계

### RSC 페이지 — 견적서 웹 뷰

```
GET /invoice/[pageId]
```

- **렌더링 방식**: React Server Component (SSR)
- **캐시 전략**: `revalidate: 60` (60초마다 재검증)
- **처리 흐름**:
  1. `pageId`로 `notion.pages.retrieve({ page_id: pageId })` 호출
  2. 상태 ≠ `"승인"` 또는 페이지 없음 → `notFound()` 호출
  3. Items DB를 관계 필터로 쿼리해 LineItem[] 파싱
  4. 데이터 파싱 후 `<InvoiceView>` 컴포넌트 렌더링

```ts
// src/app/invoice/[slug]/page.tsx
export const revalidate = 60;

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const invoice = await getInvoiceBySlug(slug); // slug = 노션 페이지 ID

  if (!invoice) notFound();

  return <InvoiceView invoice={invoice} />;
}
```

---

### Route Handler — JSON API

```
GET /api/invoice/[pageId]
```

- **용도**: 클라이언트 사이드 fetch 또는 외부 연동용 JSON 엔드포인트
- **인증**: 없음 (노션 페이지 ID의 UUID 추측 불가에 의존)

---

## 기술 스택

### 프레임워크

- **Next.js 15.5.3** (App Router + Turbopack) — RSC 기반 SSR
- **React 19.1.0** — UI 라이브러리
- **TypeScript 5** — 타입 안전성

### 스타일링 & UI

- **TailwindCSS v4** — 유틸리티 CSS (설정 파일 없는 새 엔진)
- **shadcn/ui** (new-york 스타일) — 컴포넌트 라이브러리
- **Lucide React** — 아이콘

### 노션 연동

- **`@notionhq/client` v5** — 노션 공식 SDK
  - DB 쿼리: `notion.dataSources.query({ data_source_id })` (`databases.query` v5에서 제거됨)
  - 단건 조회: `notion.pages.retrieve({ page_id })`

### PDF 생성

- **`window.print()`** + **`@media print` CSS** — 브라우저 내장 인쇄 기능 활용 (외부 라이브러리 불필요)

### 배포

- **Vercel** — Next.js 15 최적화 배포, 환경 변수 관리

---

## 환경 변수

```bash
# .env
NOTION_API_KEY=secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NOTION_ITEMS_DATABASE_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx   # Items DB ID
NOTION_DATABASE_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx          # Invoices DB ID (선택, 현재 미사용)
```

> `.gitignore`에 `.env*`가 설정되어 있어 `.env` 파일은 git에 커밋되지 않는다.

---

## 설계 결정 사항

| 항목 | 결정 | 근거 |
|------|------|------|
| **품목 저장 방식** | 별도 관계형 DB (Items DB) | 노션에서 이미 이 구조로 설계됨 |
| **Slug 생성 방식** | 노션 페이지 ID 자동 사용 | 페이지 생성 시 UUID가 자동 부여되어 별도 Slug 속성 불필요 |
| **공개/비공개 제어** | `상태` Status 필드 사용 (`승인` = 공개) | 발행자가 이미 `대기/거절/승인` 워크플로우로 설계함 |
| **SDK v5 API** | `dataSources.query` + `pages.retrieve` | v5에서 `databases.query` 제거됨 |
| **속성명 언어** | 기존 한글 유지, 신규 추가는 영문 | 노션 편의성 유지 |
| **금액 단위** | 원화(KRW) 단독 표시 | MVP 범위 |
| **Route Handler** | RSC와 함께 구현 (`/api/invoice/[slug]`) | 외부 연동 가능성 대비 |
