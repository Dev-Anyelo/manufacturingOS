import { cn } from "@/lib/utils"

export function MetricCard({
  label,
  value,
  icon,
  accent = "default",
  sub,
}: {
  label: string
  value: React.ReactNode
  icon: React.ReactNode
  accent?: "default" | "brand" | "warning" | "success"
  sub?: React.ReactNode
}) {
  const accentStyles = {
    default: "text-foreground/50",
    brand: "text-brand",
    warning: "text-warning",
    success: "text-brand",
  }

  return (
    <div className="rounded-xl border border-border/70 bg-card/95 p-4 shadow-card transition-colors hover:bg-card">
      <div className="flex items-start justify-between gap-2">
        <p className="label-overline">{label}</p>
        <span className={cn("mt-0.5", accentStyles[accent])}>{icon}</span>
      </div>
      <div className="mt-2 text-foreground">{value}</div>
      {sub ? <div className="mt-2">{sub}</div> : null}
    </div>
  )
}
