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
          actions={
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="hidden min-h-10 px-4 sm:flex sm:min-h-9"
              >
                <Link href="#">Exportar</Link>
              </Button>
              <Button
                asChild
                size="default"
                className="min-h-11 w-full gap-2 shadow-sm sm:w-auto sm:min-h-10"
              >
                <Link href="/catalog/new">
                  <PlusIcon className="size-4 shrink-0" />
                  Nuevo producto
                </Link>
              </Button>
            </div>
          }
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
            }))}
          />
        </div>
      </div>
    </section>
  )
}
