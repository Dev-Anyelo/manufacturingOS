import { Badge } from "@/components/ui/badge"
import { CheckCircle2Icon, ShieldCheckIcon } from "lucide-react"

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <main className="relative min-h-svh overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(52,178,123,0.18),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.12),transparent_40%)]" />

      <div className="relative mx-auto grid min-h-svh w-full max-w-7xl grid-cols-1 px-4 py-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8 lg:px-6 lg:py-10">
        <section className="hidden rounded-2xl border border-border/60 bg-card/70 p-8 backdrop-blur-sm lg:flex lg:flex-col lg:justify-between">
          <div className="space-y-4">
            <Badge
              variant="outline"
              className="bg-brand-muted border-brand/30 text-brand"
            >
              Plataforma ERP
            </Badge>
            <h1 className="max-w-md text-3xl leading-tight font-bold tracking-tight">
              Control total de inventario, produccion y ventas en un solo lugar.
            </h1>
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
              Accede a manufacturingOS para gestionar pedidos, costos, planilla
              y operaciones del taller en tiempo real.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/20 p-4">
              <ShieldCheckIcon className="mt-0.5 size-4 text-brand" />
              <div className="space-y-1">
                <p className="text-sm font-semibold">Acceso seguro por roles</p>
                <p className="text-xs text-muted-foreground">
                  Permisos segmentados para administracion, gerencia y equipo
                  operativo.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/20 p-4">
              <CheckCircle2Icon className="mt-0.5 size-4 text-brand" />
              <div className="space-y-1">
                <p className="text-sm font-semibold">Operacion continua</p>
                <p className="text-xs text-muted-foreground">
                  Visualiza datos clave y reacciona rapido a eventos de
                  produccion, ventas y stock.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center py-4 lg:py-0">
          <div className="w-full max-w-md">{children}</div>
        </section>
      </div>
    </main>
  )
}
