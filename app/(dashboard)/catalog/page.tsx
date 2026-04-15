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
    <section className="flex flex-col min-h-full gap-4">
      <div className="mx-auto w-full space-y-4">
        <PageHeader
          title="Catalogo"
          description="Define prendas, precios y estructura de costos."
          breadcrumbs={[
            { label: "Dashboard", href: "/" },
            { label: "Catalogo" },
          ]}
          actions={
            <div className="flex items-center gap-2">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="h-9 px-4 font-medium hidden sm:flex"
              >
                <Link href="/catalog">Exportar</Link>
              </Button>
              <Button
                asChild
                size="sm"
                className="bg-brand text-brand-foreground hover:bg-brand/90 h-9 px-4 font-medium"
              >
                <Link href="/catalog/new">
                  <PlusIcon className="size-4" />
                  Nuevo producto
                </Link>
              </Button>
            </div>
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
    </section>
  )
}
