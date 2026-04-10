"use client"

import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2Icon } from "lucide-react"
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
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Crear cuenta</CardTitle>
      </CardHeader>
      <form onSubmit={onSubmit} noValidate>
        <CardContent className="space-y-4">
          <div className="space-y-2">
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

          <div className="space-y-2">
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

          <div className="space-y-2">
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
            Ya tienes cuenta? Inicia sesion
          </Link>
        </CardContent>

        <CardFooter>
          <Button
            type="submit"
            className="w-full"
            disabled={form.formState.isSubmitting}
          >
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
