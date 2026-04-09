import { Skeleton } from "@/components/ui/skeleton"

interface LoadingSkeletonProps {
  rows?: number
  type?: "table" | "cards" | "list"
}

export function LoadingSkeleton({
  rows = 5,
  type = "table",
}: LoadingSkeletonProps) {
  if (type === "cards") {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: rows }).map((_, index) => (
          <Skeleton key={index} className="h-28 rounded-lg" />
        ))}
      </div>
    )
  }

  if (type === "list") {
    return (
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, index) => (
          <Skeleton key={index} className="h-11 rounded-md" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Skeleton className="h-9 rounded-md" />
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-12 rounded-md" />
      ))}
    </div>
  )
}
