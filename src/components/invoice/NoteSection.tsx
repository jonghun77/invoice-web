export default function NoteSection({ note }: { note: string }) {
  return (
    <div>
      <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-widest uppercase">
        비고
      </p>
      <p className="text-sm whitespace-pre-wrap">{note}</p>
    </div>
  )
}
