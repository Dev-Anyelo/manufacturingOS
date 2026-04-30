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
          { label: "Dashboard", href: "/" },
          { label: "Gastos", href: "/expenses" },
          { label: "Nuevo gasto" },
        ]}
        actions={
          <Button
            asChild
            variant="outline"
            size="sm"
            className="min-h-10 sm:min-h-9"
          >
            <Link href="/expenses">
              <ArrowLeftIcon className="size-4" />
              Volver
            </Link>
          </Button>
        }
      />

      <div className="page-content space-y-6">
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
