import 'server-only'
import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  VERCEL_URL: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NOTION_API_KEY: z
    .string()
    .min(
      1,
      'NOTION_API_KEY가 설정되지 않았습니다. .env.local 파일에 Notion Integration Secret을 입력하세요.'
    ),
  NOTION_ITEMS_DATABASE_ID: z
    .string()
    .min(
      1,
      'NOTION_ITEMS_DATABASE_ID가 설정되지 않았습니다. .env.local 파일에 Items 데이터베이스 ID를 입력하세요.'
    ),
  NOTION_DATABASE_ID: z
    .string()
    .min(1, 'NOTION_DATABASE_ID가 설정되지 않았습니다.'),
  ADMIN_PASSWORD: z.string().min(8, 'ADMIN_PASSWORD는 8자 이상이어야 합니다.'),
})

export const env = envSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  VERCEL_URL: process.env.VERCEL_URL,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NOTION_API_KEY: process.env.NOTION_API_KEY,
  NOTION_ITEMS_DATABASE_ID: process.env.NOTION_ITEMS_DATABASE_ID,
  NOTION_DATABASE_ID: process.env.NOTION_DATABASE_ID,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
})

export type Env = z.infer<typeof envSchema>
