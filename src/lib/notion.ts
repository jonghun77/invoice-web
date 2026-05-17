import 'server-only'
import { Client } from '@notionhq/client'

// Notion API 클라이언트 싱글톤 — 서버 사이드 전용
export const notion = new Client({
  auth: process.env.NOTION_API_KEY,
})

export const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID ?? ''
