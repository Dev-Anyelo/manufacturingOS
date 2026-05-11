"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { useIsMobile } from "@/hooks/use-mobile"
import { UserPlusIcon, UsersIcon } from "lucide-react"

import {
  CustomerForm,
} from "@/components/modules/customers/customer-form"

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

import { type CustomerInput } from "@/lib/validations/sales"

interface CustomerSheetProps {
  customerId?: string
  defaultValues?: Partial<CustomerInput>
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: React.ReactNode
  onSuccess?: () => void
}

export function CustomerSheet({
  customerId,
  defaultValues,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  trigger,
  onSuccess: externalOnSuccess,
}: CustomerSheetProps) {
  const isMobile = useIsMobile()
  const [internalOpen, setInternalOpen] = React.useState(false)

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen =
    controlledOnOpenChange !== undefined
      ? controlledOnOpenChange
      : setInternalOpen

  const isEditing = Boolean(customerId)

  const titleNode = (
    <div className="flex items-center gap-3 text-left">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <UsersIcon className="size-5 text-primary" />
      </div>
      <div className="min-w-0">
        <span className="block text-base font-semibold text-pretty">
          {isEditing ? "Editar cliente" : "Nuevo cliente"}
        </span>
        <span className="block text-sm text-pretty text-muted-foreground">
          {isEditing
            ? "Actualiza la información de contacto y detalles del cliente."
            : "Registra un nuevo cliente en el sistema."}
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
      <UserPlusIcon className="size-4 shrink-0" />
      Nuevo cliente
    </Button>
  )

  const activeTrigger = trigger !== undefined ? trigger : defaultTrigger

  const handleSuccess = () => {
    setOpen(false)
    if (externalOnSuccess) externalOnSuccess()
  }

  const content = (
    <div className="flex min-h-0 flex-1 flex-col">
      <CustomerForm
        mode={isEditing ? "edit" : "create"}
        customerId={customerId}
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
          <DrawerContent className="flex h-[85dvh] max-h-[85dvh] flex-col p-0">
            <DrawerHeader className="shrink-0 border-b border-border/70 px-4 py-3 text-left">
              <DrawerTitle asChild>
                <div>{titleNode}</div>
              </DrawerTitle>
              <DrawerDescription className="sr-only">
                {isEditing
                  ? "Formulario para editar información de cliente."
                  : "Formulario para registrar un nuevo cliente."}
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
          className="flex w-full flex-col gap-0 border-border p-0 sm:max-w-md"
        >
          <SheetHeader className="shrink-0 border-b border-border/70 px-5 py-4 text-left">
            <SheetTitle asChild>
              <div>{titleNode}</div>
            </SheetTitle>
            <SheetDescription className="sr-only">
              {isEditing
                ? "Formulario para editar información de cliente."
                : "Formulario para registrar un nuevo cliente."}
            </SheetDescription>
          </SheetHeader>
          {content}
        </SheetContent>
      </Sheet>
    </>
  )
}
