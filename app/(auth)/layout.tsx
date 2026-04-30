import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Autenticación | manufacturingOS",
  description: "Accede a tu sistema de gestión de manufactura textil",
}

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <main className="relative min-h-svh w-full overflow-x-hidden bg-muted/30">
      {/* Decorative elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]" />
      </div>
      
      <div className="relative z-10 flex min-h-svh items-center justify-center">
        {children}
      </div>
    </main>
  )
}