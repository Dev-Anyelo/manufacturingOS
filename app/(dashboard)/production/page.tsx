import Link from "next/link"
import { PlusIcon, ScissorsIcon, LayersIcon, CalendarCheckIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StatCard } from "@/components/shared/stat-card"
import { PageHeader } from "@/components/shared/page-header"
import { decimalToNumber } from "@/lib/api/utils"
import { getProductionSessions } from "@/lib/data/production"
import { ProductionTable } from "@/components/modules/production/production-table"

export default async function ProductionPage() {
  const sessions = await getProductionSessions()

  const rows = sessions.map((session) => ({
    id: session.id,
    sessionDate: session.sessionDate.toISOString(),
    employeeId: session.employeeId,
    employeeName: session.employee.fullName,
    totalGarments: session.totalGarments,
    totalYardsUsed: decimalToNumber(session.totalYardsUsed),
    createdByName: session.createdByProfile?.fullName ?? "Sistema",
  }))

  const today = new Date()
  const todayRows = rows.filter((row) => {
    const sessionDate = new Date(row.sessionDate)
    return (
      sessionDate.getFullYear() === today.getFullYear() &&
      sessionDate.getMonth() === today.getMonth() &&
      sessionDate.getDate() === today.getDate()
    )
  })

  const stats = {
    sessionCount: todayRows.length,
    garmentCount: todayRows.reduce((acc, r) => acc + r.totalGarments, 0),
    yardsUsed: todayRows.reduce((acc, r) => acc + r.totalYardsUsed, 0),
  }

  return (
    <section className="flex flex-col min-h-full p-4 sm:p-6 lg:p-8 gap-6">
      <div className="max-w-[1400px] mx-auto w-full space-y-6">
        <PageHeader
          title="Produccion"
          description="Registra sesiones de confeccion y consumo de materiales."
          breadcrumbs={[
            { label: "Dashboard", href: "/" },
            { label: "Produccion" },
          ]}
          actions={
            <Button
              asChild
              size="sm"
              className="bg-brand text-brand-foreground hover:bg-brand/90 h-9 px-4 font-medium"
            >
              <Link href="/production/new">
                <PlusIcon className="size-4" />
                Nueva sesion
              </Link>
            </Button>
          }
        />

        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <StatCard
            title="Sesiones hoy"
            value={stats.sessionCount}
            description="Sesiones de produccion del dia"
            icon={<CalendarCheckIcon className="size-5" />}
          />
          <StatCard
            title="Prendas hoy"
            value={stats.garmentCount}
            description="Total de prendas confeccionadas hoy"
            icon={<ScissorsIcon className="size-5" />}
            variant={stats.garmentCount > 0 ? "success" : "default"}
          />
          <StatCard
            title="Yardas usadas"
            value={`${stats.yardsUsed.toFixed(1)} yd`}
            description="Tela consumida en sesiones de hoy"
            icon={<LayersIcon className="size-5" />}
            variant={stats.yardsUsed > 0 ? "warning" : "default"}
          />
        </div>

        <ProductionTable sessions={rows} />
      </div>
    </section>
  )
}
