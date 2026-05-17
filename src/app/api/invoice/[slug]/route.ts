import { NextRequest, NextResponse } from 'next/server'
import { getInvoiceBySlug } from '@/lib/invoice'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  // TODO: Phase 1 완료 후 실제 노션 조회로 동작
  const invoice = await getInvoiceBySlug(slug)

  if (!invoice) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INVOICE_NOT_FOUND',
          message: '견적서를 찾을 수 없거나 비공개 상태입니다.',
        },
      },
      { status: 404 }
    )
  }

  return NextResponse.json({ success: true, data: invoice })
}
