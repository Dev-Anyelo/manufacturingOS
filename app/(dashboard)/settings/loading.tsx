import { Skeleton } from "@/components/ui/skeleton"

export default function SettingsLoadingPage() {
  return (
    <section className="page-shell">
      <div className="page-content space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-36 rounded-md" />
          <Skeleton className="h-9 w-56 rounded-lg" />
        </div>
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg border border-border/70" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="min-h-[220px] rounded-xl border border-border/70" />
          <Skeleton className="min-h-[220px] rounded-xl border border-border/70" />
        </div>
      </div>
    </section>
  )
}
