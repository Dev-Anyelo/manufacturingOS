import { FactoryIcon } from "lucide-react"

import { EmptyState } from "@/components/shared/empty-state"
import { PageHeader } from "@/components/shared/page-header"

export default function ProductionPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Produccion"
        description="Registra sesiones de confeccion y consumo de materiales."
      />

      <EmptyState
        icon={<FactoryIcon />}
        title="Sin sesiones registradas"
        description="Las sesiones de produccion apareceran aqui cuando el equipo empiece a registrar trabajo."
      />
    </div>
  )
}
