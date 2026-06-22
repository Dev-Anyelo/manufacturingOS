import Image from "next/image"
import { notFound } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { getStorageUrl } from "@/lib/storage/upload"
import { getInventoryItem } from "@/lib/data/inventory"
import { PageHeader } from "@/components/shared/page-header"
import { StatusBadge } from "@/components/shared/status-badge"
import { CurrencyDisplay } from "@/components/shared/currency-display"
import { StockIndicator } from "@/components/modules/inventory/stock-indicator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MovementHistory } from "@/components/modules/inventory/movement-history"
import { InventoryDetailActions } from "@/components/modules/inventory/inventory-detail-actions"

import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible"

import {
  Building2Icon,
  LayersIcon,
  ChevronDown,
  MessageCircleIcon,
  ImageOff,
} from "lucide-react"

type InventoryDetailPageProps = {
  params: Promise<{ id: string }> | { id: string }
}

function getCategoryLabel(category: string) {
  const map: Record<string, string> = {
    fabric: "Telas",
    supplies: "Insumos",
    tools: "Herramientas",
    machinery: "Maquinaria",
  }

  return map[category] ?? category
}

function getCategoryBadgeClass(category: string) {
  const map: Record<string, string> = {
    fabric: "status-info",
    supplies: "status-success",
    tools: "status-warning",
    machinery: "status-subtle",
  }

  return map[category] ?? "status-subtle"
}

function getStockBadgeStatus(quantity: number, minimumStock: number) {
  if (quantity <= 0) return "out"
  if (quantity <= minimumStock) return "critical"
  if (quantity <= minimumStock * 2) return "low"
  return "normal"
}

export default async function InventoryDetailPage({
  params,
}: InventoryDetailPageProps) {
  const { id } = await params
  const item = await getInventoryItem(id)

  if (!item || !item.isActive) {
    notFound()
  }

  const quantity = Number(item.quantity)
  const minimumStock = Number(item.minimumStock)
  const unitPrice = Number(item.unitPrice)
  const estimatedValue = quantity * unitPrice
  const stockStatus = getStockBadgeStatus(quantity, minimumStock)

  return (
    <div className="page-shell">
      <PageHeader
        title={item.name}
        description="Detalle del material y su historial de movimientos."
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Inventario", href: "/inventory" },
          { label: item.name },
        ]}
        actions={
          <InventoryDetailActions
            item={{
              id: item.id,
              name: item.name,
              quantity,
              unit: item.unit,
            }}
          />
        }
      />

      <div className="page-content space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className={getCategoryBadgeClass(item.category)}
          >
            {getCategoryLabel(item.category)}
          </Badge>
          <StatusBadge status={stockStatus} type="stock" />
        </div>

        <Collapsible
          defaultOpen
          className="overflow-hidden rounded-xl border bg-card"
        >
          <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-3 hover:bg-muted/20 [&[data-state=open]>svg]:rotate-180">
            <div className="flex items-center gap-2">
              <LayersIcon className="size-4 text-primary" />
              <span className="text-sm font-semibold">Resumen de métricas</span>
            </div>
            <ChevronDown className="size-4 text-muted-foreground transition-transform duration-200" />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="grid grid-cols-2 divide-x divide-y border-t md:grid-cols-4 md:divide-y-0">
              <div className="flex flex-col justify-center p-4">
                <span className="mb-1 text-[10px] font-medium text-muted-foreground uppercase">
                  Cantidad disponible
                </span>
                <span className="text-lg leading-none font-bold tabular-nums">{`${quantity} ${item.unit}`}</span>
              </div>
              <div className="flex flex-col justify-center p-4">
                <span className="mb-1 text-[10px] font-medium text-muted-foreground uppercase">
                  Mínimo requerido
                </span>
                <span className="text-lg leading-none font-bold tabular-nums">{`${minimumStock} ${item.unit}`}</span>
              </div>
              <div className="flex flex-col justify-center p-4">
                <span className="mb-1 text-[10px] font-medium text-muted-foreground uppercase">
                  Precio unitario
                </span>
                <div className="text-lg leading-none font-bold tabular-nums">
                  <CurrencyDisplay amount={unitPrice} currency={item.unitPriceCurrency} />
                </div>
              </div>
              <div className="flex flex-col justify-center bg-muted/10 p-4">
                <span className="mb-1 text-[10px] font-medium text-muted-foreground uppercase">
                  Valor estimado
                </span>
                <div className="text-lg leading-none font-bold text-brand tabular-nums">
                  <CurrencyDisplay amount={estimatedValue} currency={item.unitPriceCurrency} />
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card className="border border-border">
              <CardHeader className="border-b border-border">
                <CardTitle>Historial de movimientos</CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <MovementHistory
                  unit={item.unit}
                  movements={item.inventoryMovements.map((movement) => ({
                    id: movement.id,
                    movementType: movement.movementType,
                    quantity: Number(movement.quantity),
                    previousQuantity: Number(movement.previousQuantity),
                    newQuantity: Number(movement.newQuantity),
                    reason: movement.reason,
                    createdAt: movement.createdAt,
                    createdByName: movement.createdByProfile?.fullName,
                  }))}
                />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border pt-0 shadow-sm">
              <CardHeader className="border-b bg-muted/20 px-4 py-3">
                <CardTitle className="text-sm font-semibold">
                  Información General
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <dl className="divide-y text-sm">
                  <div className="flex justify-between px-4 py-2.5">
                    <dt className="text-muted-foreground">Categoría</dt>
                    <dd className="font-medium">
                      {getCategoryLabel(item.category)}
                    </dd>
                  </div>
                  <div className="flex justify-between px-4 py-2.5">
                    <dt className="text-muted-foreground">Precio unitario</dt>
                    <dd className="font-medium tabular-nums">
                      <CurrencyDisplay 
                        amount={unitPrice} 
                        currency={item.unitPriceCurrency}
                      />
                    </dd>
                  </div>
                  <div className="flex justify-between px-4 py-2.5">
                    <dt className="text-muted-foreground">Color</dt>
                    <dd className="font-medium">{item.color ?? "-"}</dd>
                  </div>
                  <div className="flex justify-between px-4 py-2.5">
                    <dt className="text-muted-foreground">Tipo de tela</dt>
                    <dd className="font-medium">{item.fabricType ?? "-"}</dd>
                  </div>
                  <div className="flex justify-between px-4 py-2.5">
                    <dt className="flex items-center gap-1 text-muted-foreground">
                      <Building2Icon className="size-3.5" /> Proveedor
                    </dt>
                    <dd className="font-medium">{item.supplier ?? "-"}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            <StockIndicator
              quantity={quantity}
              minimumStock={minimumStock}
              unit={item.unit}
            />

            <div className="overflow-hidden rounded-xl border border-border/50 bg-muted/20">
              {item.imageUrl ? (
                <Image
                  src={getStorageUrl("inventory", item.imageUrl) || ""}
                  alt={item.name}
                  width={220}
                  height={224}
                  className="h-56 w-full object-cover"
                />
              ) : (
                <div className="flex h-56 items-center justify-center bg-muted/20">
                  <ImageOff className="size-5 text-muted-foreground" />
                  <p className="ml-2 text-sm text-muted-foreground">Sin imagen</p>
                </div>
              )}
            </div>

            {item.notes && (
              <Card className="border pt-0 shadow-sm">
                <CardHeader className="border-b bg-muted/20 py-3 px-4">
                  <CardTitle className="flex items-center gap-1 text-sm font-semibold">
                    <MessageCircleIcon className="size-4" />
                    Notas
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 text-sm">{item.notes}</CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
