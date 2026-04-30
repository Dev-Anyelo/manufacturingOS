import { Skeleton } from "@/components/ui/skeleton"

export default function SalesLoadingPage() {
  return (
    <section className="page-shell">
      <div className="page-content space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32 rounded-md" />
            <Skeleton className="h-9 w-40 rounded-lg" />
            <Skeleton className="h-4 w-full max-w-md rounded-md" />
          </div>
          <Skeleton className="h-11 w-full rounded-lg sm:w-44" />
        </div>
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4 xl:gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border/70 bg-card/95 p-4 shadow-card"
            >
              <Skeleton className="mb-3 h-3 w-24 rounded" />
              <Skeleton className="mb-2 h-8 w-24 rounded-md" />
              <Skeleton className="h-3 w-full rounded" />
            </div>
          ))}
        </div>
        <Skeleton className="h-[380px] w-full rounded-xl border border-border/70" />
      </div>
    </section>
  )
}
