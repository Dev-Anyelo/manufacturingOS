import { Skeleton } from "@/components/ui/skeleton"

export default function ProductionLoadingPage() {
  return (
    <section className="page-shell">
      <div className="page-content space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-36 rounded-md" />
            <Skeleton className="h-9 w-52 rounded-lg" />
            <Skeleton className="h-4 w-full max-w-md rounded-md" />
          </div>
          <Skeleton className="h-11 w-full rounded-lg sm:w-48" />
        </div>
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-3 xl:gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border/70 bg-card/95 p-4 shadow-card"
            >
              <Skeleton className="mb-3 h-3 w-28 rounded" />
              <Skeleton className="mb-2 h-8 w-16 rounded-md" />
              <Skeleton className="h-3 w-36 rounded" />
            </div>
          ))}
        </div>
        <Skeleton className="h-96 w-full rounded-xl border border-border/70" />
      </div>
    </section>
  )
}
