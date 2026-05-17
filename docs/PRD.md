# 노션 기반 견적서 웹 뷰어 MVP PRD

## 핵심 정보

**목적**: 노션 데이터베이스에 입력한 견적서를 고객이 웹 URL로 확인하고 PDF로 저장할 수 있게 한다.
**사용자**: 견적서를 발행하는 프리랜서/소상공인(발행자)과 링크를 받아 견적서를 열람하는 고객(수신자).

---

## 사용자 여정

```
1. [발행자] 노션 DB에 견적서 데이터 입력
   ↓ IsPublic = true 로 설정

2. [발행자] /invoice/[slug] URL을 고객에게 전달 (이메일·메신저 등)
   ↓

3. [수신자] URL 접속
   ↓ slug 유효성 검사
   IsPublic = false  → 접근 불가 페이지 (404/비공개 안내)
   IsPublic = true   → 견적서 웹 뷰 페이지
   slug 없음         → 404 페이지
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
| **F001** | 노션 DB 견적서 조회 | slug(UUID)로 노션 API를 호출해 견적서 데이터를 가져온다 | 모든 기능의 데이터 소스 | 견적서 뷰 페이지 |
| **F002** | 견적서 웹 뷰 렌더링 | 발행자 정보·수신자 정보·품목 테이블·합계·세금·최종금액·비고를 화면에 출력한다 | 서비스의 핵심 가치 전달 | 견적서 뷰 페이지 |
| **F003** | PDF 다운로드 | "PDF 다운로드" 버튼 클릭 시 `window.print()`를 호출해 브라우저 인쇄 다이얼로그를 연다 | 고객이 견적서를 저장·출력할 수 있어야 함 | 견적서 뷰 페이지 |
| **F004** | 공개/비공개 접근 제어 | 노션 `IsPublic` 속성이 false이거나 slug가 존재하지 않으면 접근을 차단한다 | 미확정·삭제된 견적서가 외부에 노출되지 않아야 함 | 견적서 뷰 페이지, 접근 불가 페이지 |

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
├── /invoice/[slug]   → 견적서 뷰 페이지  (F001, F002, F003, F004)
└── /invoice/[slug] 접근 차단 시
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
| **진입 경로** | 발행자가 공유한 `/invoice/[slug]` URL 직접 접속 |
| **사용자 행동** | 견적서 내용 전체를 스크롤하며 확인하고, "PDF 다운로드" 버튼을 클릭해 PDF를 저장한다 |
| **주요 기능** | • slug로 노션 API 호출 및 데이터 파싱 (F001)<br>• IsPublic = false이면 접근 불가 페이지로 교체 렌더링 (F004)<br>• 발행자 정보 섹션 출력 (회사명, 담당자, 연락처) (F002)<br>• 수신자 정보 섹션 출력 (고객명, 연락처) (F002)<br>• 품목 테이블 출력 (품목명, 수량, 단가, 금액) (F002)<br>• 합계 / 세금(부가세) / 최종금액 출력 (F002)<br>• 비고 텍스트 출력 (F002)<br>• **"PDF 다운로드"** 버튼 → `window.print()` 실행, 인쇄 시 버튼 숨김 (F003) |
| **다음 이동** | IsPublic = false / slug 없음 → 접근 불가 페이지 표시, PDF 저장 → 브라우저 완료 처리 |

---

### 접근 불가 페이지

> **구현 기능:** `F004` | **인증:** 없음

| 항목 | 내용 |
|------|------|
| **역할** | 비공개 또는 존재하지 않는 견적서에 접근 시 사용자에게 안내 메시지를 보여주는 페이지 |
| **진입 경로** | 견적서 뷰 페이지에서 IsPublic = false 또는 slug 미조회 시 자동 렌더링 |
| **사용자 행동** | 안내 메시지를 확인한다. 추가 액션 없음. |
| **주요 기능** | • "이 견적서는 비공개이거나 존재하지 않습니다" 안내 문구 표시 (F004)<br>• HTTP 상태코드 404 반환 |
| **다음 이동** | 없음 (종단 페이지) |

---

## 데이터 모델

### 노션 DB 속성 매핑

| 노션 속성명 | 노션 타입 | 매핑 필드 | 설명 |
|------------|----------|-----------|------|
| `Slug` | rich_text | `invoice.slug` | UUID, URL에 사용 |
| `InvoiceNumber` | rich_text | `invoice.invoiceNumber` | 견적서 번호 |
| `IssuedAt` | date | `invoice.issuedAt` | 발행일 |
| `DueDate` | date | `invoice.dueDate` | 유효기한 |
| `IssuerName` | rich_text | `invoice.issuer.name` | 발행자 회사명 |
| `IssuerContact` | rich_text | `invoice.issuer.contact` | 발행자 연락처 |
| `IssuerEmail` | email | `invoice.issuer.email` | 발행자 이메일 |
| `ClientName` | rich_text | `invoice.client.name` | 수신자(고객) 이름 |
| `ClientContact` | rich_text | `invoice.client.contact` | 수신자 연락처 |
| `Items` | rich_text (JSON 문자열) | `invoice.items` | 품목 배열, JSON 직렬화 [결정 필요: 별도 관계형 DB 사용 여부] |
| `TaxRate` | number | `invoice.taxRate` | 세율 (예: 0.1 = 10%) |
| `Note` | rich_text | `invoice.note` | 비고 |
| `IsPublic` | checkbox | `invoice.isPublic` | 공개 여부 |

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
  name: string;       // 품목명
  quantity: number;   // 수량
  unitPrice: number;  // 단가 (원)
  amount: number;     // 금액 = quantity * unitPrice
}

interface Invoice {
  id: string;           // 노션 페이지 ID
  slug: string;         // UUID, URL용
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
  isPublic: boolean;    // 공개 여부
}
```

