import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeftIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/shared/page-header"
import { decimalToNumber } from "@/lib/api/utils"
import { getProductionSession } from "@/lib/data/production"
import { ProductionSessionDetail } from "@/components/modules/production/production-session-detail"

type ProductionDetailPageProps = {
  params: Promise<{ id: string }> | { id: string }
}

export default async function ProductionDetailPage({
  params,
}: ProductionDetailPageProps) {
  const { id } = await params
  const session = await getProductionSession(id)

  if (!session) {
    notFound()
  }

  return (
    <div className="page-shell">
      <PageHeader
        title={`Sesión #${session.id.slice(0, 8).toUpperCase()}`}
        description="Detalle de prendas confeccionadas y consumo por material."
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Producción", href: "/production" },
          { label: `Sesión #${session.id.slice(0, 8).toUpperCase()}` },
        ]}
        actions={
          <Button
            asChild
            variant="outline"
            size="sm"
            className="min-h-10 sm:min-h-9"
          >
            <Link href="/production">
              <ArrowLeftIcon className="size-4" />
              Volver
            </Link>
          </Button>
        }
      />

      <div className="page-content space-y-6">
        <ProductionSessionDetail
          session={{
            id: session.id,
            sessionDate: session.sessionDate.toISOString(),
            employeeName: session.employee.fullName,
            notes: session.notes,
            totalGarments: session.totalGarments,
            totalYardsUsed: decimalToNumber(session.totalYardsUsed),
            createdAt: session.createdAt.toISOString(),
            createdByName: session.createdByProfile?.fullName ?? "Sistema",
            items: session.items.map((item) => ({
              id: item.id,
              inventoryItemName: item.inventoryItem.name,
              garmentType: item.garmentType,
              size: item.size,
              quantity: item.quantity,
              yardsUsed: decimalToNumber(item.yardsUsed),
              notes: item.notes,
            })),
          }}
        />
      </div>
    </div>
  )
}
