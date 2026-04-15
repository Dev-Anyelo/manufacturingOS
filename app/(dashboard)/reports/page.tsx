import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/shared/empty-state"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import {
  BarChart3Icon,
  BookOpenTextIcon,
  CalendarClockIcon,
  FileBarChart2Icon,
} from "lucide-react"

export default function ReportsPage() {
  return (
    <div className="page-shell">
      <PageHeader
        title="Reportes"
        description="Analiza indicadores diarios, mensuales y rendimiento operativo."
        breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Reportes" }]}
      />

      <div className="page-content">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Card className="border border-border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground">
                Reportes diarios
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-2">
              <CalendarClockIcon className="size-4 text-brand" />
              <p className="text-sm font-semibold">
                Disponibles al cierre diario
              </p>
            </CardContent>
          </Card>
          <Card className="border border-border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground">
                Indicadores KPI
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-2">
              <BarChart3Icon className="size-4 text-blue-600 dark:text-blue-400" />
              <p className="text-sm font-semibold">
                Ventas, costos y productividad
              </p>
            </CardContent>
          </Card>
          <Card className="border border-border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground">
                Exportacion
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-2">
              <FileBarChart2Icon className="size-4 text-amber-600 dark:text-amber-400" />
              <p className="text-sm font-semibold">PDF y formatos tabulares</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border border-border shadow-sm">
          <CardHeader className="border-b border-border pb-3">
            <CardTitle className="text-base">Centro de reportes</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <EmptyState
              icon={<BookOpenTextIcon />}
              title="Sin reportes generados"
              description="Los reportes estaran disponibles en cuanto exista actividad operativa."
            />

            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {[
                "Produccion diaria",
                "Ventas por canal",
                "Margen por producto",
                "Consumo de inventario",
                "Gastos por categoria",
                "Planilla mensual",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-3 py-2"
                >
                  <p className="text-sm">{item}</p>
                  <Badge variant="outline" className="text-xs">
                    Proximamente
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
