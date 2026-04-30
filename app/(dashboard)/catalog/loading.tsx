import { Skeleton } from "@/components/ui/skeleton"

export default function CatalogLoadingPage() {
  return (
    <section className="page-shell">
      <div className="page-content space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-36 rounded-md" />
            <Skeleton className="h-9 w-40 rounded-lg" />
          </div>
          <Skeleton className="h-11 w-full rounded-lg sm:w-52" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-28 rounded-lg" />
          <Skeleton className="h-10 w-28 rounded-lg" />
          <Skeleton className="h-10 flex-1 rounded-lg md:max-w-xs" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[4/5] rounded-xl border border-border/60" />
          ))}
        </div>
      </div>
    </section>
  )
}
