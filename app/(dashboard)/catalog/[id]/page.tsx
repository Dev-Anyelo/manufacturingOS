import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { decimalToNumber } from "@/lib/api/utils"
import { getCatalogItem } from "@/lib/data/catalog"
import { cn, getGarmetTypeLabel } from "@/lib/utils"
import { getStorageUrl } from "@/lib/storage/upload"
import { Currency, GarmentType } from "@prisma/client"
import { EmptyState } from "@/components/shared/empty-state"
import { PageHeader } from "@/components/shared/page-header"
import { ArrowLeftIcon, BoxesIcon, ImageOff } from "lucide-react"
import { CurrencyDisplay } from "@/components/shared/currency-display"
import { ProfitMarginIndicator } from "@/components/modules/catalog/profit-margin-indicator"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

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
        description="Detalle del producto y configuración de precios."
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Catálogo", href: "/catalog" },
          { label: item.name },
        ]}
        actions={
          <Button
            asChild
            variant="outline"
            size="sm"
            className="min-h-10 sm:min-h-9"
          >
            <Link href="/catalog">
              <ArrowLeftIcon className="size-4" />
              Volver
            </Link>
          </Button>
        }
      />

      <div className="page-content space-y-6">
        <Card className="border border-border shadow-sm">
          <CardHeader className="border-b border-border">
            <CardTitle>Resumen del producto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr]">
              <div className="overflow-hidden rounded-xl border border-border bg-muted/30">
                {item.imageUrl ? (
                  <Image
                    src={getStorageUrl("catalog", item.imageUrl) || ""}
                    alt={item.name}
                    width={240}
                    height={240}
                    className="h-full w-full object-cover object-center"
                  />
                ) : (
                  <div className="flex h-60 items-center justify-center">
                    <ImageOff className="size-8 text-muted-foreground" />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/40">
                  <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                    Tipo de Prenda
                  </p>
                  <p className="mt-1 flex items-baseline gap-1 text-sm font-medium">
                    {getGarmetTypeLabel(item.garmentType as GarmentType)}
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
                      currency={item.estimatedCostCurrency as Currency}
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
                      currency={item.marketPriceUnitCurrency as Currency}
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
                      currency={item.ourPriceUnitCurrency as Currency}
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

        {/* Finished Goods Stock Breakdown */}
        <Card className="border border-border shadow-sm">
          <CardHeader className="border-b border-border">
            <div className="flex items-center gap-2">
              <BoxesIcon className="size-4 text-muted-foreground" />
              <CardTitle>Inventario de producto terminado</CardTitle>
            </div>
            <CardDescription>
              Stock disponible por talla. Se actualiza automáticamente con
              producción y ventas.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {item.finishedGoods.length === 0 ? (
              <EmptyState
                icon={<BoxesIcon />}
                title="Sin stock registrado"
                description="El stock se generará automáticamente al registrar sesiones de producción."
                compact
              />
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {item.finishedGoods.map((fg) => {
                  const isLow = fg.stock > 0 && fg.stock <= fg.minimumStock
                  const isOut = fg.stock <= 0
                  return (
                    <div
                      key={fg.id}
                      className={cn(
                        "rounded-xl border p-4 text-center transition-colors",
                        isOut
                          ? "border-red-500/30 bg-red-500/5"
                          : isLow
                            ? "border-amber-500/30 bg-amber-500/5"
                            : "border-border bg-card hover:bg-muted/40"
                      )}
                    >
                      <Badge
                        variant="outline"
                        className="mb-2 font-mono text-xs uppercase"
                      >
                        {fg.size}
                      </Badge>
                      <p
                        className={cn(
                          "text-2xl font-bold tabular-nums",
                          isOut
                            ? "text-red-600 dark:text-red-400"
                            : isLow
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-foreground"
                        )}
                      >
                        {fg.stock}
                      </p>
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        mín: {fg.minimumStock}
                      </p>
                      {fg.color ? (
                        <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                          {fg.color}
                        </p>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
