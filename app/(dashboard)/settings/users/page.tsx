import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { hasPermission } from "@/lib/permissions"
import { PageHeader } from "@/components/shared/page-header"
import { requireCurrentUser } from "@/lib/auth/current-user"
import { UsersTable } from "@/components/modules/settings/users-table"

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
        <UsersTable users={users} currentUserId={currentUser.id} />
      </div>
    </div>
  )
}
