export interface Issuer {
  name: string
  contact: string
  email: string
}

export interface Client {
  name: string
  contact?: string
}

export interface LineItem {
  id: string
  name: string
  quantity: number
  unitPrice: number
  amount: number
}

export interface Invoice {
  id: string
  slug: string
  invoiceNumber: string
  issuedAt: string // ISO 8601
  dueDate: string // ISO 8601
  issuer: Issuer
  client: Client
  items: LineItem[]
  subtotal: number // 공급가액
  taxRate: number // 예: 0.1 = 10%
  tax: number // subtotal * taxRate
  total: number // subtotal + tax
  note?: string
  isPublic: boolean
}
