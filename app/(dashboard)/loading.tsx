import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoadingPage() {
  return (
    <section className="page-shell">
      <div className="page-content space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-10 w-2/3 max-w-md rounded-lg" />
          <Skeleton className="h-4 w-52 rounded-md" />
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border/70 bg-card/95 p-4 shadow-card sm:p-5"
            >
              <Skeleton className="mb-3 h-3 w-28 rounded" />
              <Skeleton className="mb-2 h-9 w-20 rounded-md" />
              <Skeleton className="h-3 w-full rounded" />
            </div>
          ))}
        </div>
        <Skeleton className="h-72 w-full rounded-xl border border-border/70" />
        <div className="grid gap-4 xl:grid-cols-3">
          <Skeleton className="h-64 rounded-xl xl:col-span-2" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    </section>
  )
}
