"use client"

import * as React from "react"
import { CheckCircle2Icon } from "lucide-react"
import { toast } from "sonner"

import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface UpdateSalePaymentButtonProps {
  saleId: string
}

export function UpdateSalePaymentButton({
  saleId,
}: UpdateSalePaymentButtonProps) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  async function handleConfirm() {
    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/sales/${saleId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "paid",
        }),
      })

      const payload = (await response.json()) as {
        success: boolean
        error?: string
      }

      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? "No se pudo actualizar el pago.")
      }

      toast.success("Estado actualizado a pagada.")
      setOpen(false)
      router.refresh()
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo actualizar el pago."
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
      >
        <CheckCircle2Icon className="mr-1.5 size-4" />
        Actualizar pago
      </Button>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Marcar venta como pagada"
        description="Esta accion actualizara el estado de la venta a pagada."
        confirmLabel="Confirmar"
        variant="default"
        isLoading={isSubmitting}
        onConfirm={handleConfirm}
      />
    </>
  )
}
