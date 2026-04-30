import { Skeleton } from "@/components/ui/skeleton"

export default function ReportsLoadingPage() {
  return (
    <section className="page-shell">
      <div className="page-content space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-28 rounded-md" />
          <Skeleton className="h-9 w-48 rounded-lg" />
          <Skeleton className="h-4 w-full max-w-xl rounded-md" />
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl border border-border/70" />
          ))}
        </div>
        <Skeleton className="min-h-[280px] w-full rounded-xl border border-border/70" />
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl border border-border/70" />
          ))}
        </div>
      </div>
    </section>
  )
}
