"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { PlusIcon, ShoppingCartIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { OrderForm } from "@/components/modules/orders/order-form"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

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

export function NewOrderSheet({ customers, catalogItems, inventoryItems }: NewOrderSheetProps) {
  const router = useRouter()
  const isMobile = useIsMobile()
  const [open, setOpen] = React.useState(false)

  return (
    <>
      <Button
        size="default"
        className="min-h-11 w-full gap-2 shadow-sm sm:w-auto sm:min-h-10"
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
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                <ShoppingCartIcon className="size-4 text-primary" />
              </div>
              <div>
                <SheetTitle className="text-base">Nueva orden</SheetTitle>
                <SheetDescription className="text-sm">
                  Crea un pedido para un cliente y especifica los detalles de entrega.
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <ScrollArea className="flex-1">
            <div className="px-6 py-4">
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
