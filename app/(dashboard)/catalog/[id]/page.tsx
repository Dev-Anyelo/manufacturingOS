import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { ArrowLeftIcon, LayersIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CurrencyDisplay } from "@/components/shared/currency-display"
import { PageHeader } from "@/components/shared/page-header"
import { decimalToNumber } from "@/lib/api/utils"
import { getCatalogItem } from "@/lib/data/catalog"
import { ProfitMarginIndicator } from "@/components/modules/catalog/profit-margin-indicator"
import { CatalogForm } from "@/components/modules/catalog/catalog-form"

type CatalogDetailPageProps = {
  params: Promise<{ id: string }> | { id: string }
}

export default async function CatalogDetailPage({
  params,
}: CatalogDetailPageProps) {
  const { id } = await params
  const item = await getCatalogItem(id)

  if (!item || !item.isActive) {
    notFound()
  }

  return (
    <div className="page-shell">
      <PageHeader
        title={item.name}
        description="Detalle del producto y configuracion de precios."
        breadcrumbs={[
          { label: "Catalogo", href: "/catalog" },
          { label: item.name },
        ]}
        actions={
          <Button asChild variant="outline">
            <Link href="/catalog">
              <ArrowLeftIcon className="size-4" />
              Volver
            </Link>
          </Button>
        }
      />

      <div className="page-content">
        <Card className="border border-border shadow-sm">
          <CardHeader className="border-b border-border">
            <CardTitle>Resumen del producto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr]">
              <div className="overflow-hidden rounded-xl border border-border bg-muted/30">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    width={240}
                    height={240}
                    className="h-60 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-60 items-center justify-center">
                    <LayersIcon className="size-8 text-muted-foreground" />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/40">
                  <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                    Tipo de Prenda
                  </p>
                  <p className="mt-1 flex items-baseline gap-1 text-sm font-medium">
                    {item.garmentType ?? "Sin tipo"}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/40">
                  <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                    Costo Estimado
                  </p>
                  <div className="mt-1 flex items-baseline gap-1">
                    <CurrencyDisplay
                      amount={
                        item.estimatedCost
                          ? decimalToNumber(item.estimatedCost)
                          : 0
                      }
                      size="lg"
                    />
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/40">
                  <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                    Precio Mercado
                  </p>
                  <div className="mt-1 flex items-baseline gap-1">
                    <CurrencyDisplay
                      amount={
                        item.marketPriceUnit
                          ? decimalToNumber(item.marketPriceUnit)
                          : 0
                      }
                      size="lg"
                    />
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/40">
                  <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                    Precio Propio
                  </p>
                  <div className="mt-1 flex items-baseline gap-1">
                    <CurrencyDisplay
                      amount={
                        item.ourPriceUnit
                          ? decimalToNumber(item.ourPriceUnit)
                          : 0
                      }
                      size="lg"
                    />
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/40 sm:col-span-2">
                  <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                    Margen Estimado
                  </p>
                  <div className="pt-1">
                    <ProfitMarginIndicator
                      ourPriceUnit={
                        item.ourPriceUnit
                          ? decimalToNumber(item.ourPriceUnit)
                          : null
                      }
                      estimatedCost={
                        item.estimatedCost
                          ? decimalToNumber(item.estimatedCost)
                          : null
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-muted/20 p-4">
              <p className="text-xs text-muted-foreground">Descripcion</p>
              <p className="mt-1 text-sm text-foreground">
                {item.description ?? "Sin descripcion."}
              </p>
            </div>

            <div className="rounded-lg border border-border bg-muted/20 p-4">
              <p className="text-xs text-muted-foreground">Notas internas</p>
              <p className="mt-1 text-sm text-foreground">
                {item.notes ?? "Sin notas."}
              </p>
            </div>
          </CardContent>
        </Card>

        <CatalogForm
          mode="edit"
          itemId={item.id}
          defaultValues={{
            name: item.name,
            description: item.description,
            garment_type: item.garmentType ?? "",
            market_price_unit: item.marketPriceUnit
              ? decimalToNumber(item.marketPriceUnit)
              : 0,
            market_price_dozen: item.marketPriceDozen
              ? decimalToNumber(item.marketPriceDozen)
              : null,
            our_price_unit: item.ourPriceUnit
              ? decimalToNumber(item.ourPriceUnit)
              : 0,
            our_price_dozen: item.ourPriceDozen
              ? decimalToNumber(item.ourPriceDozen)
              : null,
            estimated_cost: item.estimatedCost
              ? decimalToNumber(item.estimatedCost)
              : null,
            notes: item.notes,
            image_url: item.imageUrl,
          }}
        />
      </div>
    </div>
  )
}
