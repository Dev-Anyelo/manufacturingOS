"use client"

import Link from "next/link"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { Loader2Icon, ShieldCheckIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { zodResolver } from "@hookform/resolvers/zod"
import { loginSchema, type LoginInput } from "@/lib/validations/auth"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const authErrorMap: Record<string, string> = {
  invalid_credentials: "Correo o contrasena incorrectos.",
  email_not_confirmed: "Debes confirmar tu correo antes de iniciar sesion.",
}

export function LoginForm() {
  const [submitError, setSubmitError] = useState<string | null>(null)
  const router = useRouter()

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
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
      setSubmitError(
        mappedError ?? "No se pudo iniciar sesion. Intenta nuevamente."
      )
      return
    }

    router.push("/")
  })

  return (
    <Card className="overflow-hidden border border-border/60 bg-card/90 shadow-sm backdrop-blur-sm">
      <CardHeader className="space-y-3 border-b border-border/60">
        <div className="bg-brand-muted inline-flex w-fit items-center gap-2 rounded-lg border border-brand/30 px-2.5 py-1 text-xs font-medium text-brand">
          <ShieldCheckIcon className="size-3.5" />
          Acceso seguro
        </div>
        <div className="space-y-1">
          <CardTitle className="text-xl">Iniciar sesion</CardTitle>
          <p className="text-sm text-muted-foreground">
            Ingresa con tu usuario para acceder al panel operativo del taller.
          </p>
        </div>
      </CardHeader>
      <form onSubmit={onSubmit} noValidate>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2 rounded-lg border border-border/60 bg-muted/15 p-3">
            <Label htmlFor="email">Correo electronico</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              {...form.register("email")}
            />
            {form.formState.errors.email ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.email.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2 rounded-lg border border-border/60 bg-muted/15 p-3">
            <Label htmlFor="password">Contrasena</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              {...form.register("password")}
            />
            {form.formState.errors.password ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.password.message}
              </p>
            ) : null}
          </div>

          {submitError ? (
            <Alert variant="destructive">
              <AlertTitle>No se pudo iniciar sesion</AlertTitle>
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          ) : null}

          <div className="flex items-center justify-between gap-2 text-xs">
            <p className="text-muted-foreground">¿No recuerdas tu clave?</p>
            <Link
              href="/forgot-password"
              className="font-medium text-primary underline-offset-2 hover:underline"
            >
              Recuperar acceso
            </Link>
          </div>
        </CardContent>

        <CardFooter className="border-t border-border/60 bg-muted/10">
          <Button
            type="submit"
            className="w-full bg-brand text-brand-foreground hover:bg-brand-dark"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? (
              <>
                <Loader2Icon className="animate-spin" />
                Ingresando...
              </>
            ) : (
              "Ingresar"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
