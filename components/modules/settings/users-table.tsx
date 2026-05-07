"use client"

import * as React from "react"
import { toast } from "sonner"
import { es } from "date-fns/locale"
import { UserForm } from "./user-form"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { revalidatePaths } from "@/lib/ui/revalidatePaths"
import { formatDistanceToNow } from "date-fns"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Prisma, UserRole } from "@prisma/client"
import { EmptyState } from "@/components/shared/empty-state"
import { UserPermissionsForm } from "./user-permissions-form"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import {
  SearchIcon,
  MoreHorizontalIcon,
  ShieldAlertIcon,
  UsersIcon,
  CheckCircle2Icon,
  XCircleIcon,
  ActivityIcon,
  PencilLineIcon,
} from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type UsersTableUser = Prisma.ProfileGetPayload<{
  include: { permissionsOwned: true }
}> & {
  email?: string | null
}

type UserTableProps = {
  users: UsersTableUser[]
  currentUserId: string
}

const roleMap: Record<string, { label: string; color: string }> = {
  [UserRole.admin]: {
    label: "Admin",
    color: "border-primary/50 text-primary bg-primary/10",
  },
  [UserRole.manager]: {
    label: "Manager",
    color: "border-blue-500/50 text-blue-500 bg-blue-500/10",
  },
  [UserRole.employee]: {
    label: "Empleado",
    color: "border-emerald-500/50 text-emerald-500 bg-emerald-500/10",
  },
  [UserRole.readonly]: {
    label: "Solo lectura",
    color: "border-muted-foreground/50 text-muted-foreground bg-muted/50",
  },
}

