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
            className="rounded-xl border border-border/50 bg-card p-4 shadow-sm"
          >
            <Skeleton className="mb-3 h-4 w-28 rounded-md" />
            <Skeleton className="mb-2 h-7 w-20 rounded-md" />
            <Skeleton className="h-3 w-32 rounded-md" />
          </div>
        ))}
      </div>
    )
  }

  if (type === "list") {
    return (
      <div className={cn("space-y-2", className)}>
        {Array.from({ length: rows }).map((_, index) => (
          <Skeleton key={index} className="h-11 rounded-lg" />
        ))}
      </div>
    )
  }

  if (type === "form") {
    return (
      <div className={cn("grid grid-cols-1 gap-4 md:grid-cols-2", className)}>
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-4 w-32 rounded-md" />
            <Skeleton className="h-9 w-full rounded-md" />
          </div>
        ))}
      </div>
    )
  }

  if (type === "detail") {
    return (
      <div className={cn("space-y-4", className)}>
        <Skeleton className="h-44 w-full rounded-xl" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-16 w-full rounded-lg" />
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
            className="space-y-3 rounded-xl border border-border/50 bg-card p-3 shadow-sm"
          >
            <Skeleton className="h-5 w-24 rounded-md" />
            {Array.from({ length: 3 }).map((_, cardIndex) => (
              <Skeleton
                key={`${columnIndex}-${cardIndex}`}
                className="h-24 w-full rounded-lg"
              />
            ))}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="rounded-xl border border-border/50 bg-card p-3 shadow-sm">
        <Skeleton className="h-6 w-full rounded-md" />
      </div>
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="rounded-xl border border-border/50 bg-card p-3 shadow-sm"
        >
          <Skeleton className="h-6 w-full rounded-md" />
        </div>
      ))}
    </div>
  )
}
