import type { Invoice } from '@/types/invoice'
import { formatDate } from '@/lib/format'

export default function InvoiceHeader({ invoice }: { invoice: Invoice }) {
  return (
    <div>
      <h1 className="text-center text-3xl font-bold tracking-[0.3em]">
        견 적 서
      </h1>
      <div className="mt-8 flex justify-between text-sm">
        <div>
          <p className="text-muted-foreground">견적번호</p>
          <p className="mt-0.5 font-medium">{invoice.invoiceNumber}</p>
        </div>
        <div className="text-right">
          <div>
            <p className="text-muted-foreground">발행일</p>
            <p className="mt-0.5 font-medium">{formatDate(invoice.issuedAt)}</p>
          </div>
          <div className="mt-3">
            <p className="text-muted-foreground">유효기한</p>
            <p className="mt-0.5 font-medium">{formatDate(invoice.dueDate)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
