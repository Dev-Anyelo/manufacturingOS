import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

type SkeletonType = "table" | "cards" | "form" | "detail" | "kanban" | "list"

interface LoadingSkeletonProps {
  rows?: number
  type?: SkeletonType
  className?: string
}

export function LoadingSkeleton({
  rows = 5,
  type = "table",
  className,
}: LoadingSkeletonProps) {
  if (type === "cards") {
    return (
      <div
        className={cn(
          "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4",
          className
        )}
      >
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={index}
            className="rounded-xl border border-border/70 bg-card/80 p-5"
          >
            <Skeleton className="skeleton-shimmer mb-3 h-3 w-24 rounded" />
            <Skeleton className="skeleton-shimmer mb-2 h-8 w-20 rounded" />
            <Skeleton className="skeleton-shimmer h-3 w-32 rounded" />
          </div>
        ))}
      </div>
    )
  }

  if (type === "list") {
    return (
      <div className={cn("space-y-2", className)}>
        {Array.from({ length: rows }).map((_, index) => (
          <Skeleton key={index} className="skeleton-shimmer h-11 rounded-lg" />
        ))}
      </div>
    )
  }

  if (type === "form") {
    return (
      <div className={cn("grid grid-cols-1 gap-4 md:grid-cols-2", className)}>
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="skeleton-shimmer h-3 w-32 rounded" />
            <Skeleton className="skeleton-shimmer h-10 w-full rounded-md" />
          </div>
        ))}
      </div>
    )
  }

  if (type === "detail") {
    return (
      <div className={cn("space-y-4", className)}>
        <Skeleton className="skeleton-shimmer h-44 w-full rounded-xl" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton
              key={index}
              className="skeleton-shimmer h-16 w-full rounded-lg"
            />
          ))}
        </div>
      </div>
    )
  }

  if (type === "kanban") {
    return (
      <div
        className={cn(
          "grid grid-cols-1 gap-4 lg:grid-cols-3 xl:grid-cols-5",
          className
        )}
      >
        {Array.from({ length: 5 }).map((_, columnIndex) => (
          <div
            key={columnIndex}
            className="space-y-3 rounded-xl border border-border bg-card p-3"
          >
            <Skeleton className="skeleton-shimmer h-5 w-24 rounded" />
            {Array.from({ length: 3 }).map((_, cardIndex) => (
              <Skeleton
                key={`${columnIndex}-${cardIndex}`}
                className="skeleton-shimmer h-24 w-full rounded-lg"
              />
            ))}
          </div>
        ))}
      </div>
    )
  }

  /* Default: table skeleton */
  return (
    <div
      className={cn(
        "space-y-0 overflow-hidden rounded-xl border border-border/70 bg-card/90",
        className
      )}
    >
      {/* Header */}
      <div className="bg-muted/30 px-4 py-3">
        <Skeleton className="skeleton-shimmer h-4 w-full rounded" />
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-4 border-t border-border px-4 py-3"
        >
          <Skeleton className="skeleton-shimmer h-4 w-1/4 rounded" />
          <Skeleton className="skeleton-shimmer h-4 w-1/3 rounded" />
          <Skeleton className="skeleton-shimmer h-4 w-1/5 rounded" />
          <Skeleton className="skeleton-shimmer h-4 w-1/6 rounded" />
        </div>
      ))}
    </div>
  )
}
