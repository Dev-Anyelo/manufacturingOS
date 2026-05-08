"use client"

import { UserForm } from "./user-form"
import { useIsMobile } from "@/hooks/use-mobile"
import { UserRole, ContractType, Currency } from "@prisma/client"

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
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer"

export interface UserFormData {
  id?: string
  email?: string | null
  fullName?: string | null
  role?: UserRole
  phone?: string | null
  address?: string | null
  birthDate?: string | Date | null
  avatarUrl?: string | null
  isActive?: boolean
  employee?: {
    documentId: string
    hireDate: Date | string
    contractType: ContractType
    baseSalary: number | string | null
    baseSalaryCurrency: Currency | null
  } | null
}

interface UserFormSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: UserFormData
  onSuccess?: () => void
}

export function UserFormSheet({
  open,
  onOpenChange,
  initialData,
  onSuccess,
}: UserFormSheetProps) {
  const isMobile = useIsMobile()

  const title = initialData?.id ? "Editar Usuario" : "Nuevo Usuario"
  const description = initialData?.id
    ? "Modifica los datos del usuario y su información laboral."
    : "Completa los datos para crear un nuevo usuario en el sistema."

  const handleSuccess = () => {
    onOpenChange(false)
    onSuccess?.()
  }

  const formContent = (
    <UserForm initialData={initialData} onSuccess={handleSuccess} />
  )

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle className="text-left text-pretty">{title}</DrawerTitle>
            <DrawerDescription className="text-left text-sm text-pretty">
              {description}
            </DrawerDescription>
          </DrawerHeader>
          <div className="overflow-y-auto pb-4">{formContent}</div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="text-left text-pretty">{title}</SheetTitle>
          <SheetDescription className="text-left text-sm text-pretty">
            {description}
          </SheetDescription>
        </SheetHeader>
        <div className="pb-4">{formContent}</div>
      </SheetContent>
    </Sheet>
  )
}
