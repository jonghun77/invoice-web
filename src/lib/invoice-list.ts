import 'server-only'

import type { InvoiceSummary } from '@/types/invoice'

export async function listInvoices(): Promise<InvoiceSummary[]> {
  throw new Error('Not implemented — T024에서 구현 예정')
}
