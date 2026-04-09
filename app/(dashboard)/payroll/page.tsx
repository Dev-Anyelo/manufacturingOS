import { UsersRoundIcon } from "lucide-react"

import { EmptyState } from "@/components/shared/empty-state"
import { PageHeader } from "@/components/shared/page-header"

export default function PayrollPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Planilla"
        description="Administra empleados, contratos y pagos."
      />

      <EmptyState
        icon={<UsersRoundIcon />}
        title="Sin pagos de planilla"
        description="Los comprobantes y pagos del equipo se listaran en este modulo."
      />
    </div>
  )
}
