import { NextRequest, NextResponse } from 'next/server'

export const config = {
  matcher: ['/admin', '/admin/:path*'],
}

async function hashPassword(password: string): Promise<string> {
  const encoded = new TextEncoder().encode(password)
  const buffer = await crypto.subtle.digest('SHA-256', encoded)
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === '/admin/login') {
    return NextResponse.next()
  }

  const token = request.cookies.get('admin-token')?.value

  if (!token) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  const password = process.env.ADMIN_PASSWORD
  if (!password) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  const expected = await hashPassword(password)

  if (token !== expected) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  return NextResponse.next()
}
