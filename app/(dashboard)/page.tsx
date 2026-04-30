import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { AuditAction } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { decimalToNumber } from "@/lib/api/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { StatCard } from "@/components/shared/stat-card"
import {
  getDashboardStats,
  getDashboardUrgentOrders,
} from "@/lib/data/dashboard"
import { EmptyState } from "@/components/shared/empty-state"
import { PageHeader } from "@/components/shared/page-header"
import { requireCurrentUser } from "@/lib/auth/current-user"
import { StatusBadge } from "@/components/shared/status-badge"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import {
  formatCurrency,
  formatDate,
  formatDateRelative,
} from "@/lib/utils"

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
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

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
    production_sessions: "Producción",
    employees: "Empleados",
    payroll_payments: "Planilla",
    expenses: "Gastos",
    catalog_items: "Catálogo",
  }
  return labels[tableName] ?? tableName
}

function getSpanishGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return "Buenos días"
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

function pctVersusYesterday(current: number, previous: number) {
  if (previous > 0) {
    const raw =
      Math.round(((current - previous) / previous) * 1000) / 10
    return {
      value: Math.abs(raw),
      isPositive: current >= previous,
      label: "vs ayer",
    }
  }
  if (previous === 0 && current > 0) {
    return { value: 100, isPositive: true, label: "vs ayer" }
  }
  return undefined
}

function isDeliveryPast(iso: string) {
  const d = new Date(iso)
  d.setHours(0, 0, 0, 0)
  const t = new Date()
  t.setHours(0, 0, 0, 0)
  return d < t
}

function progressIndicatorStock(status: StockStatus) {
  if (status === "out" || status === "critical")
    return "bg-red-500 dark:bg-red-500"
  if (status === "low") return "bg-amber-500 dark:bg-amber-500"
  return "bg-emerald-500 dark:bg-emerald-500"
}

function stockBarValue(quantity: number, minimumStock: number) {
  if (minimumStock <= 0) return quantity > 0 ? 85 : 0
  return Math.min(100, (quantity / (minimumStock * 2)) * 100)
}

