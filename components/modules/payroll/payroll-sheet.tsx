"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { useIsMobile } from "@/hooks/use-mobile"
import { PlusIcon, BanknoteIcon } from "lucide-react"

import { PayrollForm } from "@/components/modules/payroll/payroll-form"

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

type EmployeeOption = {
  id: string
  fullName: string
  contractType: "fixed_salary" | "per_piece" | "hourly"
  baseSalary: number | null
}

interface PayrollSheetProps {
  employees: EmployeeOption[]
  paymentId?: string
  defaultValues?: Record<string, unknown>
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: React.ReactNode
  onSuccess?: () => void
}

export function PayrollSheet({
  employees,
  paymentId,
  defaultValues,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  trigger,
  onSuccess: externalOnSuccess,
}: PayrollSheetProps) {
  const isMobile = useIsMobile()
  const [internalOpen, setInternalOpen] = React.useState(false)

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen =
    controlledOnOpenChange !== undefined
      ? controlledOnOpenChange
      : setInternalOpen

  const isEditing = Boolean(paymentId)

  const titleNode = (
    <div className="flex items-center gap-3 text-left">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <BanknoteIcon className="size-5 text-primary" />
      </div>
      <div className="min-w-0">
        <span className="block text-base font-semibold text-pretty">
          {isEditing ? "Editar pago de nómina" : "Nuevo pago de nómina"}
        </span>
        <span className="block text-sm text-pretty text-muted-foreground">
          {isEditing
            ? "Actualiza los detalles del pago, bonos o deducciones."
            : "Registra un pago para un empleado basado en su contrato."}
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
      Registrar pago
    </Button>
  )

  const activeTrigger = trigger !== undefined ? trigger : defaultTrigger

  const handleSuccess = () => {
    setOpen(false)
    if (externalOnSuccess) externalOnSuccess()
  }

  const content = (
    <div className="flex min-h-0 flex-1 flex-col">
      <PayrollForm
        employees={employees}
        paymentId={paymentId}
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
                  ? "Formulario para editar registro de pago de nómina."
                  : "Formulario para registrar un nuevo pago de nómina."}
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
                ? "Formulario para editar registro de pago de nómina."
                : "Formulario para registrar un nuevo pago de nómina."}
            </SheetDescription>
          </SheetHeader>
          {content}
        </SheetContent>
      </Sheet>
    </>
  )
}
