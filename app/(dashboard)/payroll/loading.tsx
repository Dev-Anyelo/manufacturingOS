import { Skeleton } from "@/components/ui/skeleton"

export default function PayrollLoadingPage() {
  return (
    <section className="page-shell">
      <div className="page-content space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32 rounded-md" />
          <Skeleton className="h-9 w-44 rounded-lg" />
          <Skeleton className="h-4 w-full max-w-lg rounded-md" />
        </div>
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-3 xl:gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border/70 bg-card/95 p-4 shadow-card"
            >
              <Skeleton className="mb-3 h-3 w-32 rounded" />
              <Skeleton className="mb-2 h-8 w-14 rounded-md" />
              <Skeleton className="h-3 w-full rounded" />
            </div>
          ))}
        </div>
        <Skeleton className="h-11 w-full rounded-xl md:w-48" />
        <Skeleton className="h-96 w-full rounded-xl border border-border/70" />
      </div>
    </section>
  )
}
