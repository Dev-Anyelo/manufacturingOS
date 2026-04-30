import { PageHeader } from "@/components/shared/page-header"
import { CatalogForm } from "@/components/modules/catalog/catalog-form"

export default function NewCatalogItemPage() {
  return (
    <div className="page-shell">
      <PageHeader
        title="Nuevo producto"
        description="Agrega un nuevo artículo al catálogo"
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Catálogo", href: "/catalog" },
          { label: "Nuevo producto" },
        ]}
      />

      <div className="page-content space-y-6">
        <CatalogForm mode="create" />
      </div>
    </div>
  )
}
