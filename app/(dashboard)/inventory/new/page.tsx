import { InventoryForm } from "@/components/modules/inventory/inventory-form"
import { PageHeader } from "@/components/shared/page-header"

export default function NewInventoryItemPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Nuevo material"
        description="Crea un registro para controlar stock, costo y proveedor."
        breadcrumbs={[
          { label: "Inventario", href: "/inventory" },
          { label: "Nuevo" },
        ]}
      />

      <InventoryForm mode="create" />
    </div>
  )
}
