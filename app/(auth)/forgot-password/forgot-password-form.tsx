"use client"

import { z } from "zod"
import Link from "next/link"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { Loader2Icon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { zodResolver } from "@hookform/resolvers/zod"

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "El correo electronico es obligatorio")
    .email("Ingresa un correo electronico valido"),
})

type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>

export function ForgotPasswordForm() {
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitError(null)
    setSuccessMessage(null)

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `/login`,
    })

    if (error) {
      setSubmitError(
        "No se pudo enviar el correo de recuperacion. Intenta nuevamente."
      )
      return
    }

    setSuccessMessage("Te enviamos un correo para restablecer tu contrasena.")
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Recuperar contrasena</CardTitle>
      </CardHeader>
      <form onSubmit={onSubmit} noValidate>
        <CardContent className="space-y-4">
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

          {submitError ? (
            <p className="text-sm text-destructive">{submitError}</p>
          ) : null}
          {successMessage ? (
            <p className="text-sm text-emerald-600">{successMessage}</p>
          ) : null}

          <Link href="/login" className="text-xs text-primary hover:underline">
            Volver a iniciar sesion
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
                Enviando...
              </>
            ) : (
              "Enviar correo"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
