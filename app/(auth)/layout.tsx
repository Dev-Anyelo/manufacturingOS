import { Badge } from "@/components/ui/badge"
import { CheckCircle2Icon, ShieldCheckIcon } from "lucide-react"

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <main className="relative min-h-svh overflow-hidden bg-background">
      <div
        aria-hidden
        className="auth-atmosphere pointer-events-none absolute inset-0"
      />
      <div className="relative mx-auto grid min-h-svh w-full max-w-7xl grid-cols-1 px-4 py-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8 lg:px-6 lg:py-10">
        <section className="hidden rounded-2xl border border-border bg-card/70 p-8 shadow-card backdrop-blur-sm lg:flex lg:flex-col lg:justify-between">
          <div className="space-y-4">
            <Badge
              variant="outline"
              className="border-brand/30 bg-brand/10 text-brand"
            >
              Plataforma ERP
            </Badge>
            <h1 className="max-w-md text-3xl leading-tight font-bold tracking-tight text-foreground">
              Control total de inventario, produccion y ventas en un solo lugar.
            </h1>
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
              Accede a manufacturingOS para gestionar pedidos, costos, planilla
              y operaciones del taller en tiempo real.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/20 p-4">
              <ShieldCheckIcon className="mt-0.5 size-4 text-brand" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  Acceso seguro por roles
                </p>
                <p className="text-xs text-muted-foreground">
                  Permisos segmentados para administracion, gerencia y equipo
                  operativo.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/20 p-4">
              <CheckCircle2Icon className="mt-0.5 size-4 text-brand" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  Operacion continua
                </p>
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
