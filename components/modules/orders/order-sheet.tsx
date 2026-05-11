"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { useIsMobile } from "@/hooks/use-mobile"
import { PlusIcon, ClipboardListIcon } from "lucide-react"
import type { PosCustomer } from "@/components/modules/sales/types"

import { OrderForm } from "@/components/modules/orders/order-form"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"

import { Currency } from "@prisma/client"

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

interface OrderSheetProps {
  customers: PosCustomer[]
  catalogItems: CatalogChoice[]
  inventoryItems: InventoryChoice[]
  orderId?: string
  defaultValues?: Record<string, unknown>
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: React.ReactNode
  onSuccess?: () => void
}

export function OrderSheet({
  customers,
  catalogItems,
  inventoryItems,
  orderId,
  defaultValues,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  trigger,
  onSuccess: externalOnSuccess,
}: OrderSheetProps) {
  const isMobile = useIsMobile()
  const [internalOpen, setInternalOpen] = React.useState(false)

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen =
    controlledOnOpenChange !== undefined
      ? controlledOnOpenChange
      : setInternalOpen

  const isEditing = Boolean(orderId)

  const titleNode = (
    <div className="flex items-center gap-3 text-left">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <ClipboardListIcon className="size-5 text-primary" />
      </div>
      <div className="min-w-0">
        <span className="block text-base font-semibold text-pretty">
          {isEditing ? "Editar pedido" : "Nuevo pedido"}
        </span>
        <span className="block text-sm text-pretty text-muted-foreground">
          {isEditing
            ? "Actualiza los detalles, artículos y pagos del pedido."
            : "Registra un pedido a medida con medidas y artículos."}
        </span>
      </div>
    </div>
  )

  const defaultTrigger = (
    <Button
      size="sm"
      className="w-full md:max-w-fit"
      onClick={() => setOpen(true)}
    >
      <PlusIcon className="size-4 shrink-0" />
      Nuevo pedido
    </Button>
  )

  const activeTrigger = trigger !== undefined ? trigger : defaultTrigger

  const handleSuccess = () => {
    setOpen(false)
    if (externalOnSuccess) externalOnSuccess()
  }

  const content = (
    <div className="flex min-h-0 flex-1 flex-col">
      <OrderForm
        customers={customers}
        catalogItems={catalogItems}
        inventoryItems={inventoryItems}
        orderId={orderId}
        defaultValues={defaultValues}
        onSuccess={handleSuccess}
        onCancel={() => setOpen(false)}
        className="h-full"
      />
    </div>
  )

  if (isMobile) {
    return (
      <>
        {activeTrigger}
        <Drawer
          open={open}
          onOpenChange={setOpen}
          shouldScaleBackground={false}
        >
          <DrawerContent className="flex h-[98dvh] max-h-[98dvh] flex-col p-0">
            <DrawerHeader className="shrink-0 border-b border-border/70 px-4 py-3 text-left">
              <DrawerTitle asChild>
                <div>{titleNode}</div>
              </DrawerTitle>
              <DrawerDescription className="sr-only">
                {isEditing
                  ? "Formulario para editar un pedido existente."
                  : "Formulario para registrar un nuevo pedido."}
              </DrawerDescription>
            </DrawerHeader>
            {content}
          </DrawerContent>
        </Drawer>
      </>
    )
  }

  return (
    <>
      {activeTrigger}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="flex w-full flex-col gap-0 border-border p-0 sm:max-w-2xl"
        >
          <SheetHeader className="shrink-0 border-b border-border/70 px-5 py-4 text-left">
            <SheetTitle asChild>
              <div>{titleNode}</div>
            </SheetTitle>
            <SheetDescription className="sr-only">
              {isEditing
                ? "Formulario para editar un pedido existente."
                : "Formulario para registrar un nuevo pedido."}
            </SheetDescription>
          </SheetHeader>
          {content}
        </SheetContent>
      </Sheet>
    </>
  )
}
