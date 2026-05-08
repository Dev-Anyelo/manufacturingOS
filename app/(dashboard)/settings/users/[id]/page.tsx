import { es } from "date-fns/locale"
import { prisma } from "@/lib/prisma"
import { getRoleLabel } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { hasPermission } from "@/lib/permissions"
import { notFound, redirect } from "next/navigation"
import { PageHeader } from "@/components/shared/page-header"
import { requireCurrentUser } from "@/lib/auth/current-user"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AttendanceStats } from "@/components/modules/attendance/attendance-stats"
import { CreateEmployeeForm } from "@/components/modules/settings/create-employee-form"
import { LeaveRequestsTable } from "@/components/modules/attendance/leave-requests-table"
import { EmployeeScheduleForm } from "@/components/modules/settings/employee-schedule-form"
import { AttendanceHistoryTable } from "@/components/modules/attendance/attendance-history-table"

export default async function UserDetailPage(props: {
  params: Promise<{ id: string }>
}) {
  const params = await props.params
  const userId = params.id

  const currentUser = await requireCurrentUser()
  const permissions = await hasPermission(currentUser.id, "settings", "view")

  if (!permissions && currentUser.id !== userId) {
    redirect("/unauthorized")
  }

  const isAdmin = permissions

  const profile = await prisma.profile.findUnique({
    where: { id: userId },
    include: {
      employee: {
        include: {
          schedule: true,
        },
      },
    },
  })

  if (!profile) {
    notFound()
  }

  return (
    <div className="page-shell">
      <PageHeader
        title={`Detalle: ${profile.fullName || "Sin nombre"}`}
        description={`Rol: ${getRoleLabel(profile.role)} | Estado: ${profile.isActive ? "Activo" : "Inactivo"}`}
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Configuración", href: "/settings/users" },
          { label: "Usuarios", href: "/settings/users" },
          { label: profile.fullName || "Detalle" },
        ]}
      />

      <div className="page-content space-y-6">
        <Tabs defaultValue="info" className="w-full">
          <TabsList className="h-auto w-full justify-start rounded-none border-b bg-transparent p-0">
            <TabsTrigger
              value="info"
              className="rounded-none px-4 py-2 data-[state=active]:border-b-2 data-[state=active]:border-primary"
            >
              Información
            </TabsTrigger>
            {!profile.employee && isAdmin && (
              <TabsTrigger
                value="employee_setup"
                className="rounded-none px-4 py-2 data-[state=active]:border-b-2 data-[state=active]:border-primary"
              >
                Vincular Empleado
              </TabsTrigger>
            )}
            {profile.employee && (
              <>
                <TabsTrigger
                  value="schedule"
                  className="rounded-none px-4 py-2 data-[state=active]:border-b-2 data-[state=active]:border-primary"
                >
                  Horario
                </TabsTrigger>
                <TabsTrigger
                  value="attendance"
                  className="rounded-none px-4 py-2 data-[state=active]:border-b-2 data-[state=active]:border-primary"
                >
                  Asistencia
                </TabsTrigger>
                <TabsTrigger
                  value="permissions"
                  className="rounded-none px-4 py-2 data-[state=active]:border-b-2 data-[state=active]:border-primary"
                >
                  Permisos
                </TabsTrigger>
                <TabsTrigger
                  value="stats"
                  className="rounded-none px-4 py-2 data-[state=active]:border-b-2 data-[state=active]:border-primary"
                >
                  Estadísticas
                </TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="info" className="pt-6">
            <div className="max-w-xl rounded-xl border bg-card p-6">
              <h3 className="mb-4 text-lg font-medium">
                Información del Perfil
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-muted-foreground">ID</div>
                <div>{profile.id}</div>
                <div className="text-muted-foreground">Creado</div>
                <div>
                  {formatDistanceToNow(profile.createdAt, {
                    addSuffix: true,
                    locale: es,
                  })}
                </div>
                {profile.employee && (
                  <>
                    <div className="text-muted-foreground">Contrato</div>
                    <div>{profile.employee.contractType}</div>
                  </>
                )}
              </div>
            </div>
          </TabsContent>

          {!profile.employee && isAdmin && (
            <TabsContent value="employee_setup" className="pt-6">
              <CreateEmployeeForm profileId={profile.id} />
            </TabsContent>
          )}

          {profile.employee && (
            <>
              <TabsContent value="schedule" className="pt-6">
                <div className="max-w-xl">
                  <EmployeeScheduleForm
                    employeeId={profile.employee.id}
                    initialData={profile.employee.schedule}
                  />
                </div>
              </TabsContent>
              <TabsContent value="attendance" className="pt-6">
                <AttendanceHistoryTable
                  employeeId={profile.employee.id}
                  isAdmin={isAdmin}
                />
              </TabsContent>
              <TabsContent value="permissions" className="pt-6">
                <div className="max-w-4xl">
                  <LeaveRequestsTable
                    employeeId={profile.employee.id}
                    isAdmin={isAdmin}
                  />
                </div>
              </TabsContent>
              <TabsContent value="stats" className="pt-6">
                <AttendanceStats employeeId={profile.employee.id} />
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </div>
  )
}
