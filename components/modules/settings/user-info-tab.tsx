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

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        {/* Card: Datos Personales */}
        <Card className="shadow-none pt-0">
          <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/30 px-4 py-4">
            <div className="flex items-center gap-2">
              <User className="size-4 text-primary" />
              <CardTitle className="text-sm font-semibold uppercase tracking-tight">
                Datos Personales
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-4 py-4">
            <dl className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
              <div className="space-y-1">
                <dt className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Nombre Completo
                </dt>
                <dd className="text-sm font-medium">
                  {profile.fullName || "—"}
                </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Cédula / DNI
                </dt>
                <dd className="text-sm font-medium">
                  {profile.employee?.documentId || "—"}
                </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Teléfono
                </dt>
                <dd className="text-sm font-medium">{profile.phone || "—"}</dd>
              </div>
              <div className="space-y-1">
                <dt className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Correo Electrónico
                </dt>
                <dd className="text-sm font-medium">{email || "—"}</dd>
              </div>
              <div className="space-y-1">
                <dt className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Fecha de Nacimiento
                </dt>
                <dd className="text-sm font-medium">
                  {profile.birthDate
                    ? format(new Date(profile.birthDate), "PPP", { locale: es })
                    : "—"}
                </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Dirección
                </dt>
                <dd className="text-sm font-medium">
                  {profile.address || "—"}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Card: Información Laboral */}
        <Card className="shadow-none pt-0">
          <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/30 px-4 py-4">
            <div className="flex items-center gap-2">
              <Briefcase className="size-4 text-primary" />
              <CardTitle className="text-sm font-semibold uppercase tracking-tight">
                Información Laboral
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-4 py-4">
            {profile.employee ? (
              <dl className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
                <div className="space-y-1">
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Tipo de Contrato
                  </dt>
                  <dd className="text-sm font-medium">
                    <Badge variant="secondary" className="font-medium">
                      {CONTRACT_LABELS[profile.employee.contractType] ||
                        profile.employee.contractType}
                    </Badge>
                  </dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Salario Base
                  </dt>
                  <dd className="text-sm font-bold text-primary">
                    {profile.employee.baseSalary
                      ? `${Number(profile.employee.baseSalary).toLocaleString("es-NI", { minimumFractionDigits: 2, style: "currency", currency: profile.employee.baseSalaryCurrency || "NIO" })}`
                      : "No definido"}
                  </dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Fecha de Contratación
                  </dt>
                  <dd className="text-sm font-medium">
                    {format(new Date(profile.employee.hireDate), "PPP", {
                      locale: es,
                    })}
                  </dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Estado Empleado
                  </dt>
                  <dd className="text-sm font-medium">
                    <Badge
                      variant="outline"
                      className={
                        profile.employee.isActive
                          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600"
                          : "border-red-500/20 bg-red-500/10 text-red-500"
                      }
                    >
                      {profile.employee.isActive ? "En nómina" : "Baja"}
                    </Badge>
                  </dd>
                </div>

                {profile.employee.contractType === "per_piece" && (
                  <div className="sm:col-span-2">
                    <Separator className="my-2" />
                    <div className="mt-2 space-y-1">
                      <dt className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Producción
                      </dt>
                      <dd className="text-xs text-muted-foreground">
                        Este empleado cobra por pieza confeccionada. Revisa el
                        módulo de producción para ver su rendimiento.
                      </dd>
                    </div>
                  </div>
                )}
              </dl>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Briefcase className="mb-2 size-10 text-muted-foreground/20" />
                <p className="text-sm text-muted-foreground">
                  Sin información laboral
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sistema (Collapsible) */}
      <Collapsible open={systemOpen} onOpenChange={setSystemOpen}>
        <div className="rounded-lg border bg-muted/20">
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="flex w-full items-center justify-between px-4 py-4 hover:bg-transparent"
            >
              <div className="flex items-center gap-2">
                <Settings2 className="size-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">
                  Información Técnica del Sistema
                </span>
              </div>
              <ChevronDown
                className={`size-4 text-muted-foreground transition-transform ${
                  systemOpen ? "rotate-180" : ""
                }`}
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="border-t px-4 py-4">
              <dl className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <div className="space-y-1">
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    ID de Perfil
                  </dt>
                  <dd className="font-mono text-xs text-muted-foreground">
                    {profile.id}
                  </dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Creado el
                  </dt>
                  <dd className="text-xs text-muted-foreground">
                    {format(new Date(profile.createdAt), "PPP p", {
                      locale: es,
                    })}
                  </dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Última Actualización
                  </dt>
                  <dd className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(profile.updatedAt), {
                      addSuffix: true,
                      locale: es,
                    })}
                  </dd>
                </div>
              </dl>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    </div>
  )
}
