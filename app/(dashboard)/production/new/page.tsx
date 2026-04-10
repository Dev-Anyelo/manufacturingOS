import { PageHeader } from "@/components/shared/page-header"
import { ProductionForm } from "@/components/modules/production/production-form"
import { decimalToNumber } from "@/lib/api/utils"
import { getProductionFormBootstrap } from "@/lib/data/production"

export default async function NewProductionSessionPage() {
  const bootstrap = await getProductionFormBootstrap()

  const inventoryOptions = bootstrap.inventoryItems.map((item) => ({
    id: item.id,
    name: item.name,
    unit: item.unit,
    quantity: decimalToNumber(item.quantity),
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nueva sesion de produccion"
        description="Registra prendas confeccionadas y consumo de tela por material."
        breadcrumbs={[
          { label: "Produccion", href: "/production" },
          { label: "Nueva sesion" },
        ]}
      />

      <ProductionForm
        employees={bootstrap.employees}
        inventoryItems={inventoryOptions}
      />
    </div>
  )
}
