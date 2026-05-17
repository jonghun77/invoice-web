export default function InvoiceNotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <p className="text-muted-foreground text-4xl font-bold">404</p>
      <h1 className="text-xl font-semibold">견적서를 찾을 수 없습니다</h1>
      <p className="text-muted-foreground text-sm">
        비공개 상태이거나 존재하지 않는 견적서입니다.
        <br />
        발행자에게 올바른 링크를 요청해 주세요.
      </p>
    </main>
  )
}