---

## API 설계

### RSC 페이지 — 견적서 웹 뷰

```
GET /invoice/[slug]
```

- **렌더링 방식**: React Server Component (SSR)
- **캐시 전략**: `revalidate: 60` (60초마다 재검증)
- **처리 흐름**:
  1. `slug` 파라미터로 노션 DB 쿼리 (`filter: Slug = slug`)
  2. 결과 없음 또는 `isPublic = false` → `notFound()` 호출
  3. 데이터 파싱 후 `<InvoicePage>` 컴포넌트 렌더링

```ts
// src/app/invoice/[slug]/page.tsx
export const revalidate = 60;

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const invoice = await getInvoiceBySlug(slug);

  if (!invoice || !invoice.isPublic) {
    notFound();
  }

  return <InvoiceView invoice={invoice} />;
}
```

---

### Route Handler — JSON API

```
GET /api/invoice/[slug]
```

- **용도**: 클라이언트 사이드 fetch 또는 외부 연동 [결정 필요: MVP에 포함할지 RSC만으로 충분한지]
- **인증**: 없음 (UUID slug 추측 어려움에 의존)

**성공 응답 (200)**

```json
{
  "success": true,
  "data": {
    "id": "abc123",
    "slug": "550e8400-e29b-41d4-a716-446655440000",
    "invoiceNumber": "INV-2024-001",
    "issuedAt": "2024-01-15T00:00:00.000Z",
    "dueDate": "2024-02-15T00:00:00.000Z",
    "issuer": {
      "name": "홍길동 디자인",
      "contact": "010-1234-5678",
      "email": "hong@example.com"
    },
    "client": {
      "name": "(주)클라이언트사",
      "contact": "02-9876-5432"
    },
    "items": [
      {
        "name": "웹사이트 디자인",
        "quantity": 1,
        "unitPrice": 1500000,
        "amount": 1500000
      },
      {
        "name": "로고 디자인",
        "quantity": 2,
        "unitPrice": 300000,
        "amount": 600000
      }
    ],
    "subtotal": 2100000,
    "taxRate": 0.1,
    "tax": 210000,
    "total": 2310000,
    "note": "계약금 50% 선입금 후 작업 시작",
    "isPublic": true
  }
}
```

