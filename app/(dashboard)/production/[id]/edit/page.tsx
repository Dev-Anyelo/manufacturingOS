import { notFound } from "next/navigation"
import { decimalToNumber } from "@/lib/api/utils"
import { PageHeader } from "@/components/shared/page-header"
import { ProductionForm } from "@/components/modules/production/production-form"
import { formatDateOnlyInput } from "@/lib/currency/exchange"

import {
  getProductionSession,
  getProductionFormBootstrap,
} from "@/lib/data/production"

export default async function EditProductionPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string }
}) {
  const { id } = await params
  const [session, bootstrap] = await Promise.all([
    getProductionSession(id),
    getProductionFormBootstrap(),
  ])

  if (!session) notFound()

  const employees = bootstrap.employees.map((emp) => ({
    id: emp.id,
    fullName: emp.fullName,
    profileId: emp.profileId,
  }))

  const inventoryItems = bootstrap.inventoryItems.map((item) => ({
    id: item.id,
    name: item.name,
    unit: item.unit,
    quantity: decimalToNumber(item.quantity),
  }))

  return (
    <div className="page-shell">
      <PageHeader
        title={`Editar sesión #${session.id.slice(0, 8).toUpperCase()}`}
        description="Actualiza los detalles de la sesión de producción."
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Producción", href: "/production" },
          { label: "Detalles", href: `/production/${session.id}` },
          { label: "Editar" },
        ]}
      />
      <div className="page-content">
        <ProductionForm
          employees={employees}
          inventoryItems={inventoryItems}
          sessionId={session.id}
          defaultValues={{
            employee_id: session.employeeId,
            session_date: formatDateOnlyInput(session.sessionDate),
            notes: session.notes,
            items: session.items.map((item) => ({
              inventory_item_id: item.inventoryItemId,
              garment_type: item.garmentType,
              size: item.size as any,
              color: item.color,
              quantity: item.quantity,
              yards_used: decimalToNumber(item.yardsUsed),
              is_reuse: false,
              notes: item.notes,
            })),
          }}
        />
      </div>
    </div>
  )
}
