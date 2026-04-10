import Link from "next/link"
import { UserRole } from "@/types"
import { Button } from "@/components/ui/button"
import { StatCard } from "@/components/shared/stat-card"
import { getInventoryItems } from "@/lib/data/inventory"
import { PageHeader } from "@/components/shared/page-header"
import { requireCurrentUser } from "@/lib/auth/current-user"
import { AlertTriangleIcon, BoxesIcon, PackageIcon } from "lucide-react"
import { InventoryTable } from "@/components/modules/inventory/inventory-table"

function getStockStatus(quantity: number, minimumStock: number) {
  if (quantity <= 0) {
    return "out"
  }

  if (quantity <= minimumStock) {
    return "critical"
  }

  if (quantity <= minimumStock * 2) {
    return "low"
  }

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
    supplier: item.supplier,
    imageUrl: item.imageUrl,
  }))

  const summary = tableItems.reduce(
    (acc, item) => {
      const status = getStockStatus(item.quantity, item.minimumStock)

      if (status === "low") {
        acc.low += 1
      }

      if (status === "critical") {
        acc.critical += 1
      }

      if (status === "out") {
        acc.out += 1
      }

      return acc
    },
    {
      low: 0,
      critical: 0,
      out: 0,
    }
  )

  const canDeactivate = user.role === UserRole.Admin

  return (
    <section className="mx-auto flex w-full max-w-350 flex-col gap-6">
      <PageHeader
        title="Inventario"
        description="Control de telas, insumos, herramientas y maquinaria."
        actions={
          <Button asChild className="bg-brand text-brand-foreground">
            <Link href="/inventory/new">Nuevo material</Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Materiales activos"
          value={tableItems.length}
          description="Registros disponibles para operaciones"
          icon={<BoxesIcon className="size-4" />}
        />
        <StatCard
          title="Stock bajo"
          value={summary.low}
          description="Materiales por encima del minimo pero en vigilancia"
          icon={<AlertTriangleIcon className="size-4" />}
          variant={summary.low > 0 ? "warning" : "default"}
        />
        <StatCard
          title="Stock critico"
          value={summary.critical}
          description="Materiales en limite minimo"
          icon={<AlertTriangleIcon className="size-4" />}
          variant={summary.critical > 0 ? "danger" : "default"}
        />
        <StatCard
          title="Agotados"
          value={summary.out}
          description="Materiales sin existencia"
          icon={<PackageIcon className="size-4" />}
          variant={summary.out > 0 ? "danger" : "default"}
        />
      </div>

      <InventoryTable items={tableItems} canDeactivate={canDeactivate} />
    </section>
  )
}
