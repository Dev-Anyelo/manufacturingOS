"use client"

import { PlusIcon, ReceiptIcon } from "lucide-react"
import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ExpenseForm } from "@/components/modules/expenses/expense-form"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

interface InventoryOption {
  id: string
  name: string
  unit: string
  quantity: number
}

interface NewExpenseSheetProps {
  inventoryItems: InventoryOption[]
}

export function NewExpenseSheet({ inventoryItems }: NewExpenseSheetProps) {
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
        Nuevo gasto
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side={isMobile ? "bottom" : "right"}
          className={cn(
            "flex flex-col gap-0 border-border p-0 sm:max-w-2xl",
            isMobile ? "max-h-[95vh] rounded-t-2xl" : ""
          )}
        >
          <SheetHeader className="shrink-0 border-b border-border/70 px-4 py-4 text-left">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                <ReceiptIcon className="size-4 text-primary" />
              </div>
              <div>
                <SheetTitle className="text-base">Nuevo gasto</SheetTitle>
                <SheetDescription className="text-sm text-pretty">
                  Registra un egreso operativo o compra de insumos.
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <ScrollArea className="flex-1">
            <div className="px-4 py-4">
              <ExpenseForm
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
