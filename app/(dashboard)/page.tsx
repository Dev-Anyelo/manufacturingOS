import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { AuditAction } from "@prisma/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { decimalToNumber } from "@/lib/api/utils"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { StatCard } from "@/components/shared/stat-card"
import { getDashboardStats } from "@/lib/data/dashboard"
import { EmptyState } from "@/components/shared/empty-state"
import { requireCurrentUser } from "@/lib/auth/current-user"
import { StatusBadge } from "@/components/shared/status-badge"

import {
  AlertTriangleIcon,
  BoxesIcon,
  ChevronRightIcon,
  ClipboardListIcon,
  HistoryIcon,
  PackageSearchIcon,
  ScissorsIcon,
  ShoppingCartIcon,
} from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { PageHeader } from "@/components/shared/page-header"

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

type StockStatus = "normal" | "low" | "critical" | "out"

function getStockStatus(quantity: number, minimumStock: number): StockStatus {
  if (quantity <= 0) return "out"
  if (quantity <= minimumStock) return "critical"
  if (quantity <= minimumStock * 2) return "low"
  return "normal"
}

function getAuditActionLabel(action: AuditAction) {
  switch (action) {
    case AuditAction.insert:
      return "Registro creado"
    case AuditAction.update:
      return "Registro actualizado"
    case AuditAction.delete:
      return "Registro eliminado"
    default:
      return action
  }
}

