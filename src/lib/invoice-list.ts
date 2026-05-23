import 'server-only'

import { isFullPage } from '@notionhq/client'
import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints'
import { notion, getDataSourceId } from '@/lib/notion'
import { env } from '@/lib/env'
import type { InvoiceSummary } from '@/types/invoice'

// ─── 속성 추출 헬퍼 ──────────────────────────────────────────────────────────

function readTitle(page: PageObjectResponse, prop: string): string {
  const p = page.properties[prop]
  if (!p || p.type !== 'title') return ''
  return p.title[0]?.plain_text ?? ''
}

function readText(page: PageObjectResponse, prop: string): string {
  const p = page.properties[prop]
  if (!p || p.type !== 'rich_text') return ''
  return p.rich_text[0]?.plain_text ?? ''
}

function readDate(page: PageObjectResponse, prop: string): string {
  const p = page.properties[prop]
  if (!p || p.type !== 'date') return ''
  return p.date?.start ?? ''
}

function readStatus(page: PageObjectResponse, prop: string): string {
  const p = page.properties[prop]
  if (!p || p.type !== 'status') return ''
  return p.status?.name ?? ''
}

function readNumber(page: PageObjectResponse, prop: string): number {
  const p = page.properties[prop]
  if (!p || p.type !== 'number') return 0
  return p.number ?? 0
}

// ─── 노션 페이지 → InvoiceSummary 변환 ──────────────────────────────────────

function mapPageToSummary(page: PageObjectResponse): InvoiceSummary {
  const status = readStatus(page, '상태')
  return {
    slug: page.id,
    invoiceNumber:
      readTitle(page, '견적서 번호') || readText(page, '견적서 번호') || '',
    clientName: readText(page, '클라이언트명'),
    issuedAt: readDate(page, '발행일'),
    status: status || '대기',
    total: readNumber(page, 'total') || readNumber(page, '총금액'),
    isPublic: status === '승인',
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * 노션 Invoices DB의 전체 견적서 목록을 조회합니다.
 * 페이지네이션을 처리해 100건을 초과해도 전체를 반환합니다.
 * API 오류 시 빈 배열을 반환합니다.
 */
export async function listInvoices(): Promise<InvoiceSummary[]> {
  try {
    const results: PageObjectResponse[] = []
    let cursor: string | undefined = undefined

    const dataSourceId = await getDataSourceId(env.NOTION_DATABASE_ID)

    do {
      const response = await notion.dataSources.query({
        data_source_id: dataSourceId,
        ...(cursor ? { start_cursor: cursor } : {}),
      })

      const pages = response.results.filter(isFullPage)
      results.push(...pages)
      cursor =
        response.has_more && response.next_cursor
          ? response.next_cursor
          : undefined
    } while (cursor)

    return results.map(mapPageToSummary)
  } catch (err) {
    console.error('[listInvoices] Notion API 오류:', err)
    return []
  }
}
