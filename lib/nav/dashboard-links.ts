import type { ModuleKey } from "../permissions"

export type DashboardNavItem = {
  title: string
  url: string
  module?: ModuleKey
  items?: { title: string; url: string; module?: ModuleKey }[]
}

export type DashboardNavSection = {
  label: string
  items: DashboardNavItem[]
}

export const dashboardNavSections: DashboardNavSection[] = [
  {
    label: "Principal",
    items: [{ title: "Dashboard", url: "/", module: "dashboard" }],
  },
  {
    label: "Operaciones",
    items: [
      { title: "Ventas", url: "/sales", module: "sales" },
      { title: "Pedidos", url: "/orders", module: "orders" },
      { title: "Producción", url: "/production", module: "production" },
    ],
  },
  {
    label: "Gestión",
    items: [
      { title: "Inventario", url: "/inventory", module: "inventory" },
      { title: "Catálogo", url: "/catalog", module: "catalog" },
      { title: "Gastos", url: "/expenses", module: "expenses" },
      { title: "Clientes", url: "/customers", module: "customers" },
      { title: "Planilla", url: "/payroll", module: "payroll" },
    ],
  },
  {
    label: "Análisis",
    items: [{ title: "Reportes", url: "/reports", module: "reports" }],
  },
  {
    label: "Sistema",
    items: [
      {
        title: "Configuración",
        url: "#",
        module: "settings",
        items: [
          {
            title: "Seguridad y Acceso",
            url: "/settings/users",
            module: "settings",
          },
          {
            title: "Moneda y Tasas",
            url: "/settings/currencies",
            module: "settings",
          },
        ],
      },
    ],
  },
]
