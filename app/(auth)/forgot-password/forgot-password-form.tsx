"use client"

import { z } from "zod"
import Link from "next/link"
import { toast } from "sonner"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { useForm } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { zodResolver } from "@hookform/resolvers/zod"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, Mail, MailCheck, ArrowUpRight } from "lucide-react"

import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .email("Ingresa un correo electrónico válido")
    .trim()
    .min(1, "El correo electrónico es obligatorio"),
})

type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>

import Image from "next/image"

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [isLoading, setIsLoading] = useState(false)
  const [isSent, setIsSent] = useState(false)
  const supabase = createClient()

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  })

  const onSubmit = async (values: ForgotPasswordInput) => {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        values.email,
        {
          redirectTo: `${window.location.origin}/login`,
        }
      )

      if (error) {
        toast.error("Error al enviar correo", {
          description:
            "No pudimos enviar el enlace de recuperación. Intenta de nuevo.",
        })
        return
      }

      setIsSent(true)
      toast.success("Correo enviado", {
        description:
          "Revisa tu bandeja de entrada para restablecer tu contraseña.",
      })
    } catch (error) {
      toast.error("Error inesperado", {
        description: "Ocurrió un problema al intentar procesar tu solicitud.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden border-border bg-card/50 p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <div className="flex flex-col justify-center">
            {isSent ? (
              <div className="flex animate-in flex-col items-center gap-3 p-4 text-center duration-500 fade-in zoom-in md:p-6">
                <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary shadow-inner">
                  <MailCheck className="size-5" />
                </div>
                <div className="space-y-2">
                  <h1 className="text-xl font-bold tracking-tight">
                    ¡Correo enviado!
                  </h1>
                  <p className="mx-auto text-sm text-pretty text-muted-foreground">
                    Hemos enviado un enlace de recuperación
                  </p>
                </div>
                <Button asChild type="button" size="sm">
                  <Link href="/login">Volver al inicio de sesión</Link>
                </Button>
              </div>
            ) : (
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex flex-col justify-center p-4 md:p-6"
              >
                <FieldGroup>
                  <div className="mb-3 flex flex-col gap-2">
                    <div className="flex items-center justify-start gap-2">
                      <h1 className="text-2xl font-bold tracking-tight">
                        Recuperar Acceso
                      </h1>
                    </div>
                    <p className="text-left text-sm text-pretty text-muted-foreground">
                      Te enviaremos un enlace para restablecer tu contraseña
                    </p>
                  </div>

                  <Field>
                    <FieldLabel htmlFor="email">Correo electrónico</FieldLabel>
                    <div className="relative">
                      <Mail className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground/70" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="nombre@empresa.com"
                        className="h-11 border-muted-foreground/10 bg-muted/30 pl-10 transition-colors focus:border-primary/50"
                        {...form.register("email")}
                        disabled={isLoading}
                      />
                    </div>
                    <FieldError errors={[form.formState.errors.email]} />
                  </Field>

                  <div className="space-y-4 pt-2">
                    <Button
                      type="submit"
                      size="lg"
                      className="w-full"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          Enviando enlace...
                        </>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          Enviar
                          <ArrowUpRight className="size-4" />
                        </div>
                      )}
                    </Button>

                    <Button
                      variant="ghost"
                      asChild
                      size="lg"
                      className="w-full text-muted-foreground hover:text-foreground"
                    >
                      <Link href="/login">Volver al inicio de sesión</Link>
                    </Button>
                  </div>
                </FieldGroup>
              </form>
            )}
          </div>
          <div className="relative hidden overflow-hidden bg-black md:block">
            <Image
              fill
              priority
              src="/images/auth-background.png"
              alt="Manufacturing Workspace"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-10000 ease-linear hover:scale-110 dark:opacity-80"
            />
            {/* Cinematic overlay - ensures text is always readable */}
            <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/40 to-transparent" />

            <div className="absolute right-10 bottom-5 left-5 flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-bold tracking-tighter text-white">
                  manufacturingOS
                </h2>
                <div className="h-1.5 w-12 rounded-full bg-primary shadow-[0_0_15px_rgba(var(--primary),0.5)]" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
