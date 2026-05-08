import { prisma } from "@/lib/prisma"
import { requireCurrentUser } from "@/lib/auth/current-user"
import { AttendancePageClient } from "./attendance-page-client"

export default async function AttendancePage() {
  const currentUser = await requireCurrentUser()

  // Find the employee linked to this user
  const employee = await prisma.employee.findFirst({
    where: { profileId: currentUser.id, isActive: true },
    include: { schedule: true },
  })

  // For admin/manager, get team list
  const isAdminOrManager = ["admin", "manager"].includes(currentUser.role)

  let teamEmployees: Array<{ id: string; fullName: string }> = []
  if (isAdminOrManager) {
    const employees = await prisma.employee.findMany({
      where: { isActive: true },
      select: { id: true, fullName: true },
      orderBy: { fullName: "asc" },
    })
    teamEmployees = employees
  }

  return (
    <section className="page-shell">
      <div className="page-content space-y-6">
        <AttendancePageClient
          employeeId={employee?.id ?? null}
          employeeName={employee?.fullName ?? currentUser.fullName ?? ""}
          isAdmin={isAdminOrManager}
          teamEmployees={teamEmployees}
        />
      </div>
    </section>
  )
}
