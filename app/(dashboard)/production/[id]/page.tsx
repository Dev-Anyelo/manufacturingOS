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
    <div className="space-y-6">
      <PageHeader
        title={`Sesion ${session.id.slice(0, 8)}`}
        description="Detalle de prendas confeccionadas y consumo por material."
        breadcrumbs={[
          { label: "Produccion", href: "/production" },
          { label: `Sesion ${session.id.slice(0, 8)}` },
        ]}
        actions={
          <Button asChild variant="outline">
            <Link href="/production">
              <ArrowLeftIcon className="size-4" />
              Volver
            </Link>
          </Button>
        }
      />

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
  )
}
