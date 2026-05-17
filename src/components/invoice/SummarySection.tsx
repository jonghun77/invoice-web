import type { Invoice } from '@/types/invoice'
import { formatKRW } from '@/lib/format'
import { Separator } from '@/components/ui/separator'

export default function SummarySection({ invoice }: { invoice: Invoice }) {
  const { subtotal, taxRate, tax, total } = invoice
  const taxPercent = Math.round(taxRate * 100)

  return (
    <div className="mt-4 flex justify-end">
      <div className="w-60">
        <div className="flex justify-between py-1.5 text-sm">
          <span className="text-muted-foreground">공급가액</span>
          <span>{formatKRW(subtotal)}</span>
        </div>
        <div className="flex justify-between py-1.5 text-sm">
          <span className="text-muted-foreground">부가세 ({taxPercent}%)</span>
          <span>{formatKRW(tax)}</span>
        </div>
        <Separator className="my-2" />
        <div className="flex justify-between py-1.5 text-base font-bold">
          <span>합계</span>
          <span>{formatKRW(total)}</span>
        </div>
      </div>
    </div>
  )
}
