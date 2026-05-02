import { getCustomers } from "@/lib/data/customers"
import { PageHeader } from "@/components/shared/page-header"
import { KpiSection } from "@/components/shared/kpi-section"
import { CompactKpiCard } from "@/components/shared/compact-kpi-card"
import { UsersIcon, ShoppingBagIcon, FileTextIcon } from "lucide-react"
import { CustomersTable } from "@/components/modules/customers/customers-table"
import { NewCustomerSheet } from "@/components/modules/customers/new-customer-sheet"

import { requireCurrentUser } from "@/lib/auth/current-user"

export default async function CustomersPage() {
  const [customers, currentUser] = await Promise.all([
    getCustomers(),
    requireCurrentUser()
  ])

  const rows = customers.map((c) => ({
    id: c.id,
    fullName: c.fullName,
    phone: c.phone,
    email: c.email,
    totalPurchases: Number(c.totalPurchases),
    salesCount: c._count.sales,
    workOrdersCount: c._count.workOrders,
  }))

  const stats = {
    totalCustomers: customers.length,
    totalSales: customers.reduce((acc, c) => acc + c._count.sales, 0),
    totalWorkOrders: customers.reduce((acc, c) => acc + c._count.workOrders, 0),
  }

  return (
    <section className="page-shell">
      <div className="page-content space-y-6">
        <PageHeader
          title="Clientes"
          description="Gestiona la información de tus clientes y su historial de compras."
          breadcrumbs={[
            { label: "Dashboard", href: "/" },
            { label: "Clientes" },
          ]}
          actions={<NewCustomerSheet />}
        />

        <KpiSection
          label="Resumen"
          gridClassName="grid grid-cols-2 sm:grid-cols-3 gap-3"
        >
          <CompactKpiCard
            label="Total Clientes"
            value={stats.totalCustomers}
            icon={<UsersIcon />}
            iconClass="bg-blue-500/15 text-blue-600 dark:text-blue-400"
          />
          <CompactKpiCard
            label="Total Ventas"
            value={stats.totalSales}
            icon={<ShoppingBagIcon />}
            iconClass="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
          />
          <CompactKpiCard
            label="Total Órdenes"
            value={stats.totalWorkOrders}
            icon={<FileTextIcon />}
            iconClass="bg-amber-500/15 text-amber-600 dark:text-amber-400"
          />
        </KpiSection>

        <CustomersTable 
          data={rows} 
          canDelete={currentUser.role === "admin" || currentUser.role === "manager"} 
        />
      </div>
    </section>
  )
}
