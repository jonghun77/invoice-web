'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { CopyLinkButton } from '@/components/admin/CopyLinkButton'
import { formatKRW, formatDate } from '@/lib/format'
import type { InvoiceSummary } from '@/types/invoice'

interface InvoiceListTableProps {
  readonly items: InvoiceSummary[]
}

type SortKey = 'issuedAt' | 'total'
type SortDir = 'asc' | 'desc'

export function InvoiceListTable({ items }: InvoiceListTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('issuedAt')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const sorted = [...items].sort((a, b) => {
    let diff = 0
    if (sortKey === 'issuedAt') {
      diff = a.issuedAt.localeCompare(b.issuedAt)
    } else {
      diff = a.total - b.total
    }
    return sortDir === 'asc' ? diff : -diff
  })

  function handleRowClick(slug: string) {
    window.open(`/invoice/${slug}`, '_blank')
  }

  if (items.length === 0) {
    return (
      <div className="text-muted-foreground flex flex-col items-center justify-center py-16">
        <p className="text-sm">등록된 견적서가 없습니다.</p>
      </div>
    )
  }

  const sortArrow = (key: SortKey) =>
    sortKey === key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''

  return (
    <>
      {/* 데스크톱 테이블 (md 이상) */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>견적서 번호</TableHead>
              <TableHead>클라이언트</TableHead>
              <TableHead
                className="hover:text-foreground cursor-pointer select-none"
                onClick={() => handleSort('issuedAt')}
              >
                발행일{sortArrow('issuedAt')}
              </TableHead>
              <TableHead>상태</TableHead>
              <TableHead
                className="hover:text-foreground cursor-pointer text-right select-none"
                onClick={() => handleSort('total')}
              >
                총액{sortArrow('total')}
              </TableHead>
              <TableHead className="w-24">액션</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map(item => (
              <TableRow
                key={item.slug}
                className="cursor-pointer"
                onClick={() => handleRowClick(item.slug)}
              >
                <TableCell className="font-medium">
                  {item.invoiceNumber}
                </TableCell>
                <TableCell>{item.clientName}</TableCell>
                <TableCell>{formatDate(item.issuedAt)}</TableCell>
                <TableCell>
                  <StatusBadge status={item.status} />
                </TableCell>
                <TableCell className="text-right">
                  {formatKRW(item.total)}
                </TableCell>
                <TableCell>
                  <CopyLinkButton slug={item.slug} isPublic={item.isPublic} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* 모바일 카드 (md 미만) */}
      <div className="flex flex-col gap-3 md:hidden">
        {sorted.map(item => (
          <div
            key={item.slug}
            className="hover:bg-muted/50 cursor-pointer rounded-lg border p-4 transition-colors"
            onClick={() => handleRowClick(item.slug)}
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="font-medium">{item.invoiceNumber}</span>
              <StatusBadge status={item.status} />
            </div>
            <p className="text-muted-foreground mb-1 text-sm">
              {item.clientName}
            </p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {formatDate(item.issuedAt)}
              </span>
              <span className="font-semibold">{formatKRW(item.total)}</span>
            </div>
            <div className="mt-2 flex justify-end">
              <CopyLinkButton slug={item.slug} isPublic={item.isPublic} />
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

// Suspense fallback용 skeleton 컴포넌트
export function InvoiceListSkeleton() {
  return (
    <>
      {/* 데스크톱 skeleton */}
      <div className="hidden md:block">
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
      {/* 모바일 skeleton */}
      <div className="flex flex-col gap-3 md:hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    </>
  )
}
