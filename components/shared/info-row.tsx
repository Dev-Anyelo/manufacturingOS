export function InfoRow({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="space-y-0.5">
      <p className="label-overline">{label}</p>
      <div className="text-sm font-medium text-foreground">{value}</div>
    </div>
  )
}
