import { ShirtIcon } from "lucide-react"
import { EmptyState } from "@/components/shared/empty-state"
import { PageHeader } from "@/components/shared/page-header"

export default function CatalogPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Catalogo"
        description="Define prendas, precios y estructura de costos."
      />

      <EmptyState
        icon={<ShirtIcon />}
        title="Catalogo vacio"
        description="Agrega tus primeras prendas para vender en POS y pedidos personalizados."
      />
    </div>
  )
}
