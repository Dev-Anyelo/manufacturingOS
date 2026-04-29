import Link from "next/link"
import { ArrowLeftIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { decimalToNumber } from "@/lib/api/utils"
import { PageHeader } from "@/components/shared/page-header"
import { getProductionFormBootstrap } from "@/lib/data/production"
import { ProductionForm } from "@/components/modules/production/production-form"

export default async function NewProductionSessionPage() {
  const bootstrap = await getProductionFormBootstrap()

  const inventoryOptions = bootstrap.inventoryItems.map((item) => ({
    id: item.id,
    name: item.name,
    unit: item.unit,
    quantity: decimalToNumber(item.quantity),
  }))

  return (
    <div className="page-shell">
      <PageHeader
        title="Nueva sesion de produccion"
        description="Registra la producción del día."
        breadcrumbs={[
          { label: "Produccion", href: "/production" },
          { label: "Nueva sesion" },
        ]}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/production">
              <ArrowLeftIcon className="size-4" />
              Volver
            </Link>
          </Button>
        }
      />

      <div className="page-content">
        <ProductionForm
          employees={bootstrap.employees}
          inventoryItems={inventoryOptions}
        />
      </div>
    </div>
  )
}
