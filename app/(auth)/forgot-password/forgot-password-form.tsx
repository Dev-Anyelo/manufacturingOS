"use client"

import { z } from "zod"
import Link from "next/link"
import { useState } from "react"
import { useForm } from "react-hook-form"
import {
  Loader2Icon,
  MailCheckIcon,
  MailIcon,
  ShieldCheckIcon,
} from "lucide-react"
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
    <Card className="overflow-hidden border border-border/70 bg-card/95 shadow-card backdrop-blur-sm">
      <CardHeader className="space-y-3 border-b border-border/70 bg-muted/10">
        <div className="inline-flex w-fit items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
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
          <div className="space-y-2 rounded-lg border border-border/70 bg-muted/15 p-3">
            <Label htmlFor="email">Correo electronico</Label>
            <div className="relative">
              <MailIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                className="pl-9"
                {...form.register("email")}
              />
            </div>
            {form.formState.errors.email ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.email.message}
              </p>
            ) : null}
          </div>

          <div className="rounded-lg border border-border/70 bg-card/80 p-3">
            <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <ShieldCheckIcon className="size-3.5 text-primary" />
              Seguridad de recuperacion
            </p>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>El enlace de recuperacion es temporal.</li>
              <li>Revisa bandeja principal y spam.</li>
              <li>Solicita uno nuevo si expira.</li>
            </ul>
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
              Volver a iniciar sesión
            </Link>
          </div>
        </CardContent>

        <CardFooter className="border-t border-border/70 bg-muted/10">
          <Button
            type="submit"
            className="min-h-11 w-full"
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
