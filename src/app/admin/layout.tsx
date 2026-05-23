import type { Metadata } from 'next'
import { LogoutButton } from '@/components/admin/LogoutButton'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { Toaster } from '@/components/ui/sonner'

export const metadata: Metadata = {
  title: '관리자 | 견적서',
}

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <header className="border-b print:hidden">
        <div className="flex items-center justify-between px-6 py-4">
          <h1 className="text-xl font-semibold">견적서 관리</h1>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="container mx-auto px-6 py-8">{children}</main>
      <Toaster />
    </>
  )
}
