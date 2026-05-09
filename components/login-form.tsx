"use client"

import Link from "next/link"
import { toast } from "sonner"
import Image from "next/image"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { zodResolver } from "@hookform/resolvers/zod"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, Mail, Lock, ArrowRightIcon } from "lucide-react"
import { loginSchema, type LoginInput } from "@/lib/validations/auth"

import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const onSubmit = async (values: LoginInput) => {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      })

      if (error) {
        toast.error("Error de autenticación", {
          description:
            "Correo o contraseña incorrectos. Por favor intenta de nuevo.",
        })
        return
      }

      toast.success("¡Bienvenido de nuevo!", {
        description: "Has iniciado sesión correctamente.",
      })
      router.push("/")
      router.refresh()
    } catch (error) {
      toast.error("Error inesperado", {
        description: "Ocurrió un problema al intentar iniciar sesión.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden border-border bg-card/50 p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col justify-center p-4 md:p-6"
          >
            <FieldGroup>
              <div className="mb-4 flex flex-col gap-2">
                <div className="flex items-center justify-center gap-2">
                  <h1 className="text-lg font-bold tracking-tight md:text-2xl">
                    Accede a tu cuenta
                  </h1>
                </div>
                <p className="text-center text-xs text-balance text-muted-foreground md:text-sm">
                  Ingresa tus credenciales para acceder a tu taller
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

              <Field>
                <div className="flex items-center justify-between">
                  <FieldLabel htmlFor="password">Contraseña</FieldLabel>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-medium text-primary underline-offset-4 transition-all hover:underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground/70" />
                  <Input
                    id="password"
                    type="password"
                    required
                    placeholder="********"
                    className="h-11 border-muted-foreground/10 bg-muted/30 pl-10 transition-colors focus:border-primary/50"
                    {...form.register("password")}
                    disabled={isLoading}
                  />
                </div>
                <FieldError errors={[form.formState.errors.password]} />
              </Field>

              <Button type="submit" size="lg" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Accediendo...
                  </>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    Acceder
                    <ArrowRightIcon className="size-4" />
                  </div>
                )}
              </Button>
            </FieldGroup>
          </form>
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
                  DANIELLS CONFECCIONES
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
