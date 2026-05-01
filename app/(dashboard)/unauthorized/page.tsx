import Link from "next/link"
import { ShieldAlertIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function UnauthorizedPage() {
  return (
    <div className="flex flex-1 animate-in flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 p-8 text-center duration-500 zoom-in-95 fade-in">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 ring-8 ring-destructive/5">
        <ShieldAlertIcon className="h-10 w-10 text-destructive" />
      </div>
      <h1 className="text-pretty text-2xl font-bold tracking-tight sm:text-3xl">
        Acceso Denegado
      </h1>
      <p className="mt-4 max-w-sm text-muted-foreground text-pretty">
        No tienes los permisos necesarios para acceder a esta sección. Si crees
        que esto es un error, por favor contacta a un administrador.
      </p>
      <div className="mt-8">
        <Button asChild size="lg" className="rounded-full">
          <Link href="/">Volver al Dashboard</Link>
        </Button>
      </div>
    </div>
  )
}
