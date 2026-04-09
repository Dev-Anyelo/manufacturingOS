import { ReceiptTextIcon } from "lucide-react"

import { EmptyState } from "@/components/shared/empty-state"
import { PageHeader } from "@/components/shared/page-header"

export default function OrdersPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Pedidos"
        description="Gestiona pedidos a medida con estado de produccion y entrega."
      />

      <EmptyState
        icon={<ReceiptTextIcon />}
        title="Sin pedidos activos"
        description="Crea tu primer pedido para iniciar el flujo de trabajo del taller."
      />
    </div>
  )
}
