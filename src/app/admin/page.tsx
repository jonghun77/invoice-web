import { Suspense } from 'react'
import { listInvoices } from '@/lib/invoice-list'
import {
  InvoiceListTable,
  InvoiceListSkeleton,
} from '@/components/admin/InvoiceListTable'

async function InvoiceList() {
  const items = await listInvoices()
  return (
    <>
      <p className="text-muted-foreground mb-4 text-sm">총 {items.length}건</p>
      <InvoiceListTable items={items} />
    </>
  )
}

export default function AdminPage() {
  return (
    <>
      <h2 className="mb-6 text-2xl font-bold">견적서 목록</h2>
      <Suspense fallback={<InvoiceListSkeleton />}>
        <InvoiceList />
      </Suspense>
    </>
  )
}
