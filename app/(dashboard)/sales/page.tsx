import { EmptyState } from "@/components/shared/empty-state"
import { PageHeader } from "@/components/shared/page-header"
import { ShoppingCartIcon } from "lucide-react"

export default function SalesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Ventas"
        description="Punto de venta y seguimiento de cobros."
      />

      <EmptyState
        icon={<ShoppingCartIcon />}
        title="Sin ventas registradas"
        description="Cuando registres una venta en POS, se mostrara en este modulo."
      />
    </div>
  )
}
