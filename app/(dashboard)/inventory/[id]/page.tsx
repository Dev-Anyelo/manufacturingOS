import Image from "next/image"
import { notFound } from "next/navigation"
import { getInventoryItem } from "@/lib/data/inventory"
import { StatCard } from "@/components/shared/stat-card"
import { PageHeader } from "@/components/shared/page-header"
import { StockIndicator } from "@/components/modules/inventory/stock-indicator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MovementHistory } from "@/components/modules/inventory/movement-history"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/shared/status-badge"
import { CurrencyDisplay } from "@/components/shared/currency-display"
import { InventoryDetailActions } from "@/components/modules/inventory/inventory-detail-actions"

import {
  Building2Icon,
  ClipboardListIcon,
  DollarSignIcon,
  LayersIcon,
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

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4 lg:gap-6">
          <StatCard
            title="Cantidad disponible"
            value={`${quantity} ${item.unit}`}
            description="Cantidad actual en stock."
            icon={<LayersIcon className="size-4" />}
          />
          <StatCard
            title="Mínimo requerido"
            value={`${minimumStock} ${item.unit}`}
            description="Cantidad mínima para reordenar."
            icon={<Building2Icon className="size-4" />}
          />
          <StatCard
            title="Precio unitario"
            value={<CurrencyDisplay amount={unitPrice} size="lg" />}
            description="Costo por unidad."
            icon={<ClipboardListIcon className="size-4" />}
          />
          <StatCard
            title="Valor estimado"
            value={<CurrencyDisplay amount={estimatedValue} size="lg" />}
            description="Valor total del inventario."
            icon={<DollarSignIcon className="size-4" />}
          />
        </div>

        <Tabs defaultValue="info" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 sm:w-auto">
            <TabsTrigger value="info">Info</TabsTrigger>
            <TabsTrigger value="movements">Movimientos</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4">
            <Card className="border border-border">
              <CardHeader className="border-b border-border">
                <CardTitle>Información general</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[220px_1fr]">
                  <div className="overflow-hidden rounded-xl border border-border/50 bg-muted/20">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        width={220}
                        height={224}
                        className="h-56 w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-56 items-center justify-center">
                        <LayersIcon className="size-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="surface-1 rounded-lg border border-border p-3">
                        <p className="text-xs text-muted-foreground">
                          Categoría
                        </p>
                        <p className="text-sm font-medium">
                          {getCategoryLabel(item.category)}
                        </p>
                      </div>
                      <div className="surface-1 rounded-lg border border-border p-3">
                        <p className="text-xs text-muted-foreground">
                          Precio unitario
                        </p>
                        <p className="text-sm font-medium tabular-nums">
                          <CurrencyDisplay amount={item.unitPrice} />
                        </p>
                      </div>
                      <div className="surface-1 rounded-lg border border-border p-3">
                        <p className="text-xs text-muted-foreground">Color</p>
                        <p className="text-sm font-medium">
                          {item.color ?? "-"}
                        </p>
                      </div>
                      <div className="surface-1 rounded-lg border border-border p-3">
                        <p className="text-xs text-muted-foreground">
                          Tipo de tela
                        </p>
                        <p className="text-sm font-medium">
                          {item.fabricType ?? "-"}
                        </p>
                      </div>
                    </div>

                    <StockIndicator
                      quantity={quantity}
                      minimumStock={minimumStock}
                      unit={item.unit}
                    />

                    <div className="surface-1 rounded-lg border border-border p-3">
                      <p className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <Building2Icon className="size-3.5" />
                        Proveedor
                      </p>
                      <p className="text-sm font-medium">
                        {item.supplier ?? "-"}
                      </p>
                    </div>

                    <div className="surface-1 rounded-lg border border-border p-3">
                      <p className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <ClipboardListIcon className="size-3.5" />
                        Notas
                      </p>
                      <p className="text-sm">
                        {item.notes ?? "Sin notas registradas."}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="movements">
            <Card className="border border-border">
              <CardHeader className="border-b border-border">
                <CardTitle>Historial de movimientos</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
