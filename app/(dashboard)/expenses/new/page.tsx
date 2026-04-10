import { PageHeader } from "@/components/shared/page-header"
import { decimalToNumber } from "@/lib/api/utils"
import { getExpensesFormBootstrap } from "@/lib/data/expenses"
import { ExpenseForm } from "@/components/modules/expenses/expense-form"

export default async function NewExpensePage() {
  const bootstrap = await getExpensesFormBootstrap()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nuevo gasto"
        description="Registra compras, servicios y egresos operativos del taller."
        breadcrumbs={[
          { label: "Gastos", href: "/expenses" },
          { label: "Nuevo" },
        ]}
      />

      <ExpenseForm
        inventoryItems={bootstrap.inventoryItems.map((item) => ({
          id: item.id,
          name: item.name,
          unit: item.unit,
          quantity: decimalToNumber(item.quantity),
        }))}
      />
    </div>
  )
}
