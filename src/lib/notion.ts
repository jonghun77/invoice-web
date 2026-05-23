import 'server-only'
import { Client } from '@notionhq/client'
import { env } from '@/lib/env'

// Notion API 클라이언트 싱글톤 — 서버 사이드 전용
export const notion = new Client({
  auth: env.NOTION_API_KEY,
})

export const NOTION_DATABASE_ID = env.NOTION_DATABASE_ID ?? ''
export const NOTION_ITEMS_DATABASE_ID = env.NOTION_ITEMS_DATABASE_ID
