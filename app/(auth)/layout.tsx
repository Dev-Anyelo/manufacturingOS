import { Badge } from "@/components/ui/badge"
import { CheckCircle2Icon, ShieldCheckIcon } from "lucide-react"

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <main className="relative min-h-svh overflow-hidden bg-background">
      <section className="flex items-center justify-center py-4 lg:py-0">
        <div className="w-full max-w-md">{children}</div>
      </section>
    </main>
  )
}
