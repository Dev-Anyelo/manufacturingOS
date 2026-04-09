import { BookOpenTextIcon } from "lucide-react"

import { EmptyState } from "@/components/shared/empty-state"
import { PageHeader } from "@/components/shared/page-header"

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Reportes"
        description="Analiza indicadores diarios, mensuales y rendimiento operativo."
      />

      <EmptyState
        icon={<BookOpenTextIcon />}
        title="Sin reportes generados"
        description="Los reportes estaran disponibles en cuanto exista actividad operativa."
      />
    </div>
  )
}
