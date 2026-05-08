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

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      {/* Left: Avatar + Info */}
      <div className="flex items-start gap-4">
        <Avatar className="size-14 border-2 border-border shadow-sm sm:size-16">
          <AvatarImage src={profile.avatarUrl || undefined} />
          <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
            {getInitials(profile.fullName)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
              {profile.fullName || "Sin nombre"}
            </h1>
            <Badge variant="outline" className={roleConfig.className}>
              {roleConfig.label}
            </Badge>
            <Badge
              variant="outline"
              className={
                profile.isActive
                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600"
                  : "border-gray-500/20 bg-gray-500/10 text-gray-500"
              }
            >
              <span
                className={`mr-1.5 inline-block size-1.5 rounded-full ${
                  profile.isActive ? "bg-emerald-500" : "bg-gray-400"
                }`}
              />
              {profile.isActive ? "Activo" : "Inactivo"}
            </Badge>
          </div>

          {/* Secondary info */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {profile.employee?.documentId && (
              <span className="flex items-center gap-1">
                <IdCard className="size-3.5" />
                {profile.employee.documentId}
              </span>
            )}
            {profile.phone && (
              <span className="flex items-center gap-1">
                <Phone className="size-3.5" />
                {profile.phone}
              </span>
            )}
            {profile.employee?.hireDate && (
              <span className="flex items-center gap-1">
                <CalendarDays className="size-3.5" />
                Desde{" "}
                {format(new Date(profile.employee.hireDate), "MMM yyyy", {
                  locale: es,
                })}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex shrink-0 items-center gap-2">
        {/* Back button to users list */}
        <Button size="sm" variant="outline" onClick={onBack}>
          <ArrowLeft className="size-3.5" />
          Volver
        </Button>

        <Button size="sm" onClick={onEdit}>
          <PencilLine className="size-3.5" />
          Editar
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="outline" className="size-8">
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onToggleActive}>
              {profile.isActive ? "Desactivar" : "Activar"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
