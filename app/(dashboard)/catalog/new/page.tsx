import { PageHeader } from "@/components/shared/page-header"
import { CatalogForm } from "@/components/modules/catalog/catalog-form"

export default function NewCatalogItemPage() {
  return (
    <div className="page-shell">
      <PageHeader
        title="Nuevo producto"
        description="Agrega un nuevo artículo al catálogo"
        breadcrumbs={[
          { label: "Catalogo", href: "/catalog" },
          { label: "Nuevo" },
        ]}
      />

      <div className="page-content">
        <CatalogForm mode="create" />
      </div>
    </div>
  )
}
