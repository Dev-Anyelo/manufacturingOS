import Link from "next/link"
import { Button } from "@/components/ui/button"
import { decimalToNumber } from "@/lib/api/utils"
import { PageHeader } from "@/components/shared/page-header"
import { KpiSection } from "@/components/shared/kpi-section"
import { CompactKpiCard } from "@/components/shared/compact-kpi-card"
import { getProductionSessions, getProductionFormBootstrap } from "@/lib/data/production"
import { ProductionTable } from "@/components/modules/production/production-table"
import { NewProductionSheet } from "@/components/modules/production/new-production-sheet"

import {
  PlusIcon,
  ScissorsIcon,
  LayersIcon,
  CalendarCheckIcon,
} from "lucide-react"

export default async function ProductionPage() {
  const [sessions, bootstrap] = await Promise.all([
    getProductionSessions(),
    getProductionFormBootstrap()
  ])

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
      <div className="page-content space-y-6">
        <PageHeader
          title="Producción"
          description="Registra sesiones de confección y consumo de materiales."
          breadcrumbs={[
            { label: "Dashboard", href: "/" },
            { label: "Producción" },
          ]}
          actions={
            <NewProductionSheet 
              employees={bootstrap.employees}
              inventoryItems={bootstrap.inventoryItems.map((i) => ({
                id: i.id,
                name: i.name,
                unit: i.unit,
                quantity: decimalToNumber(i.quantity),
              }))}
            />
          }
        />

        <KpiSection label="Resumen del día" gridClassName="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <CompactKpiCard
            label="Sesiones hoy"
            value={stats.sessionCount}
            icon={<CalendarCheckIcon />}
            iconClass="bg-muted text-muted-foreground"
          />
          <CompactKpiCard
            label="Prendas hoy"
            value={stats.garmentCount}
            icon={<ScissorsIcon />}
            iconClass={
              stats.garmentCount > 0
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                : "bg-muted text-muted-foreground"
            }
          />
          <CompactKpiCard
            label="Yardas usadas"
            value={`${stats.yardsUsed.toFixed(1)} yd`}
            icon={<LayersIcon />}
            iconClass={
              stats.yardsUsed > 0
                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                : "bg-muted text-muted-foreground"
            }
          />
        </KpiSection>

        <ProductionTable sessions={rows} />
      </div>
    </section>
  )
}
