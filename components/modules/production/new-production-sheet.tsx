"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { PlusIcon, FactoryIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProductionForm } from "@/components/modules/production/production-form"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

type EmployeeOption = {
  id: string
  fullName: string
  profileId?: string | null
}

type InventoryOption = {
  id: string
  name: string
  unit: string
  quantity: number
}

interface NewProductionSheetProps {
  employees: EmployeeOption[]
  inventoryItems: InventoryOption[]
  currentUserId: string
  currentUserRole: string
}

export function NewProductionSheet({
  employees,
  inventoryItems,
  currentUserId,
  currentUserRole,
}: NewProductionSheetProps) {
  const router = useRouter()
  const isMobile = useIsMobile()
  const [open, setOpen] = React.useState(false)

  return (
    <>
      <Button size="sm" className="max-w-fit" onClick={() => setOpen(true)}>
        <PlusIcon className="size-4 shrink-0" />
        Nueva sesión
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
                <FactoryIcon className="size-4 text-primary" />
              </div>
              <div>
                <SheetTitle className="text-base text-pretty">
                  Nueva sesión de producción
                </SheetTitle>
                <SheetDescription className="text-sm text-pretty">
                  Registra la producción del día y el uso de materiales.
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <ScrollArea className="flex-1">
            <div className="px-4 py-4">
              <ProductionForm
                employees={employees}
                inventoryItems={inventoryItems}
                currentUserId={currentUserId}
                currentUserRole={currentUserRole}
                onSuccess={() => setOpen(false)}
                onCancel={() => setOpen(false)}
              />
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  )
}
