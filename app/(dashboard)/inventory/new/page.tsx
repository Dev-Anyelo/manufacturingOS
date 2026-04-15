import { InventoryForm } from "@/components/modules/inventory/inventory-form"
import { PageHeader } from "@/components/shared/page-header"

export default function NewInventoryItemPage() {
  return (
    <section className="flex flex-col min-h-full p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto w-full space-y-6">
        <PageHeader
          title="Nuevo material"
          description="Crea un registro para controlar stock, costo y proveedor."
          breadcrumbs={[
            { label: "Dashboard", href: "/" },
            { label: "Inventario", href: "/inventory" },
            { label: "Nuevo" },
          ]}
        />
        <InventoryForm mode="create" />
      </div>
    </section>
  )
}
