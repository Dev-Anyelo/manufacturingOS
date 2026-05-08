"use client"

import { EmployeeAttendanceView } from "@/components/modules/attendance/employee-attendance-view"
import { AdminAttendanceView } from "@/components/modules/attendance/admin-attendance-view"

interface AttendancePageClientProps {
  employeeId: string | null
  employeeName: string
  isAdmin: boolean
  teamEmployees: Array<{ id: string; fullName: string }>
}

export function AttendancePageClient({
  employeeId,
  isAdmin,
  teamEmployees,
}: AttendancePageClientProps) {
  if (isAdmin) {
    return <AdminAttendanceView teamEmployees={teamEmployees} />
  }

  if (!employeeId) {
    // If not admin and no employee ID, they cannot use attendance
    return (
      <div className="flex h-[400px] flex-col items-center justify-center space-y-4 rounded-xl border border-dashed text-center">
        <p className="text-sm text-muted-foreground">
          No tienes un perfil de empleado asignado. Contacta al administrador.
        </p>
      </div>
    )
  }

  return <EmployeeAttendanceView employeeId={employeeId} />
}
