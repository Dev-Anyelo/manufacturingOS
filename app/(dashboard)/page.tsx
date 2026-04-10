import Link from "next/link"
import {
  AlertTriangleIcon,
  BoxesIcon,
  ClipboardListIcon,
  HistoryIcon,
  PackageSearchIcon,
  ShoppingCartIcon,
} from "lucide-react"

import { AuditAction } from "@prisma/client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { EmptyState } from "@/components/shared/empty-state"
import { PageHeader } from "@/components/shared/page-header"
import { StatCard } from "@/components/shared/stat-card"
import { StatusBadge } from "@/components/shared/status-badge"
import { decimalToNumber } from "@/lib/api/utils"
import { getDashboardStats } from "@/lib/data/dashboard"
import { prisma } from "@/lib/prisma"

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

type StockStatus = "normal" | "low" | "critical" | "out"

function getStockStatus(quantity: number, minimumStock: number): StockStatus {
  if (quantity <= 0) {
    return "out"
  }

  if (quantity <= minimumStock) {
    return "critical"
  }

  if (quantity <= minimumStock * 2) {
    return "low"
  }

  return "normal"
}

function getAuditActionLabel(action: AuditAction) {
  switch (action) {
    case AuditAction.insert:
      return "Creacion"
    case AuditAction.update:
      return "Actualizacion"
    case AuditAction.delete:
      return "Eliminacion"
    default:
      return action
  }
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("es-PA", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(value)
}

export default async function DashboardPage() {
  const [stats, inventorySnapshot, recentActivity] = await Promise.all([
    getDashboardStats(),
    prisma.inventoryItem.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        quantity: true,
        minimumStock: true,
        unit: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    }),
    prisma.auditLog.findMany({
      take: 5,
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        tableName: true,
        action: true,
        createdAt: true,
      },
    }),
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

      return {
        ...item,
        quantity,
        minimumStock,
        status,
      }
    })
    .filter((item) => item.status === "critical" || item.status === "out")
    .sort((a, b) => a.quantity - b.quantity)
    .slice(0, 5)

  const hasDashboardData =
    inventoryCount > 0 ||
    lowOrCriticalCount > 0 ||
    stats.todaySalesCount > 0 ||
    stats.pendingOrdersCount > 0 ||
    recentActivity.length > 0

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Vista general de inventario, ventas y operaciones del taller."
      />

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
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Materiales en inventario"
              value={inventoryCount}
              description="Registros activos disponibles"
              icon={<BoxesIcon className="size-4" />}
            />
            <StatCard
              title="Stock bajo o critico"
              value={lowOrCriticalCount}
              description="Requieren atencion de reposicion"
              icon={<AlertTriangleIcon className="size-4" />}
              variant={lowOrCriticalCount > 0 ? "warning" : "default"}
            />
            <StatCard
              title="Ventas del dia"
              value={currencyFormatter.format(stats.todaySales)}
              description={`${stats.todaySalesCount} transacciones registradas hoy`}
              icon={<ShoppingCartIcon className="size-4" />}
              variant={stats.todaySales > 0 ? "success" : "default"}
            />
            <StatCard
              title="Pedidos activos"
              value={stats.pendingOrdersCount}
              description="No entregados ni cancelados"
              icon={<ClipboardListIcon className="size-4" />}
            />
          </section>

          <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Card className="border border-border/50 shadow-sm">
              <CardHeader className="border-b border-border/50">
                <CardTitle className="flex items-center gap-2 text-base">
                  <HistoryIcon className="size-4 text-muted-foreground" />
                  Actividad reciente
                </CardTitle>
                <CardDescription>
                  Ultimas 5 operaciones registradas en el sistema.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                {recentActivity.length === 0 ? (
                  <EmptyState
                    icon={HistoryIcon}
                    title="Sin actividad"
                    description="Aun no hay operaciones registradas en audit_log."
                    compact
                  />
                ) : (
                  recentActivity.map((activity) => (
                    <div
                      key={activity.id}
                      className="rounded-lg border border-border/50 bg-muted/20 p-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium">
                          {getAuditActionLabel(activity.action)} en{" "}
                          {activity.tableName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(activity.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="border border-border/50 shadow-sm">
              <CardHeader className="border-b border-border/50">
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertTriangleIcon className="size-4 text-muted-foreground" />
                  Alertas activas
                </CardTitle>
                <CardDescription>
                  Materiales con nivel de stock critico o agotado.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                {criticalAlerts.length === 0 ? (
                  <EmptyState
                    icon={AlertTriangleIcon}
                    title="Sin alertas criticas"
                    description="Todos los materiales se mantienen en niveles aceptables."
                    compact
                  />
                ) : (
                  criticalAlerts.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-muted/20 p-3"
                    >
                      <div>
                        <p className="text-sm font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.quantity} {item.unit} / minimo{" "}
                          {item.minimumStock} {item.unit}
                        </p>
                      </div>
                      <StatusBadge status={item.status} type="stock" />
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </section>
        </>
      )}
    </div>
  )
}
