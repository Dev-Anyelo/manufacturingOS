"use client"

import { useState } from "react"
import { es } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { format, formatDistanceToNow } from "date-fns"
import { ChevronDown, User, Briefcase, Settings2 } from "lucide-react"
import type { UserRole, ContractType, Currency } from "@prisma/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

// ---------------------------------------------------------------------------
// Translation helpers
// ---------------------------------------------------------------------------

const CONTRACT_LABELS: Record<string, string> = {
  fixed_salary: "Salario Fijo",
  per_piece: "Por Obra / Destajo",
  hourly: "Por Hora",
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  manager: "Gerente",
  employee: "Empleado",
  readonly: "Solo lectura",
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UserInfoTabProps {
  profile: {
    id: string
    fullName: string | null
    role: UserRole
    phone: string | null
    address: string | null
    birthDate: Date | string | null
    avatarUrl: string | null
    isActive: boolean
    createdAt: Date | string
    updatedAt: Date | string
    employee?: {
      id: string
      documentId: string
      hireDate: Date | string
      contractType: ContractType
      baseSalary: number | string | null
      baseSalaryCurrency: Currency | null
      isActive: boolean
    } | null
  }
  email?: string | null
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function InfoRow({
  label,
  value,
  className,
}: {
  label: string
  value: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3 ${className || ""}`}
    >
      <dt className="min-w-35 shrink-0 text-xs font-medium text-muted-foreground">
        {label}
      </dt>
      <dd className="text-sm text-foreground">{value || "—"}</dd>
    </div>
  )
}

export function UserInfoTab({ profile, email }: UserInfoTabProps) {
  const [systemOpen, setSystemOpen] = useState(false)

  const truncatedId = profile.id.substring(0, 8) + "..."

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Card 1: Datos Personales */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="size-4 text-muted-foreground" />
            Datos Personales
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <InfoRow label="Nombre" value={profile.fullName} />
          {email && <InfoRow label="Correo" value={email} />}
          <InfoRow label="Cédula" value={profile.employee?.documentId} />
          <InfoRow label="Teléfono" value={profile.phone} />
          <InfoRow label="Dirección" value={profile.address} />
          <InfoRow
            label="Fecha de nacimiento"
            value={
              profile.birthDate
                ? format(new Date(profile.birthDate), "PP", { locale: es })
                : null
            }
          />
          <Separator />
          <InfoRow
            label="Rol"
            value={
              <Badge variant="outline" className="text-xs">
                {ROLE_LABELS[profile.role] || profile.role}
              </Badge>
            }
          />
          <InfoRow
            label="Estado"
            value={
              <Badge
                variant="outline"
                className={
                  profile.isActive
                    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600"
                    : "border-gray-500/20 bg-gray-500/10 text-gray-500"
                }
              >
                {profile.isActive ? "Activo" : "Inactivo"}
              </Badge>
            }
          />
        </CardContent>
      </Card>

      {/* Card 2: Información Laboral */}
      {profile.employee ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Briefcase className="size-4 text-muted-foreground" />
              Información Laboral
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow
              label="Tipo de contrato"
              value={
                <Badge variant="secondary" className="text-xs">
                  {CONTRACT_LABELS[profile.employee.contractType] ||
                    profile.employee.contractType}
                </Badge>
              }
            />
            <InfoRow
              label="Salario base"
              value={
                profile.employee.baseSalary
                  ? `${Number(profile.employee.baseSalary).toLocaleString("es-NI", { minimumFractionDigits: 2 })} ${profile.employee.baseSalaryCurrency || ""}`
                  : "No definido"
              }
            />
            <InfoRow
              label="Fecha de contratación"
              value={format(new Date(profile.employee.hireDate), "PP", {
                locale: es,
              })}
            />
            <InfoRow
              label="Estado empleado"
              value={
                <Badge
                  variant="outline"
                  className={
                    profile.employee.isActive
                      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600"
                      : "border-gray-500/20 bg-gray-500/10 text-gray-500"
                  }
                >
                  {profile.employee.isActive ? "Activo" : "Inactivo"}
                </Badge>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Briefcase className="size-4 text-muted-foreground" />
              Información Laboral
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Este usuario no tiene datos laborales configurados. Edita su
              perfil para agregar información de contrato.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Card 3: Sistema (collapsible) — full width */}
      <div className="md:col-span-2">
        <Collapsible open={systemOpen} onOpenChange={setSystemOpen}>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Settings2 className="size-4 text-muted-foreground" />
                  Información del Sistema
                </CardTitle>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-7">
                    <ChevronDown
                      className={`size-4 transition-transform ${
                        systemOpen ? "rotate-180" : ""
                      }`}
                    />
                  </Button>
                </CollapsibleTrigger>
              </div>
            </CardHeader>
            <CollapsibleContent>
              <CardContent className="space-y-3 pt-0">
                <InfoRow
                  label="ID del perfil"
                  value={
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <code className="cursor-help rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                            {truncatedId}
                          </code>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="font-mono text-xs">{profile.id}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  }
                />
                <InfoRow
                  label="Creado"
                  value={
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-help">
                            {formatDistanceToNow(new Date(profile.createdAt), {
                              addSuffix: true,
                              locale: es,
                            })}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">
                            {format(new Date(profile.createdAt), "PPpp", {
                              locale: es,
                            })}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  }
                />
                <InfoRow
                  label="Última actualización"
                  value={
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-help">
                            {formatDistanceToNow(new Date(profile.updatedAt), {
                              addSuffix: true,
                              locale: es,
                            })}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">
                            {format(new Date(profile.updatedAt), "PPpp", {
                              locale: es,
                            })}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  }
                />
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </div>
    </div>
  )
}
