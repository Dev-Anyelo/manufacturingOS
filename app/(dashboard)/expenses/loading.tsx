import { Skeleton } from "@/components/ui/skeleton"

export default function ExpensesLoadingPage() {
  return (
    <section className="page-shell">
      <div className="page-content space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-28 rounded-md" />
            <Skeleton className="h-9 w-36 rounded-lg" />
          </div>
          <Skeleton className="h-11 w-full rounded-lg sm:w-40" />
        </div>
        <Skeleton className="h-32 w-full rounded-xl border border-border/70" />
        <Skeleton className="h-96 w-full rounded-xl border border-border/70" />
      </div>
    </section>
  )
}
