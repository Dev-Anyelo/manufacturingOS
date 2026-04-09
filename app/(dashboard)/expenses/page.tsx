import { WalletIcon } from "lucide-react"

import { EmptyState } from "@/components/shared/empty-state"
import { PageHeader } from "@/components/shared/page-header"

export default function ExpensesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Gastos"
        description="Controla egresos operativos y compras de insumos."
      />

      <EmptyState
        icon={<WalletIcon />}
        title="Sin gastos registrados"
        description="Los movimientos de egresos apareceran aqui para analisis financiero."
      />
    </div>
  )
}
