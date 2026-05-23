import 'server-only'
import { cache } from 'react'
import { isFullPage } from '@notionhq/client'
import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints'
import { notion, NOTION_ITEMS_DATABASE_ID } from '@/lib/notion'
import type { Invoice, Issuer, Client, LineItem } from '@/types/invoice'

// ─── Notion 속성 추출 헬퍼 ──────────────────────────────────────────────────

function readText(page: PageObjectResponse, prop: string): string {
  const p = page.properties[prop]
  if (!p || p.type !== 'rich_text') return ''
  return p.rich_text[0]?.plain_text ?? ''
}

function readTitle(page: PageObjectResponse, prop: string): string {
  const p = page.properties[prop]
  if (!p || p.type !== 'title') return ''
  return p.title[0]?.plain_text ?? ''
}

function readEmail(page: PageObjectResponse, prop: string): string {
  const p = page.properties[prop]
  if (!p || p.type !== 'email') return ''
  return p.email ?? ''
}

function readNumber(page: PageObjectResponse, prop: string): number {
  const p = page.properties[prop]
  if (!p || p.type !== 'number') return 0
  return p.number ?? 0
}

function readStatus(page: PageObjectResponse, prop: string): string {
  const p = page.properties[prop]
  if (!p || p.type !== 'status') return ''
  return p.status?.name ?? ''
}

function readDate(page: PageObjectResponse, prop: string): string {
  const p = page.properties[prop]
  if (!p || p.type !== 'date') return ''
  return p.date?.start ?? ''
}

// ─── Items DB → LineItem[] ───────────────────────────────────────────────────
// Items DB는 Invoices DB와 관계형으로 연결된 별도 테이블입니다.
// 'Invoices' 관계 속성으로 해당 견적서 페이지 ID가 포함된 항목만 가져옵니다.
//
// Items DB 속성 매핑:
//   항목명 (title)  → name
//   수량   (number) → quantity
//   단가   (number) → unitPrice
//   금액   (number) → amount

async function getLineItems(invoicePageId: string): Promise<LineItem[]> {
  const res = await notion.dataSources.query({
    data_source_id: NOTION_ITEMS_DATABASE_ID,
    filter: {
      property: 'Invoices',
      relation: { contains: invoicePageId },
    },
  })

  return res.results
    .filter(isFullPage)
    .map(page => {
      const name = readTitle(page, '항목명')
      if (!name) return null
      const quantity = readNumber(page, '수량')
      const unitPrice = readNumber(page, '단가')
      const amount = readNumber(page, '금액') || quantity * unitPrice
      return { id: page.id, name, quantity, unitPrice, amount }
    })
    .filter((item): item is LineItem => item !== null)
}

// ─── 노션 페이지 → Invoice 타입 변환 ────────────────────────────────────────
//
// Invoices DB 속성 매핑:
//   견적서 번호 (title)     → invoiceNumber
//   발행일      (date)      → issuedAt
//   유효기간    (date)      → dueDate
//   클라이언트명 (rich_text) → client.name
//   IsPublic    (checkbox)  → isPublic
//
// 아래 속성은 노션 DB에 직접 추가 필요 (영문 이름 권장):
//   IssuerName, IssuerContact, IssuerEmail, ClientContact, TaxRate, Note
// 속성이 없으면 빈 값/기본값으로 처리됩니다.
// slug는 노션 페이지 ID를 자동으로 사용합니다 (별도 Slug 속성 불필요).
// isPublic은 기존 '상태' 필드로 판단합니다: 상태 === '승인' → 공개.

function mapPageToInvoice(
  page: PageObjectResponse,
  items: LineItem[]
): Invoice {
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0)
  const taxRate = readNumber(page, 'TaxRate')
  const tax = Math.floor(subtotal * taxRate)

  const issuer: Issuer = {
    name: readText(page, 'IssuerName'),
    contact: readText(page, 'IssuerContact'),
    email: readEmail(page, 'IssuerEmail'),
  }

  const client: Client = {
    name: readText(page, '클라이언트명'),
    contact: readText(page, 'ClientContact') || undefined,
  }

  return {
    id: page.id,
    invoiceNumber: readTitle(page, '견적서 번호'),
    slug: page.id,
    issuedAt: readDate(page, '발행일'),
    dueDate: readDate(page, '유효기간'),
    issuer,
    client,
    items,
    subtotal,
    taxRate,
    tax,
    total: subtotal + tax,
    note: readText(page, 'Note') || undefined,
    isPublic: readStatus(page, '상태') === '승인',
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * 노션 페이지 ID로 공개 견적서를 조회합니다.
 * IsPublic = false이거나 페이지가 존재하지 않으면 null을 반환합니다.
 * slug = 노션 페이지 ID (자동 UUID, 별도 Slug 속성 불필요)
 */
export const getInvoiceBySlug = cache(
  async (pageId: string): Promise<Invoice | null> => {
    try {
      const page = await notion.pages.retrieve({ page_id: pageId })
      if (!isFullPage(page)) return null
      if (readStatus(page, '상태') !== '승인') return null

      const items = await getLineItems(page.id)
      return mapPageToInvoice(page, items)
    } catch (err) {
      console.error('[getInvoiceBySlug] Notion API 오류:', err)
      return null
    }
  }
)