**실패 응답 — 존재하지 않거나 비공개 (404)**

```json
{
  "success": false,
  "error": {
    "code": "INVOICE_NOT_FOUND",
    "message": "견적서를 찾을 수 없거나 비공개 상태입니다."
  }
}
```

**실패 응답 — 노션 API 오류 (500)**

```json
{
  "success": false,
  "error": {
    "code": "NOTION_API_ERROR",
    "message": "노션 데이터를 가져오는 중 오류가 발생했습니다."
  }
}
```

---

## 개발 단계

### Phase 1 — 노션 연동 & 데이터 파이프라인

- [ ] 노션 통합(Integration) 생성 및 `NOTION_API_KEY`, `NOTION_DATABASE_ID` 환경 변수 설정
- [ ] `@notionhq/client` 설치 및 클라이언트 초기화 (`src/lib/notion.ts`)
- [ ] 노션 DB에 위 속성 스키마 구성
- [ ] `getInvoiceBySlug(slug: string): Promise<Invoice | null>` 함수 구현
- [ ] 노션 응답 → `Invoice` 인터페이스 파싱 및 타입 변환 유틸 작성
- [ ] `Items` JSON 파싱 처리 [결정 필요: 노션 rich_text JSON vs 별도 테이블 구조]

### Phase 2 — 견적서 웹 뷰 UI

- [ ] `src/app/invoice/[slug]/page.tsx` RSC 페이지 구현
- [ ] `src/app/invoice/[slug]/not-found.tsx` 접근 불가 페이지 구현
- [ ] `<InvoiceView>` 컴포넌트 구현
  - `<IssuerSection>` — 발행자 정보
  - `<ClientSection>` — 수신자 정보
  - `<ItemsTable>` — 품목 테이블
  - `<SummarySection>` — 합계·세금·최종금액
  - `<NoteSection>` — 비고
- [ ] 견적서 레이아웃 스타일링 (TailwindCSS v4 + shadcn/ui new-york)
- [ ] 인쇄 시 숨길 요소 `@media print` CSS 처리

### Phase 3 — PDF 다운로드 & 배포

- [ ] "PDF 다운로드" 버튼 컴포넌트 구현 (`window.print()` 호출)
- [ ] `@media print` CSS — 버튼 숨김, 여백·폰트 인쇄 최적화
- [ ] `src/app/api/invoice/[slug]/route.ts` Route Handler 구현 (선택)
- [ ] Vercel 환경 변수 설정 (`NOTION_API_KEY`, `NOTION_DATABASE_ID`)
- [ ] Vercel 배포 및 공개 URL 동작 검증

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

- **`@notionhq/client`** — 노션 공식 SDK, DB 쿼리 및 페이지 조회

### PDF 생성

- **`window.print()`** + **`@media print` CSS** — 브라우저 내장 인쇄 기능 활용 (외부 라이브러리 불필요)

### 배포

- **Vercel** — Next.js 15 최적화 배포, 환경 변수 관리

### 설치 명령어

```bash
npm install @notionhq/client
```

---

## 환경 변수

```bash
# .env.local
NOTION_API_KEY=secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NOTION_DATABASE_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 미결 사항 (결정 필요)

| 태그 | 항목 | 옵션 |
|------|------|------|
| [결정 필요] | 품목(Items) 저장 방식 | A) 노션 rich_text에 JSON 문자열로 저장 (단순, 편집 불편) / B) 노션 관계형 DB로 별도 Items 테이블 구성 (정규화, 복잡도 증가) |
| [결정 필요] | Route Handler 포함 여부 | RSC 단독으로 충분하면 `/api/invoice/[slug]` 생략 가능 |
| [결정 필요] | 견적서 번호 형식 | 예: `INV-2024-001` — 노션에서 수동 입력 vs 자동 채번 |
| [결정 필요] | 금액 단위 | 원화(KRW) 단독 표시 vs 통화 필드 추가 |
