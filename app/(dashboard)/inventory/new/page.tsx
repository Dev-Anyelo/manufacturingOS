import { PageHeader } from "@/components/shared/page-header"
import { InventoryForm } from "@/components/modules/inventory/inventory-form"

export default function NewInventoryItemPage() {
  return (
    <section className="page-shell">
      <div className="page-content">
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
