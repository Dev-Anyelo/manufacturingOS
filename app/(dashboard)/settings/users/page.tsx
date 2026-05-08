import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { UserPlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { hasPermission } from "@/lib/permissions"
import { PageHeader } from "@/components/shared/page-header"
import { requireCurrentUser } from "@/lib/auth/current-user"
import { UserForm } from "@/components/modules/settings/user-form"

import {
  UsersTable,
  UsersTableUser,
} from "@/components/modules/settings/users-table"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

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
      employee: {
        include: {
          attendanceRecords: {
            where: {
              date: {
                gte: new Date(new Date().setDate(new Date().getDate() - 30)),
              },
            },
            orderBy: { date: "desc" },
          },
        },
      },
    },
  })

  return (
    <div className="page-shell">
      <PageHeader
        title="Gestión de usuarios y permisos"
        description="Administra los accesos y roles de los usuarios del sistema."
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Configuración" },
          { label: "Usuarios" },
        ]}
        actions={
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <UserPlusIcon className="size-4" />
                Nuevo usuario
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[90vw] px-4 py-4 sm:max-w-106.25">
              <DialogHeader>
                <DialogTitle>Agregar nuevo usuario</DialogTitle>
                <DialogDescription className="text-sm text-pretty">
                  Crea una cuenta directamente. Podrás definir su contraseña
                  inicial y compartirle sus credenciales de acceso.
                </DialogDescription>
              </DialogHeader>
              <UserForm />
            </DialogContent>
          </Dialog>
        }
      />

      <div className="page-content space-y-4">
        <UsersTable
          users={users.map(
            (u): UsersTableUser => ({
              ...u,
              email: undefined,
              employee: u.employee
                ? {
                    ...u.employee,
                    baseSalary: u.employee.baseSalary
                      ? Number(u.employee.baseSalary)
                      : null,
                  }
                : null,
            })
          )}
          currentUserId={currentUser.id}
        />
      </div>
    </div>
  )
}
