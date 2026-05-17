import { notFound } from 'next/navigation'
import { getInvoiceBySlug } from '@/lib/invoice'
import InvoiceView from '@/components/invoice/InvoiceView'

export const revalidate = 60

interface Props {
  params: Promise<{ slug: string }>
}

export default async function InvoicePage({ params }: Props) {
  const { slug } = await params
  const invoice = await getInvoiceBySlug(slug)

  if (!invoice) {
    notFound()
  }

  return <InvoiceView invoice={invoice} />
}
