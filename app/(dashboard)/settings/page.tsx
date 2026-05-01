import Link from "next/link"
import { UserRole } from "@/types"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { requireCurrentUser } from "@/lib/auth/current-user"
import { PageHeader } from "@/components/shared/page-header"
import { BellRingIcon, Settings2Icon, ShieldCheckIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function SettingsPage() {
  const user = await requireCurrentUser()

  if (user.role !== UserRole.Admin) {
    redirect("/")
  }

  return (
    <div className="page-shell">
      <PageHeader
        title="Configuración"
        description="Gestiona parámetros globales del sistema y del taller."
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Configuración" },
        ]}
      />

      <div className="page-content space-y-6">
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          <StatMini label="Perfil" value="Pendiente" tone="warning" />
          <StatMini label="Acceso" value="Solo admin" tone="brand" />
          <StatMini label="Alertas" value="Por módulo" tone="warning" />
          <StatMini label="Auditoría" value="Activa" tone="success" />
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
          <Card className="border border-border/70 shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground">
                Estado de configuración
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Settings2Icon className="size-4 text-primary" />
                <p className="text-sm font-semibold">
                  Pendiente de personalizar
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="border border-border/70 shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground">
                Seguridad y acceso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <ShieldCheckIcon className="text-info size-4" />
                  <p className="text-sm font-semibold">Administrar usuarios</p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/settings/users">Gestionar</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card className="border border-border/70 shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground">
                Notificaciones sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <BellRingIcon className="text-warning size-4" />
                <p className="text-sm font-semibold">Configurable por modulo</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function StatMini({
  label,
  value,
  tone = "brand",
}: {
  label: string
  value: string
  tone?: "brand" | "warning" | "success"
}) {
  const toneClass = {
    brand: "text-primary",
    warning: "text-warning",
    success: "text-success",
  }[tone]

  return (
    <div className="rounded-lg border border-border/70 bg-card/85 px-3 py-2">
      <p className="text-[11px] tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <p className={`text-sm font-semibold ${toneClass}`}>{value}</p>
    </div>
  )
}
