"use client"

import * as React from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { CheckCircle2Icon, Loader2Icon, BanknoteIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"

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
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
        >
          <CheckCircle2Icon className="mr-1.5 size-4" />
          Registrar pago
        </Button>
      </DrawerTrigger>
      
      <DrawerContent className="max-h-[92vh] gap-0 border-border p-0 sm:max-w-md mx-auto flex flex-col">
        <DrawerHeader className="shrink-0 border-b border-border/70 bg-muted/10 px-4 py-4 text-left">
          <DrawerTitle className="flex items-center gap-2 text-base text-pretty">
            <BanknoteIcon className="size-4 text-emerald-500" />
            Registrar pago
          </DrawerTitle>
          <DrawerDescription className="text-sm text-pretty mt-1">
            Verifica y registra el pago para completar esta venta.
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex flex-1 flex-col overflow-y-auto px-4 py-4 space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Monto recibido</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <Input
                type="number"
                placeholder="0.00"
                className="pl-7"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Metodo de pago</Label>
            <Select defaultValue="cash">
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar metodo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Efectivo</SelectItem>
                <SelectItem value="card">Tarjeta / POS</SelectItem>
                <SelectItem value="transfer">Transferencia (ACH)</SelectItem>
                <SelectItem value="yappy">Yappy</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Notas (opcional)</Label>
            <Textarea
              placeholder="Referencia de transaccion o detalles..."
              className="resize-none"
              rows={3}
            />
          </div>
        </div>

        <DrawerFooter className="shrink-0 border-t border-border/70 bg-background pb-[max(env(safe-area-inset-bottom),1rem)] p-4 sm:flex-row sm:justify-end sm:gap-2">
          <DrawerClose asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
          </DrawerClose>
          <Button 
            type="button" 
            onClick={handleConfirm}
            disabled={isSubmitting} 
            size="sm" 
            className="w-full sm:w-auto mt-2 sm:mt-0"
          >
            {isSubmitting ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : <CheckCircle2Icon className="size-4" />}
            Confirmar pago
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
