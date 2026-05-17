'use client'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function PdfDownloadButton() {
  return (
    <Button size="sm" onClick={() => window.print()}>
      <Download className="mr-2 h-4 w-4" />
      PDF 다운로드
    </Button>
  )
}
