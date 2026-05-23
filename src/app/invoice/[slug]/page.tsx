import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getInvoiceBySlug } from '@/lib/invoice'
import InvoiceView from '@/components/invoice/InvoiceView'

export const revalidate = 60

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const invoice = await getInvoiceBySlug(slug)
  if (!invoice) return { title: '견적서를 찾을 수 없습니다' }
  return { title: `견적서 ${invoice.invoiceNumber}` }
}

export default async function InvoicePage({ params }: Props) {
  const { slug } = await params
  const invoice = await getInvoiceBySlug(slug)

  if (!invoice) {
    notFound()
  }

  return <InvoiceView invoice={invoice} />
}
