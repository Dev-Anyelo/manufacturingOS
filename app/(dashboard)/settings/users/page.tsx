import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { UserRole } from "@prisma/client"
import { Badge } from "@/components/ui/badge"
import { hasPermission } from "@/lib/permissions"
import { PageHeader } from "@/components/shared/page-header"
import { requireCurrentUser } from "@/lib/auth/current-user"
import { ShieldCheckIcon, ShieldAlertIcon } from "lucide-react"
import { UserPermissionsForm } from "@/components/modules/settings/user-permissions-form"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default async function UsersSettingsPage() {
  const currentUser = await requireCurrentUser()
  const permissions = await hasPermission(currentUser.id, "settings", "view")

  if (!permissions) {
    redirect("/unauthorized")
  }

  const users = await prisma.profile.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      permissionsOwned: true,
    },
  })

  return (
    <div className="page-shell">
      <PageHeader
        title="Gestión de usuarios y permisos"
        description="Administra los accesos y roles de los usuarios del sistema."
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Configuración", href: "/settings" },
          { label: "Usuarios" },
        ]}
      />

      <div className="page-content space-y-4">
        <Card className="border border-border/70 shadow-card">
          <CardHeader>
            <CardTitle className="text-base text-pretty">
              Usuarios del sistema
            </CardTitle>
            <CardDescription className="text-sm text-pretty">
              Selecciona un usuario para configurar sus permisos en el sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/70">
              {users.map((user) => {
                const hasOverrides = user.permissionsOwned.length > 0
                const roleLabel = {
                  [UserRole.admin]: "Administrador",
                  [UserRole.manager]: "Gerente",
                  [UserRole.employee]: "Empleado",
                  [UserRole.readonly]: "Solo lectura",
                }[user.role]

                return (
                  <div
                    key={user.id}
                    className="flex flex-col justify-between p-4 hover:bg-muted/10 sm:flex-row sm:items-center"
                  >
                    <div className="mb-4 sm:mb-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {user.fullName || "Sin nombre"}
                        </p>
                        {hasOverrides && (
                          <Badge
                            variant="outline"
                            className="border-warning/50 text-warning text-[10px]"
                          >
                            <ShieldAlertIcon className="mr-1 size-3" />
                            Permisos modificados
                          </Badge>
                        )}
                        {user.role === UserRole.admin && (
                          <Badge
                            variant="outline"
                            className="border-primary/50 text-[10px] text-primary"
                          >
                            <ShieldCheckIcon className="mr-1 size-3" />
                            Acceso total
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground capitalize">
                        Rol asignado: {roleLabel}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <UserPermissionsForm
                        userId={user.id}
                        userName={user.fullName || "Sin nombre"}
                        userRole={user.role}
                        hasOverrides={hasOverrides}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