function getAuditTableLabel(tableName: string) {
  const labels: Record<string, string> = {
    inventory_items: "Inventario",
    work_orders: "Pedidos",
    sales: "Ventas",
    production_sessions: "Produccion",
    employees: "Empleados",
    payroll_payments: "Planilla",
    expenses: "Gastos",
    catalog_items: "Catalogo",
  }
  return labels[tableName] ?? tableName
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("es-PA", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(value)
}

function formatTimeAgo(value: Date) {
  const diff = Date.now() - value.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "Hace un momento"
  if (mins < 60) return `Hace ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `Hace ${hours}h`
  return formatDateTime(value)
}

function getFirstName(fullName: string) {
  return fullName.split(" ")[0] ?? fullName
}

function getSpanishGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return "Buenos dias"
  if (hour < 19) return "Buenas tardes"
  return "Buenas noches"
}

function getFormattedDate() {
  return new Intl.DateTimeFormat("es-PA", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date())
}

export default async function DashboardPage() {
  const [stats, inventorySnapshot, recentActivity, user] = await Promise.all([
    getDashboardStats(),
    prisma.inventoryItem.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        quantity: true,
        minimumStock: true,
        unit: true,
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.auditLog.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        tableName: true,
        action: true,
        createdAt: true,
      },
    }),
    requireCurrentUser(),
  ])

  const inventoryCount = inventorySnapshot.length
  const lowOrCriticalCount = inventorySnapshot.filter((item) => {
    const quantity = decimalToNumber(item.quantity)
    const minimumStock = decimalToNumber(item.minimumStock)
    const status = getStockStatus(quantity, minimumStock)
    return status !== "normal"
  }).length

  const criticalAlerts = inventorySnapshot
    .map((item) => {
      const quantity = decimalToNumber(item.quantity)
      const minimumStock = decimalToNumber(item.minimumStock)
      const status = getStockStatus(quantity, minimumStock)
      return { ...item, quantity, minimumStock, status }
    })
    .filter((item) => item.status === "critical" || item.status === "out")
    .sort((a, b) => a.quantity - b.quantity)
    .slice(0, 6)

  const hasDashboardData =
    inventoryCount > 0 ||
    lowOrCriticalCount > 0 ||
    stats.todaySalesCount > 0 ||
    stats.pendingOrdersCount > 0 ||
    recentActivity.length > 0

  const firstName = getFirstName(user.fullName)
  const greeting = getSpanishGreeting()
  const formattedDate = getFormattedDate()

  return (
    <section className="flex min-h-full flex-col gap-4">
      <div className="mx-auto w-full space-y-4">
        {/* Zone 1: Personalized greeting */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <PageHeader
            title={`${greeting}, ${firstName}`}
            description={formattedDate}
          />
        </div>

        {!hasDashboardData ? (
          <EmptyState
            icon={PackageSearchIcon}
            title="Sin datos operativos aun"
            description="Agrega materiales, ventas o pedidos para ver indicadores del tablero."
            action={
              <Button
                asChild
                size="sm"
                className="bg-brand text-brand-foreground"
              >
                <Link href="/inventory">Ir a inventario</Link>
              </Button>
            }
          />
        ) : (
          <>
            {/* Zone 2: 4 StatCards */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
              <StatCard
                title="Materiales activos"
                value={inventoryCount}
                description="Registros activos disponibles"
                icon={<BoxesIcon className="size-5" />}
                href="/inventory"
              />
              <StatCard
                title="Stock bajo o critico"
                value={lowOrCriticalCount}
                description="Requieren atencion de reposicion"
                icon={<AlertTriangleIcon className="size-5" />}
                variant={lowOrCriticalCount > 0 ? "warning" : "default"}
                href="/inventory"
              />
              <StatCard
                title="Ventas del dia"
                value={currencyFormatter.format(stats.todaySales)}
                description={`${stats.todaySalesCount} transacciones hoy`}
                icon={<ShoppingCartIcon className="size-5" />}
                variant={stats.todaySales > 0 ? "success" : "default"}
                href="/sales"
              />
              <StatCard
                title="Pedidos activos"
                value={stats.pendingOrdersCount}
                description="No entregados ni cancelados"
                icon={<ClipboardListIcon className="size-5" />}
                href="/orders"
              />
            </div>

            {/* Zone 3: Activity Feed (2/3) + Alerts sidebar (1/3) */}
            <div className="grid grid-cols-1 gap-4 sm:gap-5 xl:grid-cols-3">
              {/* Activity feed */}
              <Card className="rounded-xl border border-border/50 shadow-sm xl:col-span-2">
                <CardHeader className="border-b border-border/50 pb-3">
                  <div className="flex items-center gap-2">
                    <HistoryIcon className="size-4 text-muted-foreground" />
                    <CardTitle className="text-base font-semibold">
                      Actividad reciente
                    </CardTitle>
                  </div>
                  <CardDescription className="text-sm">
                    Ultimas operaciones registradas en el sistema.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {recentActivity.length === 0 ? (
                    <div className="p-6">
                      <EmptyState
                        icon={HistoryIcon}
                        title="Sin actividad"
                        description="Aun no hay operaciones registradas."
                        compact
                      />
                    </div>
                  ) : (
                    <ScrollArea className="h-70">
                      <div className="divide-y divide-border/50">
                        {recentActivity.map((activity, index) => (
                          <div
                            key={activity.id}
                            className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/30"
                          >
                            {/* Timeline dot */}
                            <div className="flex shrink-0 flex-col items-center gap-1 pt-0.5">
                              <div
                                className={`h-2 w-2 shrink-0 rounded-full ${
                                  activity.action === AuditAction.insert
                                    ? "bg-brand"
                                    : activity.action === AuditAction.update
                                      ? "bg-blue-500"
                                      : "bg-red-500"
                                }`}
                              />
                              {index < recentActivity.length - 1 ? (
                                <div className="min-h-4 w-px flex-1 bg-border/50" />
                              ) : null}
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="text-sm leading-tight font-medium">
                                {getAuditActionLabel(activity.action)}{" "}
                                <span className="font-normal text-muted-foreground">
                                  en {getAuditTableLabel(activity.tableName)}
                                </span>
                              </p>
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                {formatTimeAgo(activity.createdAt)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>

              {/* Alerts sidebar */}
              <Card className="rounded-xl border border-border/50 shadow-sm">
                <CardHeader className="border-b border-border/50 pb-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangleIcon className="text-warning size-4" />
                    <CardTitle className="text-base font-semibold">
                      Alertas activas
                    </CardTitle>
                  </div>
                  <CardDescription className="text-sm">
                    Materiales con stock critico o agotado.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {criticalAlerts.length === 0 ? (
                    <div className="p-6">
                      <EmptyState
                        icon={AlertTriangleIcon}
                        title="Sin alertas criticas"
                        description="Todos los materiales en niveles aceptables."
                        compact
                      />
                    </div>
                  ) : (
                    <ScrollArea className="h-70">
                      <div className="divide-y divide-border/50">
                        {criticalAlerts.map((item) => (
                          <Link
                            key={item.id}
                            href={`/inventory/${item.id}`}
                            className="group flex items-center justify-between gap-2 px-4 py-2.5 transition-colors hover:bg-muted/40"
                          >
                            <div className="flex min-w-0 items-center gap-2">
                              <span
                                className={`h-2 w-2 shrink-0 rounded-full ${
                                  item.status === "out"
                                    ? "bg-muted-foreground"
                                    : "bg-red-500"
                                }`}
                              />
                              <div className="min-w-0">
                                <p className="truncate text-xs font-medium transition-colors group-hover:text-brand">
                                  {item.name}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                  {item.quantity} / min {item.minimumStock}{" "}
                                  {item.unit}
                                </p>
                              </div>
                            </div>
                            <div className="flex shrink-0 items-center gap-1.5">
                              <StatusBadge status={item.status} type="stock" />
                              <ChevronRightIcon className="size-3 text-muted-foreground/40 transition-colors group-hover:text-muted-foreground" />
                            </div>
                          </Link>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                  <div className="border-t border-border/50 px-4 py-2.5">
                    <Link
                      href="/inventory"
                      className="flex items-center justify-center gap-1 text-xs font-medium text-brand transition-colors hover:text-brand/80"
                    >
                      Ver todo el inventario
                      <ChevronRightIcon className="size-3" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Zone 4: Quick stats row */}
            <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2">
              {/* Production today */}
              <Card className="rounded-xl border border-border/50 shadow-sm">
                <CardHeader className="border-b border-border/50 pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ScissorsIcon className="size-4 text-muted-foreground" />
                      <CardTitle className="text-base font-semibold">
                        Accesos rapidos
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      {
                        label: "Nueva venta",
                        href: "/sales/new",
                        color: "bg-brand-muted text-brand",
                      },
                      {
                        label: "Nuevo pedido",
                        href: "/orders/new",
                        color:
                          "bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400",
                      },
                      {
                        label: "Nueva sesion",
                        href: "/production/new",
                        color:
                          "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400",
                      },
                      {
                        label: "Nuevo gasto",
                        href: "/expenses/new",
                        color:
                          "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-500",
                      },
                      {
                        label: "Nuevo material",
                        href: "/inventory/new",
                        color: "bg-muted text-muted-foreground",
                      },
                      {
                        label: "Nuevo producto",
                        href: "/catalog/new",
                        color: "bg-muted text-muted-foreground",
                      },
                    ].map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center justify-center rounded-lg px-3 py-2.5 text-xs font-medium transition-all hover:scale-[1.01] hover:shadow-sm ${item.color}`}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* System summary */}
              <Card className="rounded-xl border border-border/50 shadow-sm">
                <CardHeader className="border-b border-border/50 pb-3">
                  <CardTitle className="text-base font-semibold">
                    Resumen del sistema
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Metricas de operacion generales.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 pt-4">
                  {[
                    {
                      label: "Materiales en inventario",
                      value: inventoryCount,
                      href: "/inventory",
                    },
                    {
                      label: "Pedidos activos",
                      value: stats.pendingOrdersCount,
                      href: "/orders",
                    },
                    {
                      label: "Ventas registradas hoy",
                      value: stats.todaySalesCount,
                      href: "/sales",
                    },
                    {
                      label: "Materiales con alerta",
                      value: lowOrCriticalCount,
                      href: "/inventory",
                    },
                  ].map((row) => (
                    <Link
                      key={row.label}
                      href={row.href}
                      className="group -mx-2 flex items-center justify-between rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/40"
                    >
                      <span className="text-sm text-muted-foreground transition-colors group-hover:text-foreground">
                        {row.label}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold tabular-nums">
                          {row.value}
                        </span>
                        <ChevronRightIcon className="size-3.5 text-muted-foreground/40 transition-colors group-hover:text-muted-foreground" />
                      </div>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
