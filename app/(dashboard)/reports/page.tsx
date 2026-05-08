import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/shared/empty-state"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

import {
  BarChart3Icon,
  BookOpenTextIcon,
  CalendarClockIcon,
  FileBarChart2Icon,
} from "lucide-react"

export default function ReportsPage() {
  const reportBlocks = [
    {
      title: "Operaciones",
      description:
        "Producción diaria, uso de materiales y cumplimiento de entregas.",
      items: [
        "Producción diaria",
        "Consumo de inventario",
        "Pedidos atrasados",
      ],
      tone: "status-info",
    },
    {
      title: "Comercial",
      description: "Desempeño de ventas por canal, ticket y margen.",
      items: ["Ventas por canal", "Top productos", "Margen por producto"],
      tone: "status-brand",
    },
    {
      title: "Finanzas",
      description: "Control de egresos y flujo de planilla por período.",
      items: ["Gastos por categoría", "Planilla mensual", "Balance operativo"],
      tone: "status-warning",
    },
    {
      title: "Asistencia",
      description: "Historial de registros, ausencias y permisos del equipo.",
      items: ["Resumen por empleado", "Reporte de tardanzas", "Permisos"],
      tone: "bg-blue-500/10 text-blue-600 border-blue-500/20",
      active: true,
      href: "/attendance?tab=history",
    },
  ]

  return (
    <div className="page-shell">
      <PageHeader
        title="Reportes"
        description="Analiza indicadores diarios, mensuales y rendimiento operativo."
        breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Reportes" }]}
      />

      <div className="page-content space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Filtra por rango de fechas en cada exportación cuando estén
            disponibles.
          </p>
          <Button size="sm" variant="outline" disabled className="min-h-10">
            Exportar Excel
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
          <Card className="border border-border/70 shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Reportes diarios
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-2">
              <CalendarClockIcon className="size-4 text-primary" />
              <p className="text-sm font-semibold">
                Disponibles al cierre diario
              </p>
            </CardContent>
          </Card>
          <Card className="border border-border/70 shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Indicadores KPI
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-2">
              <BarChart3Icon className="text-info size-4" />
              <p className="text-sm font-semibold">
                Ventas, costos y productividad
              </p>
            </CardContent>
          </Card>
          <Card className="border border-border/70 shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Exportación
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-2">
              <FileBarChart2Icon className="text-warning size-4" />
              <p className="text-sm font-semibold">PDF y formatos tabulares</p>
            </CardContent>
          </Card>
        </div>

        <Separator className="bg-border/70" />

        <Card className="border border-border/70 shadow-card">
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 border-b border-border/70 bg-muted/10 pb-3">
            <CardTitle className="text-base">Centro de reportes</CardTitle>
            <Button size="sm" variant="outline" disabled className="min-h-10">
              Generar reporte
            </Button>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <EmptyState
              icon={<BookOpenTextIcon />}
              title="Sin reportes generados"
              description="Los reportes estarán disponibles en cuanto exista actividad operativa."
            />

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-3 lg:gap-4">
              {reportBlocks.map((block) => (
                <div
                  key={block.title}
                  className="space-y-3 rounded-xl border border-border/70 bg-card/90 p-4 shadow-card"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">{block.title}</p>
                    {block.active ? (
                      <Badge variant="outline" className={block.tone}>
                        Activo
                      </Badge>
                    ) : (
                      <Badge variant="outline" className={block.tone}>
                        Planeado
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-pretty text-muted-foreground">
                    {block.description}
                  </p>
                  <div className="space-y-2">
                    {block.items.map((item) => (
                      <div
                        key={item}
                        className="flex items-center justify-between rounded-md border border-border/60 bg-muted/15 px-2.5 py-2"
                      >
                        <p className="text-xs">{item}</p>
                        {block.active ? (
                          <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                            Disponible
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px]">
                            Próximamente
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                  {block.active && block.href && (
                    <Button variant="outline" size="sm" className="w-full mt-2" asChild>
                      <a href={block.href}>Ir a reporte</a>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
