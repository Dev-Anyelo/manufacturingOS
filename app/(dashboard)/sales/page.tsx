import Link from "next/link"
import { SaleStatus } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { decimalToNumber } from "@/lib/api/utils"
import { StatCard } from "@/components/shared/stat-card"
import { PageHeader } from "@/components/shared/page-header"
import { CurrencyDisplay } from "@/components/shared/currency-display"
import { SalesTable } from "@/components/modules/sales/sales-table"
import { getSales, getTodaySalesSummary } from "@/lib/data/sales"

import {
  DollarSignIcon,
  PlusIcon,
  ReceiptTextIcon,
  WalletCardsIcon,
  XCircleIcon,
} from "lucide-react"

export default async function SalesPage() {
  const [sales, todaySummary] = await Promise.all([
    getSales(),
    getTodaySalesSummary(),
  ])

  const tableRows = sales.map((sale) => ({
    id: sale.id,
    saleDate: sale.saleDate,
    customerName: sale.customer?.fullName ?? "Cliente ocasional",
    channel: sale.channel,
    paymentMethod: sale.paymentMethod,
    total: decimalToNumber(sale.total) - decimalToNumber(sale.discount),
    status: sale.status,
    balanceDue: decimalToNumber(sale.balanceDue),
  }))

  const pendingBalance = tableRows.reduce((acc, row) => acc + row.balanceDue, 0)
  const pendingSalesCount = tableRows.filter((row) => row.balanceDue > 0).length
  const cancelledCount = tableRows.filter(
    (row) => row.status === SaleStatus.cancelled
  ).length

  return (
    <section className="page-shell">
      <div className="page-content space-y-6">
        <PageHeader
          title="Ventas"
          description="Punto de venta y seguimiento de cobros."
          breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Ventas" }]}
          actions={
            <Button
              asChild
              size="default"
              className="min-h-11 w-full gap-2 shadow-sm sm:w-auto sm:min-h-10"
            >
              <Link href="/sales/new">
                <PlusIcon className="size-4 shrink-0" />
                Nueva venta
              </Link>
            </Button>
          }
        />

        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4 xl:gap-6">
          <StatCard
            title="Ventas de hoy"
            value={todaySummary.total_sales}
            description="Transacciones registradas hoy"
            icon={<ReceiptTextIcon className="size-5" />}
            variant={todaySummary.total_sales > 0 ? "success" : "default"}
          />
          <StatCard
            title="Total del día"
            value={
              <CurrencyDisplay amount={todaySummary.total_amount} size="lg" />
            }
            description="Ingreso neto del día"
            icon={<DollarSignIcon className="size-5" />}
            variant={todaySummary.total_amount > 0 ? "success" : "default"}
          />
          <StatCard
            title="Pendientes de cobro"
            value={<CurrencyDisplay amount={pendingBalance} size="lg" />}
            description={`${pendingSalesCount} venta${pendingSalesCount !== 1 ? "s" : ""} con saldo`}
            icon={<WalletCardsIcon className="size-5" />}
            variant={pendingSalesCount > 0 ? "warning" : "default"}
          />
          <StatCard
            title="Canceladas"
            value={cancelledCount}
            description="Ventas canceladas en el historial cargado"
            icon={<XCircleIcon className="size-5" />}
            variant={cancelledCount > 0 ? "danger" : "default"}
          />
        </div>

        <SalesTable sales={tableRows} />
      </div>
    </section>
  )
}
