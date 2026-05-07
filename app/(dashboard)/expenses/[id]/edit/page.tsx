import { notFound } from "next/navigation"
import { getExpenseById } from "@/lib/data/expenses"
import { getInventoryItems } from "@/lib/data/inventory"
import { PageHeader } from "@/components/shared/page-header"
import { ExpenseForm } from "@/components/modules/expenses/expense-form"
import { Currency, ExpenseCategory } from "@prisma/client"
import { decimalToNumber } from "@/lib/api/utils"

export default async function EditExpensePage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string }
}) {
  const { id } = await params
  const [expense, items] = await Promise.all([
    getExpenseById(id),
    getInventoryItems(),
  ])

  if (!expense) notFound()

  const inventoryItems = items.map((i) => ({
    id: i.id,
    name: i.name,
    unit: i.unit,
    quantity: decimalToNumber(i.quantity),
  }))

  return (
    <div className="page-shell">
      <PageHeader
        title="Editar gasto"
        description="Actualiza la información de este gasto."
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Gastos", href: "/expenses" },
          { label: expense.concept, href: `/expenses/${expense.id}` },
          { label: "Editar" },
        ]}
      />
      <div className="page-content">
        <ExpenseForm
          inventoryItems={inventoryItems}
          itemId={expense.id}
          defaultValues={{
            expense_date: expense.expenseDate.toISOString().split("T")[0],
            category: expense.category as ExpenseCategory,
            concept: expense.concept,
            supplier: expense.supplier,
            quantity: expense.quantity ? decimalToNumber(expense.quantity) : null,
            unit_price: expense.unitPrice ? decimalToNumber(expense.unitPrice) : null,
            unit_price_currency: expense.unitPriceCurrency as Currency,
            total: decimalToNumber(expense.total),
            total_currency: expense.totalCurrency as Currency,
            updates_inventory: expense.updatesInventory,
            inventory_item_id: expense.inventoryItemId,
            inventory_quantity_added: expense.inventoryQuantityAdded ? decimalToNumber(expense.inventoryQuantityAdded) : null,
            notes: expense.notes,
            receipt_url: expense.receiptUrl,
          }}
        />
      </div>
    </div>
  )
}
