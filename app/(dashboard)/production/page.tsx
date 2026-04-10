import Link from "next/link"

import { Button } from "@/components/ui/button"
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

  return (
    <div className="mx-auto flex w-full max-w-350 flex-col gap-6">
      <PageHeader
        title="Produccion"
        description="Registra sesiones de confeccion y consumo de materiales."
        actions={
          <Button asChild className="bg-brand text-brand-foreground">
            <Link href="/production/new">Nueva sesion</Link>
          </Button>
        }
      />

      <ProductionTable sessions={rows} />
    </div>
  )
}
