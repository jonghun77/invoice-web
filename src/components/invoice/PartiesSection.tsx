import type { Invoice } from '@/types/invoice'

function PartyBlock({
  label,
  name,
  email,
  contact,
}: {
  label: string
  name: string
  email?: string
  contact?: string
}) {
  return (
    <div>
      <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-widest uppercase">
        {label}
      </p>
      <p className="font-semibold">{name}</p>
      {email && <p className="text-muted-foreground mt-1 text-sm">{email}</p>}
      {contact && (
        <p className="text-muted-foreground mt-0.5 text-sm">{contact}</p>
      )}
    </div>
  )
}

export default function PartiesSection({ invoice }: { invoice: Invoice }) {
  return (
    <div className="grid grid-cols-2 gap-8">
      <PartyBlock
        label="공급자 (발행자)"
        name={invoice.issuer.name}
        email={invoice.issuer.email}
        contact={invoice.issuer.contact}
      />
      <PartyBlock
        label="공급받는자 (수신자)"
        name={invoice.client.name}
        contact={invoice.client.contact}
      />
    </div>
  )
}
