import Link from "next/link"

import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/shared/page-header"
import { decimalToNumber } from "@/lib/api/utils"
import { getCatalogItems } from "@/lib/data/catalog"
import { CatalogWorkspace } from "@/components/modules/catalog/catalog-workspace"

export default async function CatalogPage() {
  const items = await getCatalogItems()

  return (
    <div className="mx-auto flex w-full max-w-350 flex-col gap-6">
      <PageHeader
        title="Catalogo"
        description="Define prendas, precios y estructura de costos."
        actions={
          <Button asChild className="bg-brand text-brand-foreground">
            <Link href="/catalog/new">Nuevo producto</Link>
          </Button>
        }
      />

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
        }))}
      />
    </div>
  )
}
