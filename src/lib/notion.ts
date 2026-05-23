import 'server-only'
import { Client } from '@notionhq/client'
import { env } from '@/lib/env'

// Notion API 클라이언트 싱글톤 — 서버 사이드 전용
export const notion = new Client({
  auth: env.NOTION_API_KEY,
})

export const NOTION_ITEMS_DATABASE_ID = env.NOTION_ITEMS_DATABASE_ID

// database_id → data_source_id 변환 캐시 (프로세스 수명 동안 유지)
const _dsCache = new Map<string, string>()

/**
 * Notion 데이터베이스 ID로 연결된 Data Source ID를 조회합니다.
 * API v2025-09-03에서 database_id와 data_source_id는 별개입니다.
 * 결과는 모듈 수준 캐시에 저장해 중복 API 호출을 방지합니다.
 */
export async function getDataSourceId(databaseId: string): Promise<string> {
  const cached = _dsCache.get(databaseId)
  if (cached) return cached

  const res = await notion.request<{
    data_sources?: Array<{ id: string }>
  }>({
    method: 'get',
    path: `databases/${databaseId}`,
  })

  const id = res.data_sources?.[0]?.id
  if (!id)
    throw new Error(
      `[getDataSourceId] No data source found for database ${databaseId}`
    )

  _dsCache.set(databaseId, id)
  return id
}
