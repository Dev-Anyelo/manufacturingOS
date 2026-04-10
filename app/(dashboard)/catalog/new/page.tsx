import { PageHeader } from "@/components/shared/page-header"
import { CatalogForm } from "@/components/modules/catalog/catalog-form"

export default function NewCatalogItemPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Nuevo producto"
        description="Registra una prenda con precios de mercado y estructura de costos."
        breadcrumbs={[
          { label: "Catalogo", href: "/catalog" },
          { label: "Nuevo" },
        ]}
      />

      <CatalogForm mode="create" />
    </div>
  )
}
