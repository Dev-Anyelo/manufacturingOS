"use client"

import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2Icon, ShieldCheckIcon } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"

import { createClient } from "@/lib/supabase/client"
import { registerSchema, type RegisterInput } from "@/lib/validations/auth"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const authErrorMap: Record<string, string> = {
  user_already_exists: "Ya existe una cuenta registrada con este correo.",
  weak_password: "La contrasena no cumple con los requisitos minimos.",
}

export function RegisterForm() {
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      full_name: "",
      email: "",
      password: "",
    },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitError(null)
    setSuccessMessage(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: {
          full_name: values.full_name,
        },
      },
    })

    if (error) {
      const mappedError = error.code ? authErrorMap[error.code] : undefined
      setSubmitError(
        mappedError ?? "No se pudo crear tu cuenta. Intenta nuevamente."
      )
      return
    }

    setSuccessMessage(
      "Cuenta creada. Revisa tu correo para confirmar y luego iniciar sesion."
    )
    form.reset()
  })

  return (
    <Card className="overflow-hidden border border-border bg-muted/20 shadow-sm backdrop-blur-sm">
      <CardHeader className="space-y-3 border-b border-border">
        <div className="inline-flex w-fit items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
          <ShieldCheckIcon className="size-3.5" />
          Alta segura
        </div>
        <div className="space-y-1">
          <CardTitle className="text-xl">Crear cuenta</CardTitle>
          <p className="text-sm text-muted-foreground">
            Registra un nuevo usuario para gestionar operaciones del sistema.
          </p>
        </div>
      </CardHeader>
      <form onSubmit={onSubmit} noValidate>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-3">
            <Label htmlFor="full_name">Nombre completo</Label>
            <Input
              id="full_name"
              autoComplete="name"
              {...form.register("full_name")}
            />
            {form.formState.errors.full_name ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.full_name.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-3">
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

          <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-3">
            <Label htmlFor="password">Contrasena</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              {...form.register("password")}
            />
            {form.formState.errors.password ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.password.message}
              </p>
            ) : null}
          </div>

          {submitError ? (
            <p className="text-sm text-destructive">{submitError}</p>
          ) : null}
          {successMessage ? (
            <p className="text-success text-sm">{successMessage}</p>
          ) : null}

          <Link href="/login" className="text-xs text-primary hover:underline">
            ¿Ya tienes cuenta? Inicia sesión
          </Link>
        </CardContent>

        <CardFooter className="border-t border-border bg-muted/20">
          <Button type="submit" className="min-h-11 w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? (
              <>
                <Loader2Icon className="animate-spin" />
                Creando cuenta...
              </>
            ) : (
              "Crear cuenta"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
