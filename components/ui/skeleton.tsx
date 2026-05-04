import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="skeleton"
      className={cn(
        "inline-flex rounded-md bg-muted/20 skeleton-shimmer",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
