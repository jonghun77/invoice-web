import { createHash } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { env } from '@/lib/env'

function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex')
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { password?: string }
  const { password } = body

  if (!password || password !== env.ADMIN_PASSWORD) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_PASSWORD' } },
      { status: 401 }
    )
  }

  const token = hashPassword(env.ADMIN_PASSWORD)

  const response = NextResponse.json({ success: true })
  response.cookies.set('admin-token', token, {
    httpOnly: true,
    sameSite: 'strict',
    path: '/',
    maxAge: 604800,
  })

  return response
}
