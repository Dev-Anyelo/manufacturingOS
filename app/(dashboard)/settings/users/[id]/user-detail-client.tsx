"use client"

import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useState, useCallback } from "react"
import type { UserRole, ContractType, Currency } from "@prisma/client"
import { UserInfoTab } from "@/components/modules/settings/user-info-tab"
import { UserFormSheet } from "@/components/modules/settings/user-form-sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { NoEmployeeState } from "@/components/modules/settings/no-employee-state"
import { AttendanceStats } from "@/components/modules/attendance/attendance-stats"
import { UserDetailHeader } from "@/components/modules/settings/user-detail-header"
import { LeaveRequestsTable } from "@/components/modules/attendance/leave-requests-table"
import { EmployeeScheduleForm } from "@/components/modules/settings/employee-schedule-form"
import { AttendanceHistoryTable } from "@/components/modules/attendance/attendance-history-table"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EmployeeSchedule {
  id: string
  employeeId: string
  expectedCheckIn: string
  expectedLunchStart: string | null
  expectedLunchEnd: string | null
  expectedCheckOut: string
  lateTolerance: number
  workDays: number[]
  isActive: boolean
}

interface EmployeeData {
  id: string
  fullName: string
  documentId: string
  phone: string | null
  email: string | null
  hireDate: string | Date
  contractType: ContractType
  baseSalary: number | string | null
  baseSalaryCurrency: Currency | null
  isActive: boolean
  schedule: EmployeeSchedule | null
}

interface ProfileData {
  id: string
  fullName: string | null
  role: UserRole
  phone: string | null
  address: string | null
  birthDate: string | Date | null
  avatarUrl: string | null
  isActive: boolean
  createdAt: string | Date
  updatedAt: string | Date
  employee: EmployeeData | null
}

interface UserDetailClientProps {
  profile: ProfileData
  isAdmin: boolean
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function UserDetailClient({ profile, isAdmin }: UserDetailClientProps) {
  const router = useRouter()
  const [formOpen, setFormOpen] = useState(false)

  const handleFormSuccess = useCallback(() => {
    router.refresh()
  }, [router])

  const handleToggleActive = useCallback(async () => {
    try {
      const res = await fetch(`/api/settings/users/${profile.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !profile.isActive }),
      })
      if (!res.ok) throw new Error("Error al actualizar estado")
      toast.success(
        profile.isActive ? "Usuario desactivado" : "Usuario activado"
      )
      router.refresh()
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Error desconocido"
      toast.error(msg)
    }
  }, [profile.id, profile.isActive, router])

  const openFormForSetup = useCallback(() => {
    setFormOpen(true)
  }, [])

  const hasEmployee = !!profile.employee

  return (
    <div className="page-shell">
      <div className="page-content space-y-4">
        {/* ── Header ── */}
        <UserDetailHeader
          profile={profile}
          onEdit={() => setFormOpen(true)}
          onToggleActive={handleToggleActive}
        />

        {/* ── Tabs — ALWAYS all visible ── */}
        <Tabs defaultValue="info" className="w-full">
          <TabsList>
            <TabsTrigger value="info">Información</TabsTrigger>
            <TabsTrigger value="schedule">Horario</TabsTrigger>
            <TabsTrigger value="attendance">Asistencia</TabsTrigger>
            <TabsTrigger value="permissions">Permisos</TabsTrigger>
            <TabsTrigger value="stats">Estadísticas</TabsTrigger>
          </TabsList>

          {/* Tab: Información */}
          <TabsContent value="info" className="w-full pt-3">
            <UserInfoTab profile={profile} />
          </TabsContent>

          {/* Tab: Horario */}
          <TabsContent value="schedule" className="w-full pt-3">
            {hasEmployee ? (
              <div className="max-w-xl">
                <EmployeeScheduleForm
                  employeeId={profile.employee!.id}
                  initialData={profile.employee!.schedule}
                />
              </div>
            ) : (
              <NoEmployeeState
                context="el horario"
                onSetup={openFormForSetup}
              />
            )}
          </TabsContent>

          {/* Tab: Asistencia */}
          <TabsContent value="attendance" className="w-full pt-3">
            {hasEmployee ? (
              <AttendanceHistoryTable
                employeeId={profile.employee!.id}
                isAdmin={isAdmin}
              />
            ) : (
              <NoEmployeeState
                context="la asistencia"
                onSetup={openFormForSetup}
              />
            )}
          </TabsContent>

          {/* Tab: Permisos */}
          <TabsContent value="permissions" className="w-full pt-3">
            {hasEmployee ? (
              <div>
                <LeaveRequestsTable
                  employeeId={profile.employee!.id}
                  isAdmin={isAdmin}
                />
              </div>
            ) : (
              <NoEmployeeState
                context="los permisos"
                onSetup={openFormForSetup}
              />
            )}
          </TabsContent>

          {/* Tab: Estadísticas */}
          <TabsContent value="stats" className="w-full pt-3">
            {hasEmployee ? (
              <AttendanceStats employeeId={profile.employee!.id} />
            ) : (
              <NoEmployeeState
                context="las estadísticas"
                onSetup={openFormForSetup}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* ── UserForm Sheet/Drawer ── */}
      <UserFormSheet
        open={formOpen}
        onOpenChange={setFormOpen}
        initialData={{
          id: profile.id,
          fullName: profile.fullName,
          role: profile.role,
          phone: profile.phone,
          address: profile.address,
          birthDate: profile.birthDate,
          avatarUrl: profile.avatarUrl,
          isActive: profile.isActive,
          employee: profile.employee
            ? {
                documentId: profile.employee.documentId,
                hireDate: profile.employee.hireDate,
                contractType: profile.employee.contractType,
                baseSalary: profile.employee.baseSalary,
                baseSalaryCurrency: profile.employee.baseSalaryCurrency,
              }
            : null,
        }}
        onSuccess={handleFormSuccess}
      />
    </div>
  )
}
