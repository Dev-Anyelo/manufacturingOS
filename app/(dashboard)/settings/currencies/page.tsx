import { requireCurrentUser } from "@/lib/auth/current-user"
import { UserRole } from "@/types"
import { redirect } from "next/navigation"
import { PageHeader } from "@/components/shared/page-header"
import { CurrencySettingsForm } from "@/components/modules/settings/currency-settings-form"
import { ExchangeRateTable } from "@/components/modules/settings/exchange-rate-table"

export default async function CurrencySettingsPage() {
  const user = await requireCurrentUser()

  if (user.role !== UserRole.Admin) {
    redirect("/")
  }

  return (
    <div className="page-shell">
      <PageHeader
        title="Configuración de Moneda"
        description="Gestiona la moneda principal del sistema y las tasas de cambio vigentes."
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Configuración" },
          { label: "Moneda" },
        ]}
      />

      <div className="page-content space-y-8">
        <CurrencySettingsForm />
        <ExchangeRateTable />
      </div>
    </div>
  )
}
