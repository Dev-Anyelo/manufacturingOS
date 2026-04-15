import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { getInventoryItem } from "@/lib/data/inventory"
import { PageHeader } from "@/components/shared/page-header"
import { CurrencyDisplay } from "@/components/shared/currency-display"
import { StockIndicator } from "@/components/modules/inventory/stock-indicator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MovementHistory } from "@/components/modules/inventory/movement-history"

import {
  ArrowLeftIcon,
  Building2Icon,
  ClipboardListIcon,
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

  return (
    <div className="space-y-6">
      <PageHeader
        title={item.name}
        description="Detalle del material y su historial de movimientos."
        breadcrumbs={[
          { label: "Inventario", href: "/inventory" },
          { label: item.name },
        ]}
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/inventory">
                <ArrowLeftIcon className="size-4" />
                Volver
              </Link>
            </Button>
            <Button asChild className="bg-brand text-brand-foreground">
              <Link href={`/inventory/${item.id}/edit`}>Editar material</Link>
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border border-border/50 shadow-sm">
          <CardContent className="space-y-1 p-4">
            <p className="text-xs tracking-wide text-muted-foreground uppercase">
              Stock actual
            </p>
            <p className="text-lg font-semibold">
              {quantity.toFixed(2)} {item.unit}
            </p>
          </CardContent>
        </Card>
        <Card className="border border-border/50 shadow-sm">
          <CardContent className="space-y-1 p-4">
            <p className="text-xs tracking-wide text-muted-foreground uppercase">
              Minimo requerido
            </p>
            <p className="text-lg font-semibold">
              {minimumStock.toFixed(2)} {item.unit}
            </p>
          </CardContent>
        </Card>
        <Card className="border border-border/50 shadow-sm">
          <CardContent className="space-y-1 p-4">
            <p className="text-xs tracking-wide text-muted-foreground uppercase">
              Costo unitario
            </p>
            <CurrencyDisplay amount={unitPrice} className="font-semibold" />
          </CardContent>
        </Card>
        <Card className="border border-border/50 shadow-sm">
          <CardContent className="space-y-1 p-4">
            <p className="text-xs tracking-wide text-muted-foreground uppercase">
              Valor estimado
            </p>
            <CurrencyDisplay
              amount={estimatedValue}
              className="font-semibold"
            />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="info" className="space-y-4">
        <TabsList>
          <TabsTrigger value="info">Info</TabsTrigger>
          <TabsTrigger value="movements">Movimientos</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-4">
          <Card className="border border-border/50 shadow-sm">
            <CardHeader className="border-b border-border/50">
              <CardTitle>Informacion general</CardTitle>
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
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="rounded-lg border border-border/50 bg-card p-3">
                      <p className="text-xs text-muted-foreground">Categoria</p>
                      <p className="text-sm font-medium">
                        {getCategoryLabel(item.category)}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border/50 bg-card p-3">
                      <p className="text-xs text-muted-foreground">
                        Precio unitario
                      </p>
                      <p className="text-sm font-medium">
                        ${Number(item.unitPrice).toFixed(2)}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border/50 bg-card p-3">
                      <p className="text-xs text-muted-foreground">Color</p>
                      <p className="text-sm font-medium">{item.color ?? "-"}</p>
                    </div>
                    <div className="rounded-lg border border-border/50 bg-card p-3">
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

                  <div className="rounded-lg border border-border/50 bg-card p-3">
                    <p className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <Building2Icon className="size-3.5" />
                      Proveedor
                    </p>
                    <p className="text-sm font-medium">
                      {item.supplier ?? "-"}
                    </p>
                  </div>

                  <div className="rounded-lg border border-border/50 bg-card p-3">
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
          <Card className="border border-border/50 shadow-sm">
            <CardHeader className="border-b border-border/50">
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
  )
}
