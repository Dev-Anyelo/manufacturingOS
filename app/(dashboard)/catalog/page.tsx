import Link from "next/link"
import { PlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { decimalToNumber } from "@/lib/api/utils"
import { getCatalogItems } from "@/lib/data/catalog"
import { PageHeader } from "@/components/shared/page-header"
import { CatalogWorkspace } from "@/components/modules/catalog/catalog-workspace"

export default async function CatalogPage() {
  const items = await getCatalogItems()

  return (
    <section className="page-shell">
      <div className="page-content space-y-6">
        <PageHeader
          title="Catálogo"
          description="Define prendas, precios base y estructura de costos para ventas y producción."
          breadcrumbs={[
            { label: "Dashboard", href: "/" },
            { label: "Catálogo" },
          ]}
        />

        <div>
          <CatalogWorkspace
            items={items.map((item) => ({
              id: item.id,
              name: item.name,
              garmentType: item.garmentType,
              ourPriceUnit:
                item.ourPriceUnit === null
                  ? null
                  : decimalToNumber(item.ourPriceUnit),
              ourPriceDozen:
                item.ourPriceDozen === null
                  ? null
                  : decimalToNumber(item.ourPriceDozen),
              marketPriceUnit:
                item.marketPriceUnit === null
                  ? null
                  : decimalToNumber(item.marketPriceUnit),
              estimatedCost:
                item.estimatedCost === null
                  ? null
                  : decimalToNumber(item.estimatedCost),
              imageUrl: item.imageUrl,
              notes: item.notes,
              totalStock: item.finishedGoods?.reduce((sum, fg) => sum + fg.stock, 0) ?? 0,
            }))}
          />
        </div>
      </div>
    </section>
  )
}
