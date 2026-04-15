import { notFound } from "next/navigation"
import { MaterialCategory } from "@/types"
import { getInventoryItem } from "@/lib/data/inventory"
import { PageHeader } from "@/components/shared/page-header"
import { InventoryForm } from "@/components/modules/inventory/inventory-form"

type EditInventoryItemPageProps = {
  params: Promise<{ id: string }> | { id: string }
}

export default async function EditInventoryItemPage({
  params,
}: EditInventoryItemPageProps) {
  const { id } = await params
  const item = await getInventoryItem(id)

  if (!item || !item.isActive) {
    notFound()
  }

  return (
    <section className="page-shell">
      <div className="page-content">
        <PageHeader
          title={`Editar: ${item.name}`}
          description="Actualiza datos generales, stock base y proveedor."
          breadcrumbs={[
            { label: "Dashboard", href: "/" },
            { label: "Inventario", href: "/inventory" },
            { label: item.name, href: `/inventory/${item.id}` },
            { label: "Editar" },
          ]}
        />

        <InventoryForm
          mode="edit"
          itemId={item.id}
          defaultValues={{
            name: item.name,
            category: item.category as MaterialCategory,
            fabric_type: item.fabricType,
            color: item.color,
            quantity: Number(item.quantity),
            unit: item.unit,
            unit_price: Number(item.unitPrice),
            minimum_stock: Number(item.minimumStock),
            supplier: item.supplier,
            notes: item.notes,
            image_url: item.imageUrl,
            is_active: item.isActive,
          }}
        />
      </div>
    </section>
  )
}
