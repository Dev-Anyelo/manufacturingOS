"use client"

import { z } from "zod"
import Link from "next/link"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { Loader2Icon, MailCheckIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { zodResolver } from "@hookform/resolvers/zod"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

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
    <Card className="overflow-hidden border border-border/60 bg-card/90 shadow-sm backdrop-blur-sm">
      <CardHeader className="space-y-3 border-b border-border/60">
        <div className="bg-brand-muted inline-flex w-fit items-center gap-2 rounded-lg border border-brand/30 px-2.5 py-1 text-xs font-medium text-brand">
          <MailCheckIcon className="size-3.5" />
          Recuperacion de acceso
        </div>
        <div className="space-y-1">
          <CardTitle className="text-xl">Recuperar contrasena</CardTitle>
          <p className="text-sm text-muted-foreground">
            Te enviaremos un enlace para restablecer tu acceso de forma segura.
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

          {submitError ? (
            <Alert variant="destructive">
              <AlertTitle>No fue posible enviar el correo</AlertTitle>
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          ) : null}
          {successMessage ? (
            <Alert className="border-success-soft bg-success-soft/40">
              <AlertTitle className="text-success">Correo enviado</AlertTitle>
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          ) : null}

          <div className="flex items-center justify-between gap-2 text-xs">
            <p className="text-muted-foreground">¿Ya tienes acceso?</p>
            <Link
              href="/login"
              className="font-medium text-primary underline-offset-2 hover:underline"
            >
              Volver a iniciar sesion
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
