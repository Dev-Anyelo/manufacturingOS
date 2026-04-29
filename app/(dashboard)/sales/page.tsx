import Link from "next/link"
import { Button } from "@/components/ui/button"
import { decimalToNumber } from "@/lib/api/utils"
import { StatCard } from "@/components/shared/stat-card"
import { PageHeader } from "@/components/shared/page-header"
import { SalesTable } from "@/components/modules/sales/sales-table"
import { getSales, getTodaySalesSummary } from "@/lib/data/sales"

import {
  DollarSignIcon,
  PlusIcon,
  ReceiptTextIcon,
  WalletCardsIcon,
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

  return (
    <section className="page-shell">
      <div className="page-content">
        <PageHeader
          title="Ventas"
          description="Punto de venta y seguimiento de cobros."
          breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Ventas" }]}
          eyebrow="Comercial"
          actions={
            <Button asChild size="sm">
              <Link href="/sales/new">
                <PlusIcon className="size-4" />
                Nueva venta
              </Link>
            </Button>
          }
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Ventas de hoy"
            value={todaySummary.total_sales}
            description="Transacciones registradas hoy"
            icon={<ReceiptTextIcon className="size-4" />}
            variant="success"
          />
          <StatCard
            title="Ingreso de hoy"
            value={`$${todaySummary.total_amount.toFixed(2)}`}
            description="Neto del dia"
            icon={<DollarSignIcon className="size-4" />}
            variant="success"
          />
          <StatCard
            title="Con saldo pendiente"
            value={pendingSalesCount}
            description="Ventas por cobrar"
            icon={<WalletCardsIcon className="size-4" />}
            variant={pendingSalesCount > 0 ? "warning" : "default"}
          />
          <StatCard
            title="Saldo por cobrar"
            value={`$${pendingBalance.toFixed(2)}`}
            description="Pendiente por recuperar"
            icon={<WalletCardsIcon className="size-4" />}
            variant={pendingBalance > 0 ? "warning" : "default"}
          />
        </div>

        <SalesTable sales={tableRows} />
      </div>
    </section>
  )
}
