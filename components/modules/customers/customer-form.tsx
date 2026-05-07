"use client"

import * as React from "react"
import { toast } from "sonner"
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
  mode?: "create" | "edit"
  customerId?: string
  defaultValues?: Partial<CustomerInput>
  onSuccess?: () => void
  onCancel?: () => void
}

export function CustomerForm({
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
      className="space-y-4"
      noValidate
    >
      <div className="space-y-2">
        <Label htmlFor="full_name">
          Nombre Completo <span className="text-destructive">*</span>
        </Label>
        <Input
          id="full_name"
          placeholder="Ej: Juan Pérez"
          {...form.register("full_name")}
        />
        {form.formState.errors.full_name && (
          <p className="text-xs text-destructive">
            {form.formState.errors.full_name.message}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Teléfono</Label>
          <Input
            id="phone"
            placeholder="Ej: 6000-0000"
            {...form.register("phone")}
          />
          {form.formState.errors.phone && (
            <p className="text-xs text-destructive">
              {form.formState.errors.phone.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="Ej: juan@ejemplo.com"
            {...form.register("email")}
          />
          {form.formState.errors.email && (
            <p className="text-xs text-destructive">
              {form.formState.errors.email.message}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Dirección</Label>
        <Input
          id="address"
          placeholder="Ej: Ciudad de Managua, Nicaragua"
          {...form.register("address")}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notas (Opcional)</Label>
        <Textarea
          id="notes"
          rows={3}
          placeholder="Detalles adicionales del cliente..."
          className="resize-none"
          {...form.register("notes")}
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <div className="flex items-center gap-2">
              <SaveIcon className="size-4" />
              Guardar cambios
            </div>
          )}
        </Button>
      </div>
    </form>
  )
}
