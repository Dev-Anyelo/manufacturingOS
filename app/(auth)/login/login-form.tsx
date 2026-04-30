"use client"

import Link from "next/link"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { zodResolver } from "@hookform/resolvers/zod"
import { loginSchema, type LoginInput } from "@/lib/validations/auth"

import {
  KeyRoundIcon,
  Loader2Icon,
  MailIcon,
  AlertCircleIcon,
} from "lucide-react"

const authErrorMap: Record<string, string> = {
  invalid_credentials: "Correo o contraseña incorrectos.",
  email_not_confirmed: "Debes confirmar tu correo antes de iniciar sesión.",
}

export function LoginForm() {
  const [submitError, setSubmitError] = useState<string | null>(null)
  const router = useRouter()

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    })

    if (error) {
      const mappedError = error.code ? authErrorMap[error.code] : undefined
      toast.error(mappedError || "Error al iniciar sesión. Intenta de nuevo.")
      return
    }

    toast.success("¡Bienvenido de nuevo!")
    router.push("/")
  })

  const isSubmitting = form.formState.isSubmitting

  return (
    <div className="w-full">
      {/* Cabecera */}
      <div className="mb-8 space-y-1 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Bienvenido de nuevo
        </h1>
        <p className="text-sm text-muted-foreground">
          Ingresa tus datos para acceder al sistema
        </p>
      </div>

        {/* Formulario */}
        <div>
          <form onSubmit={onSubmit} noValidate className="space-y-5 p-4">
            {/* Campo: correo */}
            <FieldGroup
              label="Correo electrónico"
              htmlFor="email"
              error={form.formState.errors.email?.message}
            >
              <div className="relative">
                <MailIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="tu@correo.com"
                  className={cn(
                    "h-11 pl-9 transition-all",
                    "focus-visible:border-brand/60 focus-visible:ring-brand/40",
                    form.formState.errors.email &&
                      "border-destructive focus-visible:ring-destructive/30"
                  )}
                  {...form.register("email")}
                />
              </div>
            </FieldGroup>

            {/* Campo: contraseña */}
            <FieldGroup
              label="Contraseña"
              htmlFor="password"
              error={form.formState.errors.password?.message}
              action={
                <Link
                  href="/forgot-password"
                  className="text-xs text-muted-foreground underline-offset-2 transition-colors hover:text-primary hover:underline"
                >
                  ¿Olvidaste tu clave?
                </Link>
              }
            >
              <div className="relative">
                <KeyRoundIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className={cn(
                    "h-11 pl-9 transition-all",
                    "focus-visible:border-brand/60 focus-visible:ring-brand/40",
                    form.formState.errors.password &&
                      "border-destructive focus-visible:ring-destructive/30"
                  )}
                  {...form.register("password")}
                />
              </div>
            </FieldGroup>

            {/* Error global de autenticación */}
            {submitError && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/8 px-3.5 py-3 text-sm text-destructive"
              >
                <AlertCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{submitError}</p>
              </div>
            )}

            {/* Botón de envío */}
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2Icon className="h-4 w-4 animate-spin" />
                  Ingresando…
                </span>
              ) : (
                "Ingresar"
              )}
            </Button>
            {/* Links inferiores */}
            <div className="mt-4 text-center text-sm text-muted-foreground">
              ¿No tienes cuenta?{" "}
              <Link href="/register" className="font-medium text-primary hover:underline">
                Contacta al administrador
              </Link>
            </div>
          </form>
        </div>
      </div>
  )
}

/* ─── Componente auxiliar ─────────────────────────────────────────────────── */

interface FieldGroupProps {
  label: string
  htmlFor: string
  error?: string
  action?: React.ReactNode
  children: React.ReactNode
}

function FieldGroup({
  label,
  htmlFor,
  error,
  action,
  children,
}: FieldGroupProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label
          htmlFor={htmlFor}
          className={cn(
            "text-sm font-medium",
            error ? "text-destructive" : "text-foreground"
          )}
        >
          {label}
        </Label>
        {action}
      </div>
      {children}
      {error && (
        <p className="text-xs leading-snug text-destructive">{error}</p>
      )}
    </div>
  )
}