export function UsersTable({ users, currentUserId }: UserTableProps) {
  const [search, setSearch] = React.useState("")
  const [roleFilter, setRoleFilter] = React.useState<string>("all")
  const [showInactive, setShowInactive] = React.useState(false)

  // Filtering
  const filteredUsers = React.useMemo(() => {
    return users.filter((user) => {
      if (!showInactive && !user.isActive) return false
      if (roleFilter !== "all" && user.role !== roleFilter) return false

      if (search) {
        const query = search.toLowerCase()
        const nameMatch = user.fullName?.toLowerCase().includes(query)
        const emailMatch = user.email?.toLowerCase().includes(query)
        if (!nameMatch && !emailMatch) return false
      }

      return true
    })
  }, [users, search, roleFilter, showInactive])

  // Count by role for tabs
  const counts = React.useMemo(() => {
    const acc: Record<string, number> = {
      all: 0,
      admin: 0,
      manager: 0,
      employee: 0,
      readonly: 0,
    }
    users.forEach((u) => {
      if (!showInactive && !u.isActive) return
      acc.all++
      acc[u.role] = (acc[u.role] || 0) + 1
    })
    return acc
  }, [users, showInactive])

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-70">
            <SearchIcon className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Buscar usuarios..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 [&::-webkit-scrollbar]:hidden">
            <FilterTab
              label="Todos"
              count={counts.all}
              active={roleFilter === "all"}
              onClick={() => setRoleFilter("all")}
            />
            {Object.keys(roleMap).map((roleKey) => (
              <FilterTab
                key={roleKey}
                label={roleMap[roleKey].label}
                count={counts[roleKey] || 0}
                active={roleFilter === roleKey}
                onClick={() => setRoleFilter(roleKey)}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <label
            htmlFor="show-inactive"
            className="cursor-pointer text-xs font-medium text-pretty text-muted-foreground"
          >
            Mostrar inactivos
          </label>{" "}
          <Switch
            id="show-inactive"
            checked={showInactive}
            onCheckedChange={setShowInactive}
          />
        </div>
      </div>

      {/* Users List (Table on desktop, Cards on mobile) */}
      {filteredUsers.length === 0 ? (
        <div className="rounded-xl border border-border/70 bg-card p-8">
          <EmptyState
            icon={<UsersIcon />}
            title="No se encontraron usuarios"
            description="Ningún usuario coincide con los filtros aplicados."
            compact
          />
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm">
          {/* Mobile Cards */}
          <div className="grid gap-0 divide-y divide-border/70 sm:hidden">
            {filteredUsers.map((user) => (
              <UserCardRow
                key={user.id}
                user={user}
                isCurrentUser={user.id === currentUserId}
              />
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden sm:block">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="w-75">Usuario</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Último acceso</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <UserTableRow
                    key={user.id}
                    user={user}
                    isCurrentUser={user.id === currentUserId}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  )
}

function FilterTab({
  label,
  count,
  active,
  onClick,
}: {
  label: string
  count: number
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
        active
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
      }`}
    >
      {label}
      <span
        className={`flex h-4 min-w-4 items-center justify-center rounded-full text-[10px] ${
          active ? "bg-primary-foreground/20" : "bg-background"
        } px-1`}
      >
        {count}
      </span>
    </button>
  )
}

function UserInfo({
  user,
  isCurrentUser,
}: {
  user: UsersTableUser
  isCurrentUser: boolean
}) {
  const hasOverrides = user.permissionsOwned && user.permissionsOwned.length > 0
  const avatarFallback = user.fullName
    ? user.fullName.charAt(0).toUpperCase()
    : "U"

  return (
    <div className="flex items-center gap-3">
      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
        {avatarFallback}
      </div>
      <div className="space-y-0.5">
        <div className="flex items-center gap-2">
          <p className="text-sm leading-none font-medium">
            {user.fullName || "Sin nombre"}
          </p>
          {isCurrentUser && (
            <Badge
              variant="outline"
              className="h-4 border-primary/50 px-1.5 text-[9px] text-primary"
            >
              Tú
            </Badge>
          )}
          {hasOverrides && (
            <Badge
              variant="outline"
              className="border-warning/50 text-warning h-4 px-1.5 text-[9px]"
              title="Permisos modificados"
            >
              <ShieldAlertIcon className="mr-0.5 size-2.5" />
              Modificado
            </Badge>
          )}
        </div>
      </div>
    </div>
  )
}

function UserTableRow({
  user,
  isCurrentUser,
}: {
  user: UsersTableUser
  isCurrentUser: boolean
}) {
  const roleData = roleMap[user.role]
  const lastAccess = user.updatedAt
    ? formatDistanceToNow(new Date(user.updatedAt), {
        addSuffix: true,
        locale: es,
      })
    : "Nunca"

  return (
    <TableRow
      className={`transition-colors hover:bg-muted/10 ${!user.isActive ? "opacity-50" : ""}`}
    >
      <TableCell className="font-medium">
        <UserInfo user={user} isCurrentUser={isCurrentUser} />
      </TableCell>
      <TableCell>
        <Badge variant="outline" className={`text-[11px] ${roleData.color}`}>
          {roleData.label}
        </Badge>
      </TableCell>
      <TableCell>
        {user.isActive ? (
          <Badge
            variant="outline"
            className="border-success/50 text-success bg-success/10 text-[11px]"
          >
            <CheckCircle2Icon className="mr-1 size-3" />
            Activo
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className="border-destructive/50 bg-destructive/10 text-[11px] text-destructive"
          >
            <XCircleIcon className="mr-1 size-3" />
            Inactivo
          </Badge>
        )}
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">
        {lastAccess}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          <UserPermissionsForm
            userId={user.id}
            userName={user.fullName || "Sin nombre"}
            userRole={user.role}
            hasOverrides={
              user.permissionsOwned && user.permissionsOwned.length > 0
            }
            isActive={user.isActive}
          />
          <UserActionsMenu user={user} isCurrentUser={isCurrentUser} />
        </div>
      </TableCell>
    </TableRow>
  )
}

function UserCardRow({
  user,
  isCurrentUser,
}: {
  user: UsersTableUser
  isCurrentUser: boolean
}) {
  const roleData = roleMap[user.role]

  return (
    <div className={`p-4 ${!user.isActive ? "opacity-50" : ""}`}>
      <div className="mb-3 flex items-start justify-between">
        <UserInfo user={user} isCurrentUser={isCurrentUser} />
        <UserActionsMenu user={user} isCurrentUser={isCurrentUser} />
      </div>

      <div className="mb-3 flex items-center gap-2">
        <Badge variant="outline" className={`text-[10px] ${roleData.color}`}>
          {roleData.label}
        </Badge>
        {user.isActive ? (
          <Badge
            variant="outline"
            className="border-success/50 text-success bg-success/10 text-[10px]"
          >
            Activo
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className="border-destructive/50 bg-destructive/10 text-[10px] text-destructive"
          >
            Inactivo
          </Badge>
        )}
      </div>

      <div className="flex w-full items-center gap-2">
        <div className="flex-1">
          <UserPermissionsForm
            userId={user.id}
            userName={user.fullName || "Sin nombre"}
            userRole={user.role}
            hasOverrides={
              user.permissionsOwned && user.permissionsOwned.length > 0
            }
            isActive={user.isActive}
          />
        </div>
      </div>
    </div>
  )
}

function UserActionsMenu({
  user,
  isCurrentUser,
}: {
  user: UsersTableUser
  isCurrentUser: boolean
}) {
  const router = useRouter()
  const [isEditOpen, setIsEditOpen] = React.useState(false)
  const [isToggling, setIsToggling] = React.useState(false)

  const handleToggleStatus = async () => {
    try {
      setIsToggling(true)
      const res = await fetch(`/api/settings/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !user.isActive }),
      })

      const result = await res.json()
      if (!res.ok) throw new Error(result.error)

      toast.success(
        `Usuario ${!user.isActive ? "reactivado" : "desactivado"} exitosamente`
      )
      await revalidatePaths(["/settings/users"])
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Error al actualizar estado"
      toast.error(message)
    } finally {
      setIsToggling(false)
    }
  }

  return (
    <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8">
            <MoreHorizontalIcon className="size-4" />
            <span className="sr-only">Abrir menú</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Acciones de usuario</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DialogTrigger asChild>
            <DropdownMenuItem disabled={isCurrentUser}>
              <PencilLineIcon className="mr-2 size-4" />
              Editar
            </DropdownMenuItem>
          </DialogTrigger>
          <DropdownMenuItem>
            <ActivityIcon className="mr-2 size-4" />
            Ver actividad
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={isCurrentUser || isToggling}
            className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
            onClick={handleToggleStatus}
          >
            {user.isActive ? "Desactivar acceso" : "Reactivar acceso"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DialogContent className="p-4 sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle className="text-sm text-pretty">
            Editar información del usuario
          </DialogTitle>
          <DialogDescription>
            Si cambias el rol, asegúrate de revisar sus permisos específicos si
            los tuviera.
          </DialogDescription>
        </DialogHeader>
        <UserForm initialData={user} onSuccess={() => setIsEditOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}
