import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  readonly status: string
}

// 상태별 색상 클래스 매핑 (TailwindCSS v4 직접 클래스 사용)
const STATUS_STYLES: Record<string, string> = {
  승인: 'border-transparent bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  대기: 'border-transparent bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  거절: 'border-transparent bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <Badge
      className={cn(
        STATUS_STYLES[status] ??
          'bg-muted text-muted-foreground border-transparent'
      )}
    >
      {status}
    </Badge>
  )
}
