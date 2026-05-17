import 'server-only'
import { isFullPage, isFullBlock } from '@notionhq/client'
import type {
  PageObjectResponse,
  TableBlockObjectResponse,
  TableRowBlockObjectResponse,
} from '@notionhq/client/build/src/api-endpoints'
import { notion, NOTION_DATABASE_ID } from '@/lib/notion'
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

function readCheckbox(page: PageObjectResponse, prop: string): boolean {
  const p = page.properties[prop]
  if (!p || p.type !== 'checkbox') return false
  return p.checkbox
}

function readDate(page: PageObjectResponse, prop: string): string {
  const p = page.properties[prop]
  if (!p || p.type !== 'date') return ''
  return p.date?.start ?? ''
}

// ─── 페이지 본문 테이블 블록 → LineItem[] ───────────────────────────────────
// 노션 페이지 본문에 아래 형식의 테이블을 작성하세요:
// | 품목명 | 수량 | 단가 | 금액 |
// |--------|------|------|------|
// | 예시   |  1   | 1000 | 1000 |

async function getLineItems(pageId: string): Promise<LineItem[]> {
  // 1단계: 페이지 자식 블록에서 table 블록 찾기
  const blocksRes = await notion.blocks.children.list({
    block_id: pageId,
    page_size: 100,
  })

  const tableBlock = blocksRes.results
    .filter(isFullBlock)
    .find((b): b is TableBlockObjectResponse => b.type === 'table')

  if (!tableBlock) return []

  // 2단계: table 블록의 자식(table_row)들 가져오기
  const rowsRes = await notion.blocks.children.list({
    block_id: tableBlock.id,
    page_size: 100,
  })

  const rows = rowsRes.results
    .filter(isFullBlock)
    .filter((b): b is TableRowBlockObjectResponse => b.type === 'table_row')

  // has_column_header = true이면 첫 번째 행은 헤더이므로 건너뜀
  const dataRows = tableBlock.table.has_column_header ? rows.slice(1) : rows

  return dataRows
    .map((row, index) => {
      const cells = row.table_row.cells

      const name = cells[0]?.[0]?.plain_text ?? ''
      if (!name) return null

      // 쉼표 제거 후 숫자 파싱 (예: "1,000" → 1000)
      const quantity = Number(
        cells[1]?.[0]?.plain_text?.replace(/,/g, '') ?? '0'
      )
      const unitPrice = Number(
        cells[2]?.[0]?.plain_text?.replace(/,/g, '') ?? '0'
      )
      const parsedAmount = Number(
        cells[3]?.[0]?.plain_text?.replace(/,/g, '') ?? '0'
      )

      return {
        id: `item-${index + 1}`,
        name,
        quantity,
        unitPrice,
        amount: parsedAmount || quantity * unitPrice,
      }
    })
    .filter((item): item is LineItem => item !== null)
}

// ─── 노션 페이지 → Invoice 타입 변환 ────────────────────────────────────────

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
    name: readText(page, 'ClientName'),
    contact: readText(page, 'ClientContact') || undefined,
  }

  return {
    id: page.id,
    // InvoiceNumber는 title 또는 rich_text 두 가지 경우를 모두 처리
    invoiceNumber:
      readTitle(page, 'InvoiceNumber') || readText(page, 'InvoiceNumber'),
    slug: readText(page, 'Slug'),
    issuedAt: readDate(page, 'IssuedAt'),
    dueDate: readDate(page, 'DueDate'),
    issuer,
    client,
    items,
    subtotal,
    taxRate,
    tax,
    total: subtotal + tax,
    note: readText(page, 'Note') || undefined,
    isPublic: readCheckbox(page, 'IsPublic'),
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * slug(UUID)로 노션 DB에서 공개 견적서를 조회합니다.
 * 존재하지 않거나 isPublic = false이면 null을 반환합니다.
 */
export async function getInvoiceBySlug(slug: string): Promise<Invoice | null> {
  try {
    // v5.x: databases.query → dataSources.query (data_source_id 사용)
    const res = await notion.dataSources.query({
      data_source_id: NOTION_DATABASE_ID,
      page_size: 1,
      filter: {
        and: [
          { property: 'Slug', rich_text: { equals: slug } },
          { property: 'IsPublic', checkbox: { equals: true } },
        ],
      },
    })

    if (res.results.length === 0) return null

    const page = res.results[0]
    if (!isFullPage(page)) return null

    const items = await getLineItems(page.id)
    return mapPageToInvoice(page, items)
  } catch (err) {
    console.error('[getInvoiceBySlug] Notion API 오류:', err)
    return null
  }
}
