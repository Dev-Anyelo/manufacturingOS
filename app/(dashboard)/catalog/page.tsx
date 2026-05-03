import { decimalToNumber } from "@/lib/api/utils"
import { getCatalogItems } from "@/lib/data/catalog"
import { PageHeader } from "@/components/shared/page-header"
import { CatalogWorkspace } from "@/components/modules/catalog/catalog-workspace"

import { requireCurrentUser } from "@/lib/auth/current-user"

export default async function CatalogPage() {
  const [items, currentUser] = await Promise.all([
    getCatalogItems(),
    requireCurrentUser()
  ])

  return (
    <section className="page-shell">
      <div className="page-content space-y-4">
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
            canDelete={currentUser.role === "admin" || currentUser.role === "manager"}
            items={items.map((item) => ({
              id: item.id,
              name: item.name,
              garmentType: item.garmentType,
              ourPriceUnit:
                item.ourPriceUnit === null
                  ? null
                  : decimalToNumber(item.ourPriceUnit),
              ourPriceUnitCurrency: item.ourPriceUnitCurrency,
              ourPriceDozen:
                item.ourPriceDozen === null
                  ? null
                  : decimalToNumber(item.ourPriceDozen),
              ourPriceDozenCurrency: item.ourPriceDozenCurrency,
              marketPriceUnit:
                item.marketPriceUnit === null
                  ? null
                  : decimalToNumber(item.marketPriceUnit),
              marketPriceUnitCurrency: item.marketPriceUnitCurrency,
              estimatedCost:
                item.estimatedCost === null
                  ? null
                  : decimalToNumber(item.estimatedCost),
              estimatedCostCurrency: item.estimatedCostCurrency,
              imageUrl: item.imageUrl,
              notes: item.notes,
              totalStock:
                item.finishedGoods?.reduce((sum, fg) => sum + fg.stock, 0) ?? 0,
            }))}
          />
        </div>
      </div>
    </section>
  )
}
