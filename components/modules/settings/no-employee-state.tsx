"use client"

import { UserCog } from "lucide-react"
import { Button } from "@/components/ui/button"

import {
  Card,
  CardContent,
} from "@/components/ui/card"

interface NoEmployeeStateProps {
  /** The tab context label (e.g. "horario", "asistencia") for the message */
  context: string
  /** Callback to open the UserFormSheet so the admin can fill labor data */
  onSetup: () => void
}

export function NoEmployeeState({ context, onSetup }: NoEmployeeStateProps) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
          <UserCog className="size-6 text-muted-foreground" />
        </div>
        <h3 className="mb-1 text-base font-semibold">
          Sin perfil laboral configurado
        </h3>
        <p className="mb-4 max-w-sm text-sm text-muted-foreground">
          Para gestionar {context} de este usuario, primero completa su
          información laboral (cédula, fecha de contratación y tipo de contrato).
        </p>
        <Button onClick={onSetup} variant="default" size="sm">
          Completar datos laborales
        </Button>
      </CardContent>
    </Card>
  )
}
