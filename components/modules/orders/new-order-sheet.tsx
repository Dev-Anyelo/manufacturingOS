"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { PlusIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useIsMobile } from "@/hooks/use-mobile"
import { ScrollArea } from "@/components/ui/scroll-area"
import { OrderForm } from "@/components/modules/orders/order-form"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"

type PosCustomer = {
  id: string
  name: string
  phone?: string | null
  email?: string | null
}

type CatalogChoice = {
  id: string
  name: string
  garmentType: string | null
  salePrice: number
}

type InventoryChoice = {
  id: string
  name: string
  unit: string
  quantity: number
}

interface NewOrderSheetProps {
  customers: PosCustomer[]
  catalogItems: CatalogChoice[]
  inventoryItems: InventoryChoice[]
}

export function NewOrderSheet({
  customers,
  catalogItems,
  inventoryItems,
}: NewOrderSheetProps) {
  const router = useRouter()
  const isMobile = useIsMobile()
  const [open, setOpen] = React.useState(false)

  return (
    <>
      <Button
        size="default"
        className="min-h-11 w-full gap-2 shadow-sm sm:min-h-10 sm:w-auto"
        onClick={() => setOpen(true)}
      >
        <PlusIcon className="size-4 shrink-0" />
        Nueva orden
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side={isMobile ? "bottom" : "right"}
          className={cn(
            "flex flex-col gap-0 border-border p-0 sm:max-w-2xl",
            isMobile ? "max-h-[95vh] rounded-t-2xl" : ""
          )}
        >
          <SheetHeader className="shrink-0 border-b border-border/70 px-6 py-4 text-left">
            <div className="flex items-center gap-3">
              <div>
                <SheetTitle className="text-base text-pretty">
                  Nueva orden
                </SheetTitle>
                <SheetDescription className="text-sm text-pretty">
                  Crea un pedido para un cliente y especifica los detalles de
                  entrega.
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <ScrollArea className="flex-1">
            <div className="px-4 py-4">
              <OrderForm
                customers={customers}
                catalogItems={catalogItems}
                inventoryItems={inventoryItems}
                onSuccess={() => {
                  setOpen(false)
                  router.refresh()
                }}
                onCancel={() => setOpen(false)}
              />
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  )
}
