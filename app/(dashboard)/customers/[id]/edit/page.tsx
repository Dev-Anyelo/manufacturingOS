import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeftIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getCustomer } from "@/lib/data/customers"
import { PageHeader } from "@/components/shared/page-header"
import { CustomerForm } from "@/components/modules/customers/customer-form"

export default async function EditCustomerPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string }
}) {
  const { id } = await params
  const customer = await getCustomer(id)

  if (!customer) notFound()

  return (
    <div className="page-shell">
      <PageHeader
        title={`Editar ${customer.fullName}`}
        description="Actualiza la información del cliente."
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Clientes", href: "/customers" },
          { label: customer.fullName, href: `/customers/${customer.id}` },
          { label: "Editar" },
        ]}
        actions={
          <Button asChild variant="outline" size="sm" className="max-w-fit">
            <Link href={`/customers/${customer.id}`}>
              <ArrowLeftIcon className="size-4" />
              Volver
            </Link>
          </Button>
        }
      />
      <div className="page-content">
        <CustomerForm
          mode="edit"
          customerId={customer.id}
          defaultValues={{
            full_name: customer.fullName,
            phone: customer.phone,
            email: customer.email,
            address: customer.address,
            notes: customer.notes,
          }}
          onSuccess={() => {}}
        />
      </div>
    </div>
  )
}
