import { 
  CheckCircle2Icon, 
  ScissorsIcon 
} from "lucide-react"

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <main className="flex min-h-svh w-full flex-col lg:grid lg:grid-cols-2">
      {/* Panel de branding (Izquierda) */}
      <div className="relative hidden flex-col justify-between bg-primary p-10 text-primary-foreground lg:flex">
        {/* Decorative background pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,color-mix(in_oklab,var(--color-primary-foreground)_15%,transparent),transparent_50%)]" />
        
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary-foreground/10 shadow-sm backdrop-blur-md">
            <ScissorsIcon className="size-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tight">manufacturingOS</span>
        </div>

        <div className="relative z-10 max-w-md space-y-10">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold leading-tight tracking-tight">
              Control total de tu taller en un solo lugar.
            </h1>
            <p className="text-lg text-primary-foreground/80 leading-relaxed">
              El sistema operativo diseñado específicamente para manufactura textil. 
              Gestiona producción, inventario y ventas con eficiencia enterprise.
            </p>
          </div>

          <div className="space-y-4">
            {[
              "Inventario en tiempo real",
              "Producción y planilla",
              "Pedidos Kanban",
              "Reportes y exportación"
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
                <CheckCircle2Icon className="size-5 text-primary-foreground/70" />
                <span className="text-base font-medium text-primary-foreground/90">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <blockquote className="space-y-2 border-l-2 border-primary-foreground/30 pl-4">
            <p className="text-sm font-medium italic text-primary-foreground/90">
              "El sistema que mantiene tu taller en movimiento."
            </p>
          </blockquote>
        </div>
      </div>

      {/* Panel de formulario (Derecha) */}
      <div className="flex min-h-svh flex-col items-center justify-center bg-background px-4 py-8 sm:px-6 lg:px-8">
        {/* Mobile Header */}
        <div className="mb-8 flex items-center gap-3 lg:hidden">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <ScissorsIcon className="size-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground">manufacturingOS</span>
        </div>
        
        <div className="w-full max-w-md">{children}</div>
      </div>
    </main>
  )
}
