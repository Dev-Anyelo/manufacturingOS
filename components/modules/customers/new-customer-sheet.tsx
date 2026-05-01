"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { CustomerForm } from "./customer-form"
import { Button } from "@/components/ui/button"
import { useIsMobile } from "@/hooks/use-mobile"
import { PlusIcon, UserPlusIcon } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

export function NewCustomerSheet() {
  const router = useRouter()
  const isMobile = useIsMobile()
  const [open, setOpen] = React.useState(false)

  return (
    <>
      <Button
        size="sm"
        className="max-w-fit"
        onClick={() => setOpen(true)}
      >
        <PlusIcon className="size-4 shrink-0" />
        Nuevo Cliente
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side={isMobile ? "bottom" : "right"}
          className={cn(
            "flex flex-col gap-0 border-border p-0 sm:max-w-md",
            isMobile ? "max-h-[95vh] rounded-t-2xl" : ""
          )}
        >
          <SheetHeader className="shrink-0 border-b border-border/70 px-4 py-4 text-left">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                <UserPlusIcon className="size-4 text-primary" />
              </div>
              <div>
                <SheetTitle className="text-base">Nuevo Cliente</SheetTitle>
                <SheetDescription className="text-sm text-pretty">
                  Agrega un nuevo cliente a la base de datos.
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <ScrollArea className="flex-1">
            <div className="px-4 py-4">
              <CustomerForm
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
