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
    warning: "text-amber-500",
    success: "text-brand",
  }

  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
          {label}
        </p>
        <span className={cn("mt-0.5", accentStyles[accent])}>{icon}</span>
      </div>
      <div className="mt-2">{value}</div>
      {sub}
    </div>
  )
}
