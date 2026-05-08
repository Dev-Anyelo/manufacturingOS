"use client"

import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import type { UserRole } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

import {
  MoreVertical,
  Phone,
  IdCard,
  CalendarDays,
  PencilLine,
  ArrowLeft,
} from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ROLE_CONFIG: Record<string, { label: string; className: string }> = {
  admin: {
    label: "Administrador",
    className: "bg-red-500/10 text-red-600 border-red-500/20",
  },
  manager: {
    label: "Gerente",
    className: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  },
  employee: {
    label: "Empleado",
    className: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  },
  readonly: {
    label: "Solo lectura",
    className: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  },
}

function getInitials(name: string | null | undefined): string {
  if (!name) return "?"
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UserDetailHeaderProps {
  profile: {
    id: string
    fullName: string | null
    role: UserRole
    phone: string | null
    avatarUrl: string | null
    isActive: boolean
    employee?: {
      documentId: string
      hireDate: Date | string
    } | null
  }
  onEdit: () => void
  onToggleActive?: () => void
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function UserDetailHeader({
  profile,
  onEdit,
  onToggleActive,
}: UserDetailHeaderProps) {
  const roleConfig = ROLE_CONFIG[profile.role] || ROLE_CONFIG.readonly
  const router = useRouter()

  const onBack = () => {
    router.push("/settings/users")
  }

  const initials = getInitials(profile.fullName)

  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        {/* Avatar grande con iniciales */}
        <Avatar className="h-16 w-16 shrink-0 border-2 border-background shadow-sm">
          <AvatarImage src={profile.avatarUrl || undefined} />
          <AvatarFallback className="bg-primary/10 text-xl font-bold text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">
              {profile.fullName || "Sin nombre"}
            </h1>
            <Badge variant="outline" className="font-medium">
              {roleConfig.label}
            </Badge>
            <Badge
              className={
                profile.isActive
                  ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30"
                  : "bg-red-500/15 text-red-600 border-red-500/30"
              }
            >
              <div
                className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
                  profile.isActive ? "bg-emerald-500" : "bg-red-500"
                }`}
              />
              {profile.isActive ? "Activo" : "Inactivo"}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {profile.employee?.documentId && (
              <span className="flex items-center gap-1">
                <IdCard className="h-3.5 w-3.5" />
                {profile.employee.documentId}
              </span>
            )}
            {profile.employee?.hireDate && (
              <span className="flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" />
                Desde{" "}
                {format(new Date(profile.employee.hireDate), "PPP", {
                  locale: es,
                })}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Acciones — siempre visibles */}
      <div className="flex items-center gap-2 shrink-0">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Volver
        </Button>
        <Button size="sm" onClick={onEdit}>
          <PencilLine className="h-4 w-4 mr-1.5" /> Editar
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={onToggleActive}>
              {profile.isActive ? "Desactivar acceso" : "Reactivar acceso"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
