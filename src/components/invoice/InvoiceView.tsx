import type { Invoice } from '@/types/invoice'
import { Separator } from '@/components/ui/separator'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import InvoiceHeader from './InvoiceHeader'
import PartiesSection from './PartiesSection'
import ItemsTable from './ItemsTable'
import SummarySection from './SummarySection'
import NoteSection from './NoteSection'
import PdfDownloadButton from './PdfDownloadButton'

export default function InvoiceView({ invoice }: { invoice: Invoice }) {
  return (
    <div className="bg-muted/40 min-h-screen py-8 print:bg-white print:py-0">
      <div className="mx-auto max-w-3xl">
        {/* 인쇄 시 숨김 — 상단 액션 바 */}
        <div className="mb-4 flex items-center justify-end gap-2 px-4 print:hidden">
          <ThemeToggle />
          <PdfDownloadButton />
        </div>

        {/* 견적서 본문 — 인쇄 대상 */}
        <article className="bg-card px-12 py-10 shadow-sm print:px-0 print:py-0 print:shadow-none">
          <InvoiceHeader invoice={invoice} />
          <Separator className="my-8" />
          <PartiesSection invoice={invoice} />
          <Separator className="my-8" />
          <ItemsTable items={invoice.items} />
          <SummarySection invoice={invoice} />
          {invoice.note && (
            <>
              <Separator className="my-8" />
              <NoteSection note={invoice.note} />
            </>
          )}
        </article>
      </div>
    </div>
  )
}
