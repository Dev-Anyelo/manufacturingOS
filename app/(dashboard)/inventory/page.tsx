import { UserRole } from "@/types"
import { Currency } from "@prisma/client"
import { BoxesIcon, AlertTriangleIcon, PackageXIcon, PackageIcon } from "lucide-react"
import { getInventoryItems } from "@/lib/data/inventory"
import { PageHeader } from "@/components/shared/page-header"
import { requireCurrentUser } from "@/lib/auth/current-user"
import { KpiSection } from "@/components/shared/kpi-section"
import { CompactKpiCard } from "@/components/shared/compact-kpi-card"
import { InventoryTable } from "@/components/modules/inventory/inventory-table"
import { InventorySheet } from "@/components/modules/inventory/inventory-sheet"

function getStockStatus(quantity: number, minimumStock: number) {
  if (quantity <= 0) return "out"
  if (quantity <= minimumStock) return "critical"
  if (quantity <= minimumStock * 2) return "low"
  return "normal"
}

export default async function InventoryPage() {
  const [items, user] = await Promise.all([
    getInventoryItems(),
    requireCurrentUser(),
  ])

  const tableItems = items.map((item) => ({
    id: item.id,
    name: item.name,
    category: item.category,
    quantity: Number(item.quantity),
    minimumStock: Number(item.minimumStock),
    unit: item.unit,
    unitPrice: Number(item.unitPrice),
    unitPriceCurrency: item.unitPriceCurrency as Currency,
    supplier: item.supplier,
    imageUrl: item.imageUrl,
  }))

  const summary = tableItems.reduce(
    (acc, item) => {
      const status = getStockStatus(item.quantity, item.minimumStock)
      if (status === "low") acc.low += 1
      if (status === "critical") acc.critical += 1
      if (status === "out") acc.out += 1
      return acc
    },
    { low: 0, critical: 0, out: 0 }
  )

  const canDeactivate = user.role === UserRole.Admin

  return (
    <section className="page-shell">
      <div className="page-content space-y-6">
        <PageHeader
          title="Inventario"
          description="Control de telas, insumos, herramientas y maquinaria."
          breadcrumbs={[
            { label: "Dashboard", href: "/" },
            { label: "Inventario" },
          ]}
          actions={
            <div className="flex flex-row flex-wrap gap-3">
              <InventorySheet />
            </div>
          }
        />

        <KpiSection label="Resumen de inventario">
          <CompactKpiCard
            label="Materiales activos"
            value={tableItems.length}
            icon={<BoxesIcon />}
            iconClass="bg-muted text-muted-foreground"
          />
          <CompactKpiCard
            label="Stock bajo"
            value={summary.low}
            icon={<AlertTriangleIcon />}
            iconClass={
              summary.low > 0
                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                : "bg-muted text-muted-foreground"
            }
          />
          <CompactKpiCard
            label="Stock crítico"
            value={summary.critical}
            icon={<AlertTriangleIcon />}
            iconClass={
              summary.critical > 0
                ? "bg-red-500/15 text-red-600 dark:text-red-400"
                : "bg-muted text-muted-foreground"
            }
          />
          <CompactKpiCard
            label="Agotados"
            value={summary.out}
            icon={<PackageXIcon />}
            iconClass={
              summary.out > 0
                ? "bg-red-500/15 text-red-600 dark:text-red-400"
                : "bg-muted text-muted-foreground"
            }
          />
        </KpiSection>

        <InventoryTable items={tableItems} canDeactivate={canDeactivate} />
      </div>
    </section>
  )
}
