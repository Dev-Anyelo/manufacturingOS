"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { ContractType, Currency } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, UserPlus } from "lucide-react"

export function CreateEmployeeForm({ profileId }: { profileId: string }) {
  const queryClient = useQueryClient()
  const [documentId, setDocumentId] = useState("")
  const [hireDate, setHireDate] = useState("")
  const [contractType, setContractType] = useState<ContractType>("fixed_salary")
  const [baseSalary, setBaseSalary] = useState("")
  const [currency, setCurrency] = useState<Currency>("NIO")

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/settings/users/${profileId}/employee`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId,
          hireDate,
          contractType,
          baseSalary: baseSalary ? parseFloat(baseSalary) : 0,
          baseSalaryCurrency: currency
        }),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Error al crear perfil")
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success("Perfil de empleado creado exitosamente")
      // Refrescar la página para que Next.js vuelva a cargar el layout del servidor
      window.location.reload()
    },
    onError: (err: any) => {
      toast.error(err.message || "Error al crear empleado")
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!documentId || !hireDate) {
      toast.error("Por favor completa los campos obligatorios")
      return
    }
    createMutation.mutate()
  }

  return (
    <div className="max-w-xl rounded-xl border p-6 bg-card text-card-foreground shadow-sm">
      <div className="mb-6">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-primary" />
          Vincular Perfil de Empleado
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Este usuario no tiene un perfil de empleado asociado. Debes crearlo para poder configurarle su <strong>horario de asistencia, permisos y planilla.</strong>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="documentId">Cédula / Identidad *</Label>
            <Input
              id="documentId"
              value={documentId}
              onChange={(e) => setDocumentId(e.target.value)}
              placeholder="001-000000-0000A"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hireDate">Fecha de Contratación *</Label>
            <Input
              id="hireDate"
              type="date"
              value={hireDate}
              onChange={(e) => setHireDate(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Tipo de Contrato</Label>
            <Select value={contractType} onValueChange={(v: ContractType) => setContractType(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fixed_salary">Salario Fijo</SelectItem>
                <SelectItem value="per_piece">Por Obra / Destajo</SelectItem>
                <SelectItem value="hourly">Por Hora</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="baseSalary">Salario Base (Opcional)</Label>
            <div className="flex gap-2">
              <Input
                id="baseSalary"
                type="number"
                min="0"
                step="0.01"
                value={baseSalary}
                onChange={(e) => setBaseSalary(e.target.value)}
                placeholder="0.00"
              />
              <Select value={currency} onValueChange={(v: Currency) => setCurrency(v)}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NIO">NIO</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="pt-2">
          <Button type="submit" disabled={createMutation.isPending} className="w-full">
            {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Crear y Vincular Empleado
          </Button>
        </div>
      </form>
    </div>
  )
}
