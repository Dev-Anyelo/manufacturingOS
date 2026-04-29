import { Badge } from "@/components/ui/badge"
import { CheckCircle2Icon, ShieldCheckIcon } from "lucide-react"

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <main className="relative min-h-svh overflow-hidden bg-background">
      <section className="flex min-h-svh items-center justify-center px-4 py-6 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">{children}</div>
      </section>
    </main>
  )
}