export default async function DashboardPage() {
  const [stats, inventorySnapshot, recentActivity, user, urgentOrders] =
    await Promise.all([
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
    getDashboardUrgentOrders(8),
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
    urgentOrders.length > 0 ||
    recentActivity.length > 0

  const salesTrend = pctVersusYesterday(
    stats.todaySales,
    stats.yesterdaySales
  )
  const garmentsTrend = pctVersusYesterday(
    stats.todayGarments,
    stats.yesterdayGarments
  )

  const firstName = user.fullName
  const greeting = getSpanishGreeting()
  const formattedDate = getFormattedDate()

  return (
    <section className="page-shell">
      <div className="page-content space-y-6">
        {/* Zone 1: Personalized greeting */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <PageHeader
            title={`${greeting}, ${firstName}`}
            description={
              <>
                <span className="block capitalize">{formattedDate}</span>
                <span className="mt-1 block text-sm text-muted-foreground">
                  {stats.todaySalesCount} ventas hoy ·{" "}
                  {stats.pendingOrdersCount} pedidos activos ·{" "}
                  {stats.todayGarments} prendas producidas
                </span>
              </>
            }
          />
        </div>

        {!hasDashboardData ? (
          <EmptyState
            icon={<PackageSearchIcon />}
            title="Sin datos operativos aún"
            description="Agrega materiales, ventas o pedidos para ver indicadores del tablero."
            action={
              <Button asChild size="sm">
                <Link href="/inventory">Ir a inventario</Link>
              </Button>
            }
          />
        ) : (
          <>
            {/* Zone 2: KPI principal */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4 xl:gap-6">
              <StatCard
                title="Ventas hoy"
                value={formatCurrency(stats.todaySales)}
                description={`${stats.todaySalesCount} transacciones`}
                icon={<ShoppingCartIcon className="size-5" />}
                variant={stats.todaySales > 0 ? "success" : "default"}
                trend={salesTrend}
                href="/sales"
              />
              <StatCard
                title="Pedidos activos"
                value={stats.pendingOrdersCount}
                description="No entregados ni cancelados"
                icon={<ClipboardListIcon className="size-5" />}
                variant={stats.pendingOrdersCount > 0 ? "info" : "default"}
                href="/orders"
              />
              <StatCard
                title="Prendas producidas hoy"
                value={stats.todayGarments}
                description="Total de prendas registradas"
                icon={<ScissorsIcon className="size-5" />}
                variant={stats.todayGarments > 0 ? "success" : "default"}
                trend={garmentsTrend}
                href="/production"
              />
              <StatCard
                title="Alertas de inventario"
                value={lowOrCriticalCount}
                description={`${inventoryCount} materiales activos`}
                icon={<BoxesIcon className="size-5" />}
                variant={lowOrCriticalCount > 0 ? "danger" : "success"}
                href="/inventory"
              />
            </div>

            {urgentOrders.length > 0 ? (
              <Card className="rounded-xl border border-border overflow-hidden">
                <CardHeader className="border-b border-border pb-3">
                  <div className="flex items-center gap-2">
                    <ClipboardListIcon className="size-4 text-muted-foreground" />
                    <CardTitle className="text-base font-semibold">
                      Pedidos urgentes
                    </CardTitle>
                  </div>
                  <CardDescription className="text-sm">
                    Próximos a vencer o con fecha de entrega pasada.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead>Cliente</TableHead>
                          <TableHead>Fecha entrega</TableHead>
                          <TableHead className="text-right">Prendas</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead className="w-14" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {urgentOrders.map((o) => {
                          const overdue = isDeliveryPast(o.deliveryDate)
                          return (
                            <TableRow
                              key={o.id}
                              className="border-border/55 hover:bg-muted/50"
                            >
                              <TableCell className="font-medium">
                                <div className="flex flex-col gap-1">
                                  <span className="truncate max-w-48">
                                    {o.customerName}
                                  </span>
                                  <span className="font-mono text-xs text-muted-foreground">
                                    #{o.id.slice(0, 8).toUpperCase()}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-sm whitespace-nowrap">
                                {formatDate(o.deliveryDate)}
                              </TableCell>
                              <TableCell className="text-right font-bold tabular-nums">
                                {o.garmentCount}
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-2">
                                  {overdue ? (
                                    <Badge
                                      variant="destructive"
                                      className="animate-pulse text-[10px] font-bold tracking-widest uppercase"
                                    >
                                      ATRASADO
                                    </Badge>
                                  ) : null}
                                  <StatusBadge
                                    status={o.status}
                                    type="work-order"
                                  />
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="sm" asChild>
                                  <Link href={`/orders/${o.id}`}>
                                    <ChevronRightIcon className="size-4" />
                                  </Link>
                                </Button>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {/* Zone Chart */}
            <div className="w-full xl:col-span-3">
              <ChartAreaInteractive />
            </div>

            {/* Zone 3: Activity Feed (2/3) + Alerts sidebar (1/3) */}
            <div className="grid grid-cols-1 gap-4 sm:gap-5 xl:grid-cols-3">
              {/* Activity feed */}
              <Card className="rounded-xl border border-border xl:col-span-2">
                <CardHeader className="border-b border-border pb-3">
                  <div className="flex items-center gap-2">
                    <HistoryIcon className="size-4 text-muted-foreground" />
                    <CardTitle className="text-base font-semibold">
                      Actividad reciente
                    </CardTitle>
                  </div>
                  <CardDescription className="text-sm">
                    Últimas operaciones registradas en el sistema.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {recentActivity.length === 0 ? (
                    <div className="p-6">
                      <EmptyState
                        icon={<HistoryIcon />}
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
                                    ? "bg-success"
                                    : activity.action === AuditAction.update
                                      ? "bg-info"
                                      : "bg-danger"
                                }`}
                              />
                              {index < recentActivity.length - 1 ? (
                                <div className="min-h-4 w-px flex-1 bg-border" />
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
                                {formatDateRelative(activity.createdAt)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>

              {/* Stock crítico */}
              <Card className="rounded-xl border border-border">
                <CardHeader className="border-b border-border pb-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangleIcon className="size-4 text-red-500" />
                    <CardTitle className="text-base font-semibold">
                      Stock crítico
                    </CardTitle>
                  </div>
                  <CardDescription className="text-sm">
                    Materiales con stock crítico o agotado. Ajusta desde el detalle.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {criticalAlerts.length === 0 ? (
                    <div className="p-6">
                      <EmptyState
                        icon={<AlertTriangleIcon />}
                        title="Sin alertas críticas"
                        description="Todos los materiales en niveles aceptables."
                        compact
                      />
                    </div>
                  ) : (
                    <ScrollArea className="h-70">
                      <div className="divide-y divide-border/50">
                        {criticalAlerts.map((item) => (
                          <div
                            key={item.id}
                            className="flex flex-col gap-2 px-4 py-3 transition-colors hover:bg-muted/40"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <Link
                                  href={`/inventory/${item.id}`}
                                  className="truncate text-xs font-medium text-foreground hover:text-primary hover:underline"
                                >
                                  {item.name}
                                </Link>
                                <p className="mt-0.5 text-[10px] tabular-nums text-muted-foreground">
                                  <span className="font-bold text-foreground">
                                    {item.quantity}
                                  </span>{" "}
                                  / min {item.minimumStock} {item.unit}
                                </p>
                              </div>
                              <StatusBadge
                                status={item.status}
                                type="stock"
                              />
                            </div>
                            <Progress
                              value={stockBarValue(
                                item.quantity,
                                item.minimumStock
                              )}
                              className="h-2"
                              indicatorClassName={progressIndicatorStock(
                                item.status
                              )}
                            />
                            <div className="flex justify-end">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs"
                                asChild
                              >
                                <Link href={`/inventory/${item.id}`}>
                                  Ajustar
                                </Link>
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                  <div className="border-t border-border px-4 py-2.5">
                    <Link
                      href="/inventory"
                      className="flex items-center justify-center gap-1 text-xs font-medium text-primary transition-colors hover:text-primary/90"
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
              <Card className="rounded-xl border border-border">
                <CardHeader className="border-b border-border pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ScissorsIcon className="size-4 text-muted-foreground" />
                      <CardTitle className="text-base font-semibold">
                        Accesos rápidos
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {[
                      {
                        label: "Nueva venta",
                        href: "/sales/new",
                        color: "bg-success-soft text-success",
                      },
                      {
                        label: "Nuevo pedido",
                        href: "/orders/new",
                        color: "bg-info-soft text-info",
                      },
                      {
                        label: "Nueva sesión",
                        href: "/production/new",
                        color: "bg-warning-soft text-warning",
                      },
                      {
                        label: "Nuevo gasto",
                        href: "/expenses/new",
                        color: "bg-danger-soft text-danger",
                      },
                      {
                        label: "Nuevo material",
                        href: "/inventory/new",
                        color: "bg-muted/20 text-foreground",
                      },
                      {
                        label: "Nuevo producto",
                        href: "/catalog/new",
                        color: "bg-muted/20 text-foreground",
                      },
                    ].map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center justify-center rounded-lg px-3 py-2.5 text-xs font-medium transition-all hover:scale-[1.01] ${item.color}`}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* System summary */}
              <Card className="rounded-xl border border-border">
                <CardHeader className="border-b border-border pb-3">
                  <CardTitle className="text-base font-semibold">
                    Resumen del sistema
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Métricas de operación generales.
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
                      className="group -mx-2 flex items-center justify-between rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/30"
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
