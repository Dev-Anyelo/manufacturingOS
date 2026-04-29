import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
  const reportBlocks = [
    {
      title: "Operaciones",
      description:
        "Produccion diaria, uso de materiales y cumplimiento de entregas.",
      items: [
        "Produccion diaria",
        "Consumo de inventario",
        "Pedidos atrasados",
      ],
      tone: "status-info",
    },
    {
      title: "Comercial",
      description: "Desempeno de ventas por canal, ticket y margen.",
      items: ["Ventas por canal", "Top productos", "Margen por producto"],
      tone: "status-brand",
    },
    {
      title: "Finanzas",
      description: "Control de egresos y flujo de planilla por periodo.",
      items: ["Gastos por categoria", "Planilla mensual", "Balance operativo"],
      tone: "status-warning",
    },
  ]

  return (
    <div className="page-shell">
      <PageHeader
        title="Reportes"
        description="Analiza indicadores diarios, mensuales y rendimiento operativo."
        breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Reportes" }]}
      />

      <div className="page-content">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Card className="border border-border/70 shadow-card">
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
          <Card className="border border-border/70 shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground">
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
              <CardTitle className="text-xs text-muted-foreground">
                Exportacion
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-2">
              <FileBarChart2Icon className="text-warning size-4" />
              <p className="text-sm font-semibold">PDF y formatos tabulares</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border border-border/70 shadow-card">
          <CardHeader className="flex flex-row items-center justify-between gap-2 border-b border-border/70 bg-muted/10 pb-3">
            <CardTitle className="text-base">Centro de reportes</CardTitle>
            <Button size="sm" variant="outline" disabled>
              Generar reporte
            </Button>
          </CardHeader>
          <CardContent className="pt-4">
            <EmptyState
              icon={<BookOpenTextIcon />}
              title="Sin reportes generados"
              description="Los reportes estaran disponibles en cuanto exista actividad operativa."
            />

            <div className="mt-4 grid grid-cols-1 gap-2 lg:grid-cols-3">
              {reportBlocks.map((block) => (
                <div
                  key={block.title}
                  className="space-y-2 rounded-lg border border-border/70 bg-card/90 p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">{block.title}</p>
                    <Badge className={block.tone}>Planeado</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {block.description}
                  </p>
                  <div className="space-y-1.5">
                    {block.items.map((item) => (
                      <div
                        key={item}
                        className="flex items-center justify-between rounded-md border border-border/60 bg-muted/15 px-2.5 py-1.5"
                      >
                        <p className="text-xs">{item}</p>
                        <Badge variant="outline" className="text-[10px]">
                          Proximamente
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function MiniStat({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <div className="rounded-lg border border-border/70 bg-card/85 px-3 py-2">
      <p className="text-[11px] tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold">
        <Icon className="size-3.5 text-brand" />
        {value}
      </p>
    </div>
  )
}
