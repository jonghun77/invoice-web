/** 숫자를 한국 원화 형식으로 변환합니다. 예: 1500000 → "1,500,000원" */
export function formatKRW(amount: number): string {
  return amount.toLocaleString('ko-KR') + '원'
}

/** ISO 8601 날짜 문자열을 한국어 날짜로 변환합니다. 예: "2024-01-15" → "2024년 1월 15일" */
export function formatDate(iso: string): string {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
