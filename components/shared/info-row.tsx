export function InfoRow({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="space-y-1 rounded-lg border border-border/50 bg-muted/10 p-2.5">
      <p className="label-overline">{label}</p>
      <div className="text-sm leading-relaxed font-medium text-foreground">
        {value}
      </div>
    </div>
  )
}
