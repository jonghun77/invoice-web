'use client'

import { toast } from 'sonner'
import { Link } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CopyLinkButtonProps {
  readonly slug: string
  readonly isPublic: boolean
}

function fallbackCopy(text: string) {
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.cssText = 'position:fixed;top:-9999px;left:-9999px'
  document.body.appendChild(textarea)
  textarea.focus()
  textarea.select()
  document.execCommand('copy')
  document.body.removeChild(textarea)
}

export function CopyLinkButton({ slug, isPublic }: CopyLinkButtonProps) {
  async function handleCopy(e: React.MouseEvent) {
    e.stopPropagation()
    const origin = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin
    const url = `${origin}/invoice/${slug}`

    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url)
      } else {
        fallbackCopy(url)
      }
      toast.success('링크가 복사되었습니다.')
    } catch {
      toast.error('복사에 실패했습니다.')
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={!isPublic}
      onClick={handleCopy}
      title={!isPublic ? '승인된 견적서만 공유 가능합니다' : '링크 복사'}
      className="gap-1"
    >
      <Link className="h-3.5 w-3.5" />
      복사
    </Button>
  )
}
