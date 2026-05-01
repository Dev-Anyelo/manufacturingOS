"use client"

import * as React from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { DEFAULT_PERMISSIONS } from "@/lib/permissions/constants"
import type { PermissionOverride } from "@/lib/permissions/types"
import { ShieldCheckIcon, AlertTriangleIcon, Loader2 } from "lucide-react"
import { MODULE_KEYS, ACTION_KEYS } from "@/lib/permissions/types"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet"
import { UserRole } from "@prisma/client"

type UserPermissionsFormProps = {
  userId: string
  userName: string
  userRole: string
  hasOverrides: boolean
}

type MatrixState = Record<string, Record<string, boolean>>

export function UserPermissionsForm({
  userId,
  userName,
  userRole,
  hasOverrides,
}: UserPermissionsFormProps) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [saving, setSaving] = React.useState(false)

  const [useCustom, setUseCustom] = React.useState(hasOverrides)
  const [matrix, setMatrix] = React.useState<MatrixState>({})

  const roleDefaults =
    DEFAULT_PERMISSIONS[userRole] || DEFAULT_PERMISSIONS["readonly"]

  const loadPermissions = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/settings/users/${userId}/permissions`)
      const result = await res.json()

      if (!res.ok) throw new Error(result.error)

      const overrides: PermissionOverride[] = result.data || []

      const newMatrix: MatrixState = {}

      // Initialize with defaults
      for (const mod of MODULE_KEYS) {
        newMatrix[mod] = { ...roleDefaults[mod] }
      }

      // Apply overrides if any
      if (overrides.length > 0) {
        setUseCustom(true)
        for (const override of overrides) {
          if (newMatrix[override.module]) {
            newMatrix[override.module] = {
              view: override.canView,
              create: override.canCreate,
              edit: override.canEdit,
              delete: override.canDelete,
              export: override.canExport,
            }
          }
        }
      } else {
        setUseCustom(false)
      }

      setMatrix(newMatrix)
    } catch (err: any) {
      toast.error(err.message || "Error al cargar los permisos")
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    if (open) {
      loadPermissions()
    }
  }, [open])

  const handleSave = async () => {
    try {
      setSaving(true)

      const payload = []

      if (useCustom) {
        // Build payload from matrix
        for (const mod of MODULE_KEYS) {
          payload.push({
            module: mod,
            canView: matrix[mod]?.view ?? false,
            canCreate: matrix[mod]?.create ?? false,
            canEdit: matrix[mod]?.edit ?? false,
            canDelete: matrix[mod]?.delete ?? false,
            canExport: matrix[mod]?.export ?? false,
          })
        }
      }

      const res = await fetch(`/api/settings/users/${userId}/permissions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const result = await res.json()
      if (!res.ok) throw new Error(result.error)

      toast.success(result.data.message || "Permisos guardados")
      setOpen(false)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || "Error al guardar permisos")
    } finally {
      setSaving(false)
    }
  }

  const toggleAction = (mod: string, action: string, checked: boolean) => {
    if (!useCustom) return
    setMatrix((prev) => ({
      ...prev,
      [mod]: {
        ...prev[mod],
        [action]: checked,
      },
    }))
  }

  const isAdmin = userRole === "admin"

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" disabled={isAdmin}>
          <ShieldCheckIcon className="mr-2 size-4" />
          Permisos
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>Permisos de {userName}</SheetTitle>
          <SheetDescription className="text-pretty">
            Configura el acceso granular a los módulos del sistema.
          </SheetDescription>
        </SheetHeader>

        {isAdmin ? (
          <Alert
            variant="default"
            className="mb-6 border-primary/50 bg-primary/5"
          >
            <AlertTriangleIcon className="size-4 text-primary" />
            <AlertTitle>Administrador</AlertTitle>
            <AlertDescription className="text-pretty">
              Este usuario tiene el rol de administrador. Tiene acceso total al
              sistema de forma inamovible.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4 px-3">
            <div className="flex items-center justify-between rounded-lg border border-border/70 bg-muted/20 p-4">
              <div className="space-y-0.5">
                <h4 className="text-sm font-medium">Personalizar accesos</h4>
                <p className="text-xs text-pretty text-muted-foreground">
                  Sobrescribir los permisos predeterminados del rol (
                  {userRole === UserRole.admin
                    ? "Administrador"
                    : userRole === UserRole.manager
                      ? "Gerente"
                      : userRole === UserRole.employee
                        ? "Empleado"
                        : userRole === UserRole.readonly
                          ? "Solo lectura"
                          : "Usuario"}
                  ).
                </p>
              </div>
              <Switch
                checked={useCustom}
                onCheckedChange={setUseCustom}
                disabled={loading}
              />
            </div>

            {loading ? (
              <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Cargando permisos...
              </div>
            ) : (
              <div className="rounded-md border border-border/70">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/70 bg-muted/30">
                        <th className="px-4 py-3 text-left font-medium">
                          Módulo
                        </th>
                        {ACTION_KEYS.map((action) => (
                          <th
                            key={action}
                            className="px-4 py-3 text-center font-medium capitalize"
                          >
                            {action}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {MODULE_KEYS.map((mod) => (
                        <tr
                          key={mod}
                          className="border-b border-border/30 last:border-0 hover:bg-muted/10"
                        >
                          <td className="px-4 py-3 font-medium capitalize">
                            {mod}
                          </td>
                          {ACTION_KEYS.map((action) => {
                            const isChecked = matrix[mod]?.[action] ?? false
                            return (
                              <td
                                key={action}
                                className="px-4 py-3 text-center"
                              >
                                <Checkbox
                                  checked={isChecked}
                                  disabled={!useCustom}
                                  onCheckedChange={(c) =>
                                    toggleAction(mod, action, !!c)
                                  }
                                />
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {!isAdmin && (
          <SheetFooter className="mt-8">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving || loading}>
              {saving ? "Guardando..." : "Guardar cambios"}
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  )
}
