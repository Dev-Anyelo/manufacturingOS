import { PackageIcon } from "lucide-react"

import { EmptyState } from "@/components/shared/empty-state"
import { PageHeader } from "@/components/shared/page-header"

export default function InventoryPage() {
  return (
    <section className="space-y-6">
      <PageHeader
        title="Inventario"
        description="Control de telas, insumos, herramientas y maquinaria."
      />

      <EmptyState
        icon={<PackageIcon />}
        title="Sin movimientos de inventario"
        description="Configura tus primeros materiales para empezar a registrar entradas y salidas."
      />
    </section>
  )
}
