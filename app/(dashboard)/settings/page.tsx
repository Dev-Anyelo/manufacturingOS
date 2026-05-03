import Link from "next/link"
import { UserRole } from "@/types"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { requireCurrentUser } from "@/lib/auth/current-user"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import {
  BellRingIcon,
  Settings2Icon,
  ShieldCheckIcon,
  UserIcon,
  FileCheck2Icon,
  TrendingUpIcon,
} from "lucide-react"

export default async function SettingsPage() {
  const user = await requireCurrentUser()

  if (user.role !== UserRole.Admin) {
    redirect("/")
  }

  const [settings, profiles] = await Promise.all([
    prisma.systemSetting.findFirst(),
    prisma.profile.findMany({ select: { role: true, isActive: true } }),
  ])

  const totalUsers = profiles.filter((p) => p.isActive).length
  const roleCounts = profiles.reduce(
    (acc, p) => {
      if (p.isActive) acc[p.role] = (acc[p.role] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  const getRoleLabel = (role: string, count: number) => {
    const labels: Record<string, string> = {
      admin: count === 1 ? "admin" : "admins",
      manager: count === 1 ? "gerente" : "gerentes",
      employee: count === 1 ? "empleado" : "empleados",
      readonly: "solo lectura",
    }
    return labels[role] || role
  }

  const rolesText = Object.entries(roleCounts)
    .map(([role, count]) => `${count} ${getRoleLabel(role, count)}`)
    .join(" · ")

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
        <div className="flex snap-x snap-mandatory overflow-x-auto pb-4 lg:grid lg:grid-cols-4 lg:gap-2 lg:overflow-visible lg:pb-0 [&::-webkit-scrollbar]:hidden">
          <StatMini
            label="Perfil"
            value={settings ? "Configurado" : "Pendiente"}
            tone={settings ? "success" : "warning"}
            icon={UserIcon}
          />
          <StatMini
            label="Acceso"
            value="Solo admin"
            tone="brand"
            icon={ShieldCheckIcon}
          />
          <StatMini
            label="Alertas"
            value="Por módulo"
            tone="warning"
            icon={BellRingIcon}
          />
          <StatMini
            label="Auditoría"
            value="Activa"
            tone="success"
            icon={FileCheck2Icon}
          />
        </div>

        <div className="flex flex-col gap-3 md:grid md:grid-cols-3 md:gap-4">
          <Card className="border border-border/70 shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground">
                Estado de configuración
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-2">
                  <Settings2Icon className="size-4 text-primary" />
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold">
                      {settings?.companyName || "Pendiente de personalizar"}
                    </p>
                    {settings && (
                      <p className="text-xs text-muted-foreground">
                        Moneda: {settings.baseCurrency}
                      </p>
                    )}
                  </div>
                </div>
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
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-2">
                  <ShieldCheckIcon className="text-info size-4" />
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold">
                      {totalUsers} usuario{totalUsers === 1 ? "" : "s"} activo
                      {totalUsers === 1 ? "" : "s"}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {rolesText || "Sin roles activos"}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="w-full sm:w-auto"
                >
                  <Link href="/settings/users">Gestionar</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card className="border border-border/70 shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground">
                Moneda y Tasas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-2">
                  <TrendingUpIcon className="text-brand size-4" />
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold">
                      {settings?.displayCurrency || "USD"} (Principal)
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Gestión de paridad y visualización dual
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="w-full sm:w-auto"
                >
                  <Link href="/settings/currencies">Configurar</Link>
                </Button>
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
  icon: Icon,
}: {
  label: string
  value: string
  tone?: "brand" | "warning" | "success" | "muted"
  icon: React.ElementType
}) {
  const toneConfig = {
    brand: {
      text: "text-primary",
      bg: "bg-primary/10",
      border: "border-primary/20",
    },
    warning: {
      text: "text-warning",
      bg: "bg-warning/10",
      border: "border-warning/20",
    },
    success: {
      text: "text-success",
      bg: "bg-success/10",
      border: "border-success/20",
    },
    muted: {
      text: "text-muted-foreground",
      bg: "bg-muted/50",
      border: "border-border/50",
    },
  }[tone]

  return (
    <div className="flex min-w-[200px] snap-center items-center gap-3 rounded-xl border border-border/70 bg-card px-4 py-3 shadow-sm lg:min-w-0">
      <div
        className={`flex size-10 shrink-0 items-center justify-center rounded-full border ${toneConfig.bg} ${toneConfig.border}`}
      >
        <Icon className={`size-4.5 ${toneConfig.text}`} />
      </div>
      <div className="space-y-0.5">
        <p className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
          {label}
        </p>
        <p className={`text-sm font-semibold ${toneConfig.text}`}>{value}</p>
      </div>
    </div>
  )
}
