"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { useIsMobile } from "@/hooks/use-mobile"
import { PlusIcon, ShirtIcon } from "lucide-react"

import {
  CatalogForm,
  CatalogFormValues,
} from "@/components/modules/catalog/catalog-form"

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

interface CatalogSheetProps {
  itemId?: string
  defaultValues?: Partial<CatalogFormValues>
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: React.ReactNode
  onSuccess?: () => void
}

export function CatalogSheet({
  itemId,
  defaultValues,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  trigger,
  onSuccess: externalOnSuccess,
}: CatalogSheetProps) {
  const isMobile = useIsMobile()
  const [internalOpen, setInternalOpen] = React.useState(false)

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen =
    controlledOnOpenChange !== undefined
      ? controlledOnOpenChange
      : setInternalOpen

  const isEditing = Boolean(itemId)

  const titleNode = (
    <div className="flex items-center gap-3 text-left">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <ShirtIcon className="size-5 text-primary" />
      </div>
      <div className="min-w-0">
        <span className="block text-base font-semibold text-pretty">
          {isEditing ? "Editar producto" : "Nuevo producto"}
        </span>
        <span className="block text-sm text-pretty text-muted-foreground">
          {isEditing
            ? "Actualiza precios, stock y detalles del producto."
            : "Agrega un nuevo producto al catálogo de confecciones."}
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
      Nuevo producto
    </Button>
  )

  const activeTrigger = trigger !== undefined ? trigger : defaultTrigger

  const handleSuccess = () => {
    setOpen(false)
    if (externalOnSuccess) externalOnSuccess()
  }

  const content = (
    <div className="flex min-h-0 flex-1 flex-col">
      <CatalogForm
        mode={isEditing ? "edit" : "create"}
        itemId={itemId}
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
                  ? "Formulario para editar producto del catálogo."
                  : "Formulario para agregar un nuevo producto."}
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
                ? "Formulario para editar producto del catálogo."
                : "Formulario para agregar un nuevo producto."}
            </SheetDescription>
          </SheetHeader>
          {content}
        </SheetContent>
      </Sheet>
    </>
  )
}
