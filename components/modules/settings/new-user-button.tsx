"use client"

import { useState } from "react"
import { UserPlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { UserFormSheet } from "@/components/modules/settings/user-form-sheet"

export function NewUserButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <UserPlusIcon className="size-4" />
        Nuevo usuario
      </Button>

      <UserFormSheet open={open} onOpenChange={setOpen} />
    </>
  )
}
