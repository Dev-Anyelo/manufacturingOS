import { decimalToNumber } from "@/lib/api/utils"
import { parseDateParam } from "@/lib/api/utils"
import { PageHeader } from "@/components/shared/page-header"
import { KpiSection } from "@/components/shared/kpi-section"
import { requireCurrentUser } from "@/lib/auth/current-user"
import { UrlDateFilter } from "@/components/shared/url-date-filter"
import { CompactKpiCard } from "@/components/shared/compact-kpi-card"
import { ScissorsIcon, LayersIcon, CalendarCheckIcon } from "lucide-react"
import { normalizeDateOnly, formatDateOnlyInput } from "@/lib/currency/exchange"
import { ProductionTable } from "@/components/modules/production/production-table"
import { NewProductionSheet } from "@/components/modules/production/new-production-sheet"

import {
  getProductionSessions,
  getProductionFormBootstrap,
} from "@/lib/data/production"

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

export default async function ProductionPage(props: {
  searchParams: SearchParams
}) {
  const searchParams = await props.searchParams
  const from = Array.isArray(searchParams.from)
    ? searchParams.from[0]
    : searchParams.from
  const to = Array.isArray(searchParams.to)
    ? searchParams.to[0]
    : searchParams.to

  const dateFrom = parseDateParam(from)
  const dateTo = parseDateParam(to)

  const [sessions, bootstrap, currentUser] = await Promise.all([
    getProductionSessions({ dateFrom, dateTo }),
    getProductionFormBootstrap(),
    requireCurrentUser(),
  ])

  const rows = sessions.map((session) => ({
    id: session.id,
    sessionDate: formatDateOnlyInput(session.sessionDate),
    employeeId: session.employeeId,
    employeeName: session.employee.fullName,
    totalGarments: session.totalGarments,
    totalYardsUsed: decimalToNumber(session.totalYardsUsed),
    createdByName: session.createdByProfile?.fullName ?? "Sistema",
  }))

  const today = normalizeDateOnly(new Date())
  const todayRows = rows.filter((row) => {
    const sessionDate = normalizeDateOnly(row.sessionDate)
    return (
      today !== null &&
      sessionDate !== null &&
      sessionDate.getTime() === today.getTime()
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
            <div className="flex flex-row gap-3">
              <UrlDateFilter />
              <NewProductionSheet
                employees={bootstrap.employees}
                inventoryItems={bootstrap.inventoryItems.map((i) => ({
                  id: i.id,
                  name: i.name,
                  unit: i.unit,
                  quantity: decimalToNumber(i.quantity),
                }))}
                currentUserId={currentUser.id}
                currentUserRole={currentUser.role}
              />
            </div>
          }
        />

        <KpiSection
          label="Resumen del día"
          gridClassName="grid grid-cols-2 sm:grid-cols-3 gap-3"
        >
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

        <ProductionTable
          sessions={rows}
          canDelete={
            currentUser.role === "admin" || currentUser.role === "manager"
          }
        />
      </div>
    </section>
  )
}
