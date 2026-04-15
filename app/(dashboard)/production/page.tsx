import Link from "next/link"
import { Button } from "@/components/ui/button"
import { decimalToNumber } from "@/lib/api/utils"
import { StatCard } from "@/components/shared/stat-card"
import { PageHeader } from "@/components/shared/page-header"
import { getProductionSessions } from "@/lib/data/production"
import { ProductionTable } from "@/components/modules/production/production-table"

import {
  PlusIcon,
  ScissorsIcon,
  LayersIcon,
  CalendarCheckIcon,
} from "lucide-react"

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
    <section className="page-shell">
      <div className="page-content">
        <PageHeader
          title="Produccion"
          description="Registra sesiones de confeccion y consumo de materiales."
          breadcrumbs={[
            { label: "Dashboard", href: "/" },
            { label: "Produccion" },
          ]}
          actions={
            <Button asChild size="sm">
              <Link href="/production/new">
                <PlusIcon className="size-4" />
                Nueva sesion
              </Link>
            </Button>
          }
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
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
