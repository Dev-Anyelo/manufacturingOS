import { UserRole } from "@/types"

export type DashboardNavItem = {
  title: string
  url: string
  adminOnly?: boolean
}

export type DashboardNavSection = {
  label: string
  items: DashboardNavItem[]
}

export const dashboardNavSections: DashboardNavSection[] = [
  {
    label: "Principal",
    items: [{ title: "Dashboard", url: "/" }],
  },
  {
    label: "Operaciones",
    items: [
      { title: "Ventas", url: "/sales" },
      { title: "Pedidos", url: "/orders" },
      { title: "Producción", url: "/production" },
    ],
  },
  {
    label: "Gestión",
    items: [
      { title: "Inventario", url: "/inventory" },
      { title: "Catálogo", url: "/catalog" },
      { title: "Gastos", url: "/expenses" },
      { title: "Clientes", url: "/customers" },
      { title: "Planilla", url: "/payroll" },
    ],
  },
  {
    label: "Análisis",
    items: [{ title: "Reportes", url: "/reports" }],
  },
  {
    label: "Sistema",
    items: [{ title: "Configuración", url: "/settings", adminOnly: true }],
  },
]

export function filterDashboardNavForRole(
  sections: DashboardNavSection[],
  role: UserRole
): DashboardNavSection[] {
  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (!item.adminOnly) return true
        return role === UserRole.Admin
      }),
    }))
    .filter((section) => section.items.length > 0)
}
