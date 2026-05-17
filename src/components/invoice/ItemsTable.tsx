import type { LineItem } from '@/types/invoice'
import { formatKRW } from '@/lib/format'

export default function ItemsTable({ items }: { items: LineItem[] }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-border border-y">
          <th className="py-2.5 text-left font-semibold">품목명</th>
          <th className="py-2.5 text-center font-semibold">수량</th>
          <th className="py-2.5 text-right font-semibold">단가</th>
          <th className="py-2.5 text-right font-semibold">금액</th>
        </tr>
      </thead>
      <tbody>
        {items.map(item => (
          <tr key={item.id} className="border-border/40 border-b">
            <td className="py-3">{item.name}</td>
            <td className="text-muted-foreground py-3 text-center">
              {item.quantity}
            </td>
            <td className="text-muted-foreground py-3 text-right">
              {formatKRW(item.unitPrice)}
            </td>
            <td className="py-3 text-right font-medium">
              {formatKRW(item.amount)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
