"use client"

import { useIsMobile } from "@/hooks/use-mobile"
import { LeaveRequestForm } from "@/components/modules/attendance/leave-request-form"

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

type LeaveRequestPanelProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  employeeName: string
  employeeId?: string
  endpoint?: string
}

export function LeaveRequestPanel({
  open,
  onOpenChange,
  employeeName,
  employeeId,
  endpoint,
}: LeaveRequestPanelProps) {
  const isMobile = useIsMobile()
  const title = "Nueva solicitud de permiso"
  const description = `Registra una solicitud para ${employeeName}.`

  const form = (
    <LeaveRequestForm
      employeeId={employeeId}
      endpoint={endpoint}
      onSuccess={() => onOpenChange(false)}
    />
  )

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="text-left">{title}</DrawerTitle>
            <DrawerDescription className="text-left text-pretty">{description}</DrawerDescription>
          </DrawerHeader>
          <div className="overflow-y-auto px-4 pb-6">{form}</div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-140">
        <SheetHeader>
          <SheetTitle className="text-left">{title}</SheetTitle>
          <SheetDescription className="text-left text-pretty">{description}</SheetDescription>
        </SheetHeader>
        <div className="px-1 pb-3">{form}</div>
      </SheetContent>
    </Sheet>
  )
}
