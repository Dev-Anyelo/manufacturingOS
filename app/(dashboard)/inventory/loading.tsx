import { Skeleton } from "@/components/ui/skeleton"

export default function InventoryLoadingPage() {
  return (
    <section className="page-shell">
      <div className="page-content space-y-6">
        <header className="mb-1 flex animate-fade-in flex-col gap-3 pt-0 sm:gap-4">
          <Skeleton className="h-4 w-48 rounded-md" />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-3xl space-y-2">
              <Skeleton className="h-9 w-56 max-w-full rounded-lg" />
              <Skeleton className="h-4 w-full max-w-md rounded-md" />
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Skeleton className="h-10 w-full rounded-lg sm:w-28" />
              <Skeleton className="h-10 w-full rounded-lg sm:w-40" />
            </div>
          </div>
        </header>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={`stat-${i}`}
              className="rounded-xl border border-border/70 bg-card/95 p-4 shadow-card sm:p-5"
            >
              <div className="mb-3 flex justify-between gap-2">
                <Skeleton className="h-3 w-24 rounded" />
                <Skeleton className="size-6 shrink-0 rounded-md" />
              </div>
              <Skeleton className="mb-3 h-8 w-16 rounded-md" />
              <Skeleton className="h-3 w-full max-w-[12rem] rounded" />
            </div>
          ))}
        </div>

        <div className="space-y-4 rounded-xl border border-border/70 bg-card/90 p-4 shadow-card">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Skeleton className="h-10 w-full rounded-lg sm:max-w-xs" />
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-9 w-36 rounded-md" />
              <Skeleton className="h-9 w-36 rounded-md" />
            </div>
          </div>
          <div className="hidden overflow-hidden rounded-lg border border-border/60 md:block">
            <div className="flex gap-4 border-b border-border/60 bg-muted/25 px-4 py-3">
              <Skeleton className="h-4 flex-1 rounded" />
              <Skeleton className="h-4 w-28 rounded" />
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-4 w-20 rounded" />
            </div>
            {Array.from({ length: 6 }).map((_, row) => (
              <div
                key={`row-${row}`}
                className="flex gap-4 border-b border-border/40 px-4 py-3 last:border-b-0"
              >
                <Skeleton className="h-10 flex-1 rounded-md" />
                <Skeleton className="h-10 w-28 rounded-md" />
                <Skeleton className="h-10 w-24 rounded-md" />
                <Skeleton className="h-10 w-12 shrink-0 rounded-md" />
              </div>
            ))}
          </div>
          <div className="space-y-3 md:hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={`mob-${i}`}
                className="rounded-xl border border-border/60 bg-card p-4"
              >
                <Skeleton className="mb-3 h-5 w-2/3 rounded" />
                <Skeleton className="mb-2 h-12 w-full rounded-lg" />
                <Skeleton className="h-16 w-full rounded-lg" />
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-3 border-t border-border/50 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <Skeleton className="h-4 w-48 rounded" />
            <Skeleton className="h-9 w-full rounded-lg sm:w-56" />
          </div>
        </div>
      </div>
    </section>
  )
}
