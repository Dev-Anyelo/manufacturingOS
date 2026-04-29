import Link from "next/link"
import { ArrowLeftIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { decimalToNumber } from "@/lib/api/utils"
import { PageHeader } from "@/components/shared/page-header"
import { getExpensesFormBootstrap } from "@/lib/data/expenses"
import { ExpenseForm } from "@/components/modules/expenses/expense-form"

export default async function NewExpensePage() {
  const bootstrap = await getExpensesFormBootstrap()

  return (
    <div className="page-shell">
      <PageHeader
        title="Nuevo gasto"
        description="Registra compras, servicios y egresos operativos del taller."
        breadcrumbs={[
          { label: "Gastos", href: "/expenses" },
          { label: "Nuevo" },
        ]}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/catalog">
              <ArrowLeftIcon className="size-4" />
              Volver
            </Link>
          </Button>
        }
      />

      <div className="page-content">
        <ExpenseForm
          inventoryItems={bootstrap.inventoryItems.map((item) => ({
            id: item.id,
            name: item.name,
            unit: item.unit,
            quantity: decimalToNumber(item.quantity),
          }))}
        />
      </div>
    </div>
  )
}
