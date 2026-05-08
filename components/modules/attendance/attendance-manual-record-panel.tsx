"use client"

import { useIsMobile } from "@/hooks/use-mobile"
import { AttendanceRecordForm } from "@/components/modules/attendance/attendance-record-form"

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

type AttendanceManualRecordPanelProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  employeeId?: string | null
  employeeName?: string | null
  recordId?: string | null
}

export function AttendanceManualRecordPanel({
  open,
  onOpenChange,
  employeeId,
  employeeName,
  recordId,
}: AttendanceManualRecordPanelProps) {
  const isMobile = useIsMobile()
  const title = recordId ? "Editar registro" : "Agregar registro manual"
  const description = recordId
    ? `Modifica la asistencia de ${employeeName || "el empleado"}.`
    : `Captura una asistencia para ${employeeName || "el empleado"}. El sistema calculará el estado y los minutos automáticamente.`

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="text-left">{title}</DrawerTitle>
            <DrawerDescription className="text-left text-sm text-pretty">
              {description}
            </DrawerDescription>
          </DrawerHeader>
          <div className="overflow-y-auto px-4">
            <AttendanceRecordForm
              employeeId={employeeId || ""}
              employeeName={employeeName || ""}
              recordId={recordId || undefined}
              onSuccess={() => onOpenChange(false)}
            />
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-160">
        <SheetHeader>
          <SheetTitle className="text-left">{title}</SheetTitle>
          <SheetDescription className="text-left text-sm text-pretty">
            {description}
          </SheetDescription>
        </SheetHeader>
        <div className="px-4">
          <AttendanceRecordForm
            employeeId={employeeId || ""}
            employeeName={employeeName || ""}
            recordId={recordId || undefined}
            onSuccess={() => onOpenChange(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}
