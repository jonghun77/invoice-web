export interface Issuer {
  readonly name: string
  readonly contact: string
  readonly email: string
}

export interface Client {
  readonly name: string
  readonly contact?: string
}

export interface LineItem {
  readonly id: string
  readonly name: string
  readonly quantity: number
  readonly unitPrice: number
  readonly amount: number
}

export interface Invoice {
  readonly id: string
  readonly slug: string
  readonly invoiceNumber: string
  readonly issuedAt: string // ISO 8601
  readonly dueDate: string // ISO 8601
  readonly issuer: Issuer
  readonly client: Client
  readonly items: readonly LineItem[]
  readonly subtotal: number // 공급가액
  readonly taxRate: number // 예: 0.1 = 10%
  readonly tax: number // subtotal * taxRate
  readonly total: number // subtotal + tax
  readonly note?: string
  readonly isPublic: boolean
}

export interface InvoiceSummary {
  readonly slug: string
  readonly invoiceNumber: string
  readonly clientName: string
  readonly issuedAt: string // ISO 8601
  readonly status: string // "승인" | "대기" | "거절"
  readonly total: number
  readonly isPublic: boolean
}
