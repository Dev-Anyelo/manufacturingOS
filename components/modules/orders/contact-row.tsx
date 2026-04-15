import { cn } from "@/lib/utils"

export function ContactRow({
  icon,
  value,
  empty,
}: {
  icon: React.ReactNode
  value: string
  empty: boolean
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 text-sm",
        empty ? "text-muted-foreground/60" : "text-foreground/80"
      )}
    >
      <span className="shrink-0 text-muted-foreground">{icon}</span>
      <span className={empty ? "italic" : ""}>{value}</span>
    </div>
  )
}
