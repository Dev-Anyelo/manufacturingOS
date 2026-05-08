import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { hasPermission } from "@/lib/permissions"
import { PageHeader } from "@/components/shared/page-header"
import { requireCurrentUser } from "@/lib/auth/current-user"
import { NewUserButton } from "@/components/modules/settings/new-user-button"

import {
  UsersTable,
  UsersTableUser,
} from "@/components/modules/settings/users-table"

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
        actions={<NewUserButton />}
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
