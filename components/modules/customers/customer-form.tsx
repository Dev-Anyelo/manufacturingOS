"use client"

import * as React from "react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Loader2, SaveIcon } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { zodResolver } from "@hookform/resolvers/zod"
import { revalidatePaths } from "@/lib/ui/revalidatePaths"
import { customerSchema, type CustomerInput } from "@/lib/validations/sales"

interface CustomerFormProps {
  className?: string
  mode?: "create" | "edit"
  customerId?: string
  defaultValues?: Partial<CustomerInput>
  onSuccess?: () => void
  onCancel?: () => void
}

export function CustomerForm({
  className,
  mode = "create",
  customerId,
  defaultValues,
  onSuccess,
  onCancel,
}: CustomerFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const form = useForm<CustomerInput>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      full_name: defaultValues?.full_name ?? "",
      phone: defaultValues?.phone ?? "",
      email: defaultValues?.email ?? "",
      address: defaultValues?.address ?? "",
      notes: defaultValues?.notes ?? "",
    },
  })

  async function onSubmit(values: CustomerInput) {
    setIsSubmitting(true)
    try {
      const endpoint =
        mode === "create" ? "/api/customers" : `/api/customers/${customerId}`
      const method = mode === "create" ? "POST" : "PATCH"

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(
          result.error ??
            `No se pudo ${mode === "create" ? "registrar" : "actualizar"} el cliente`
        )
      }

      const pathsToRevalidate = ["/customers"]
      if (result?.data?.id)
        pathsToRevalidate.push(`/customers/${result.data.id}`)

      if (onSuccess) {
        await revalidatePaths(pathsToRevalidate)
        toast.success(
          `Cliente ${mode === "create" ? "registrado" : "actualizado"} con éxito`
        )
        onSuccess()
      } else {
        await revalidatePaths(pathsToRevalidate)
        toast.success(
          `Cliente ${mode === "create" ? "registrado" : "actualizado"} con éxito`
        )
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : `Error al ${mode === "create" ? "registrar" : "actualizar"} cliente`
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className={cn("flex h-full min-h-0 flex-col", className)}
      noValidate
    >
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto max-w-2xl space-y-5 px-4 py-6 sm:px-6">
          <div className="space-y-2">
            <Label
              htmlFor="full_name"
              className="text-sm font-semibold text-foreground/90"
            >
              Nombre Completo <span className="text-destructive">*</span>
            </Label>
            <Input
              id="full_name"
              placeholder="Ej: Juan Pérez"
              className="h-10 focus-visible:ring-primary"
              {...form.register("full_name")}
            />
            {form.formState.errors.full_name && (
              <p className="text-xs font-medium text-destructive">
                {form.formState.errors.full_name.message}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label
                htmlFor="phone"
                className="text-sm font-semibold text-foreground/90"
              >
                Teléfono
              </Label>
              <Input
                id="phone"
                placeholder="Ej: 6000-0000"
                className="h-10 focus-visible:ring-primary"
                {...form.register("phone")}
              />
              {form.formState.errors.phone && (
                <p className="text-xs font-medium text-destructive">
                  {form.formState.errors.phone.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-sm font-semibold text-foreground/90"
              >
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Ej: juan@ejemplo.com"
                className="h-10 focus-visible:ring-primary"
                {...form.register("email")}
              />
              {form.formState.errors.email && (
                <p className="text-xs font-medium text-destructive">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="address"
              className="text-sm font-semibold text-foreground/90"
            >
              Dirección
            </Label>
            <Input
              id="address"
              placeholder="Ej: Ciudad de Managua, Nicaragua"
              className="h-10 focus-visible:ring-primary"
              {...form.register("address")}
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="notes"
              className="text-sm font-semibold text-foreground/90"
            >
              Notas adicionales (Opcional)
            </Label>
            <Textarea
              id="notes"
              rows={4}
              placeholder="Detalles relevantes sobre el cliente, preferencias de entrega, etc..."
              className="min-h-[120px] resize-none focus-visible:ring-primary"
              {...form.register("notes")}
            />
          </div>
        </div>
      </div>

      {/* ─── Sticky Footer ─────────────────────────────────────────── */}
      <div className="shrink-0 border-t border-border/70 bg-background/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:px-6 sm:py-4 sm:pb-4">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1 sm:flex-initial"
            >
              Cancelar
            </Button>
          )}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <SaveIcon className="size-4" />
            )}
            <span>
              {mode === "create" ? "Registrar cliente" : "Guardar cambios"}
            </span>
          </Button>
        </div>
      </div>
    </form>
  )
}
