import { UserRole } from "@/types"
import { redirect } from "next/navigation"
import {
  ArrowUpRightIcon,
  BellRingIcon,
  Building2Icon,
  ShieldAlertIcon,
  Settings2Icon,
  ShieldCheckIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/shared/empty-state"
import { PageHeader } from "@/components/shared/page-header"
import { requireCurrentUser } from "@/lib/auth/current-user"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default async function SettingsPage() {
  const user = await requireCurrentUser()

  if (user.role !== UserRole.Admin) {
    redirect("/")
  }

  return (
    <div className="page-shell">
      <PageHeader
        title="Configuracion"
        description="Gestiona parametros globales del sistema y del taller."
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Configuracion" },
        ]}
      />

      <div className="page-content">
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          <StatMini label="Perfil" value="Pendiente" tone="warning" />
          <StatMini label="Acceso" value="Solo admin" tone="brand" />
          <StatMini label="Alertas" value="Por modulo" tone="warning" />
          <StatMini label="Auditoria" value="Activa" tone="success" />
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Card className="border border-border/70 shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground">
                Estado de configuracion
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Settings2Icon className="size-4 text-brand" />
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
              <div className="flex items-center gap-2">
                <ShieldCheckIcon className="text-info size-4" />
                <p className="text-sm font-semibold">Solo administradores</p>
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

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className="border border-border/70 shadow-card">
            <CardHeader className="flex flex-row items-center justify-between gap-2 border-b border-border/70 bg-muted/10 pb-3">
              <CardTitle className="text-base">Perfil de empresa</CardTitle>
              <Badge variant="outline" className="text-xs">
                Requerido
              </Badge>
            </CardHeader>
            <CardContent className="pt-4">
              <EmptyState
                icon={<Building2Icon />}
                title="Datos de empresa pendientes"
                description="Configura nombre comercial, contacto, moneda base y parametros operativos."
                compact
              />
            </CardContent>
          </Card>

          <Card className="border border-border/70 shadow-card">
            <CardHeader className="flex flex-row items-center justify-between gap-2 border-b border-border/70 bg-muted/10 pb-3">
              <CardTitle className="text-base">Controles avanzados</CardTitle>
              <Button size="sm" variant="outline" disabled>
                <ArrowUpRightIcon className="size-3.5" />
                Configurar
              </Button>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              {[
                "Umbrales de stock y alertas",
                "Politicas de notificacion",
                "Reglas de automatizacion",
                "Preferencias de reportes",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center justify-between rounded-lg border border-border/70 bg-card/85 px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <ShieldAlertIcon className="text-warning size-3.5" />
                    <p className="text-sm">{item}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Proximamente
                  </Badge>
                </div>
              ))}
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
    brand: "text-brand",
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
