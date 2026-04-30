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
        title="Nueva sesión de producción"
        description="Registra la producción del día."
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Producción", href: "/production" },
          { label: "Nueva sesión" },
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
        <ProductionForm
          employees={bootstrap.employees}
          inventoryItems={inventoryOptions}
        />
      </div>
    </div>
  )
}
