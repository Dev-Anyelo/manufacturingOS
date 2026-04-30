import { cn } from "@/lib/utils"

interface ProgressProps {
  value: number
  className?: string
  indicatorClassName?: string
}

export function Progress({
  value,
  className,
  indicatorClassName,
}: ProgressProps) {
  const normalizedValue = Math.max(0, Math.min(100, value))

  return (
    <div
      data-slot="progress"
      className={cn(
        "h-2 w-full overflow-hidden rounded-full bg-muted",
        className
      )}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(normalizedValue)}
    >
      <div
        data-slot="progress-indicator"
        className={cn(
          "h-full rounded-full bg-emerald-500 transition-all duration-200 dark:bg-emerald-500",
          indicatorClassName
        )}
        style={{ width: `${normalizedValue}%` }}
      />
    </div>
  )
}
