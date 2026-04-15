import "./globals.css"
import { cn } from "@/lib/utils"
import {
  JetBrains_Mono,
  Plus_Jakarta_Sans,
  Space_Grotesk,
} from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { AppProviders } from "@/components/providers/app-providers"

const appSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-app-sans",
})

const appDisplay = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-app-display",
})

const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-app-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        appSans.variable,
        appDisplay.variable,
        fontMono.variable,
        "font-sans"
      )}
    >
      <body>
        <ThemeProvider>
          <AppProviders>{children}</AppProviders>
        </ThemeProvider>
      </body>
    </html>
  )
}
