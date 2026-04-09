import { redirect } from "next/navigation"
import { Settings2Icon } from "lucide-react"

import { EmptyState } from "@/components/shared/empty-state"
import { PageHeader } from "@/components/shared/page-header"
import { requireCurrentUser } from "@/lib/auth/current-user"
import { UserRole } from "@/types"

export default async function SettingsPage() {
  const user = await requireCurrentUser()

  if (user.role !== UserRole.Admin) {
    redirect("/")
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuracion"
        description="Gestiona parametros globales del sistema y del taller."
      />

      <EmptyState
        icon={<Settings2Icon />}
        title="Sin configuraciones aplicadas"
        description="Configura umbrales de stock, moneda y datos de la empresa."
      />
    </div>
  )
}
