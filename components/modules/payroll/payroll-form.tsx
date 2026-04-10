"use client"

import { z } from "zod"
import * as React from "react"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { Loader2Icon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Textarea } from "@/components/ui/textarea"
import { zodResolver } from "@hookform/resolvers/zod"
import { Separator } from "@/components/ui/separator"
import { CurrencyDisplay } from "@/components/shared/currency-display"
import { Card, CardContent } from "@/components/ui/card"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const payrollFormSchema = z
  .object({
    employee_id: z.string().uuid("Selecciona un empleado valido"),
    period_start: z.string().min(1, "La fecha de inicio es obligatoria"),
    period_end: z.string().min(1, "La fecha de fin es obligatoria"),
    pieces_produced: z.coerce.number().int().min(0).optional().nullable(),
    hours_worked: z.coerce.number().min(0).optional().nullable(),
    base_amount: z.coerce.number().min(0),
    bonuses: z.coerce.number().min(0).default(0),
    deductions: z.coerce.number().min(0).default(0),
    payment_method: z.enum(["cash", "transfer", "other"]).optional().nullable(),
    notes: z.string().trim().max(1000).optional().nullable(),
  })
  .superRefine((value, context) => {
    if (
      new Date(value.period_end).getTime() <
      new Date(value.period_start).getTime()
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["period_end"],
        message: "La fecha de fin no puede ser menor a la de inicio",
      })
    }
  })

type PayrollFormInput = z.input<typeof payrollFormSchema>
type PayrollFormOutput = z.output<typeof payrollFormSchema>

type EmployeeOption = {
  id: string
  fullName: string
  contractType: "fixed_salary" | "per_piece" | "hourly"
  baseSalary: number | null
}

interface PayrollFormProps {
  employees: EmployeeOption[]
  onSuccess: () => void
  onCancel?: () => void
}

function normalizeOptional(value?: string | null) {
  const normalized = value?.trim()
  return normalized ? normalized : null
}

function todayInputDate() {
  const now = new Date()
  const year = now.getFullYear()
  const month = `${now.getMonth() + 1}`.padStart(2, "0")
  const day = `${now.getDate()}`.padStart(2, "0")
  return `${year}-${month}-${day}`
}

function toInputDate(value: Date) {
  const year = value.getFullYear()
  const month = `${value.getMonth() + 1}`.padStart(2, "0")
  const day = `${value.getDate()}`.padStart(2, "0")
  return `${year}-${month}-${day}`
}

function formatDateLabel(value: string) {
  if (!value) {
    return "Seleccionar fecha"
  }

  return new Intl.DateTimeFormat("es-PA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`))
}

export function PayrollForm({
  employees,
  onSuccess,
  onCancel,
}: PayrollFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const form = useForm<PayrollFormInput, unknown, PayrollFormOutput>({
    resolver: zodResolver(payrollFormSchema),
    defaultValues: {
      employee_id: "",
      period_start: todayInputDate(),
      period_end: todayInputDate(),
      pieces_produced: null,
      hours_worked: null,
      base_amount: 0,
      bonuses: 0,
      deductions: 0,
      payment_method: null,
      notes: "",
    },
  })

  const selectedEmployeeId = form.watch("employee_id")
  const watchBaseAmount = Number(form.watch("base_amount") ?? 0)
  const watchBonuses = Number(form.watch("bonuses") ?? 0)
  const watchDeductions = Number(form.watch("deductions") ?? 0)
  const watchPeriodStart = form.watch("period_start")
  const watchPeriodEnd = form.watch("period_end")

  const total = Math.max(watchBaseAmount + watchBonuses - watchDeductions, 0)

  React.useEffect(() => {
    const selected = employees.find(
      (employee) => employee.id === selectedEmployeeId
    )

    if (!selected) {
      return
    }

    if (selected.baseSalary && Number(form.getValues("base_amount")) === 0) {
      form.setValue("base_amount", Number(selected.baseSalary), {
        shouldDirty: true,
      })
    }
  }, [employees, form, selectedEmployeeId])

  async function onSubmit(values: PayrollFormOutput) {
    setIsSubmitting(true)

    try {
      const payload = {
        employee_id: values.employee_id,
        period_start: new Date(`${values.period_start}T00:00:00`),
        period_end: new Date(`${values.period_end}T00:00:00`),
        pieces_produced: values.pieces_produced,
        hours_worked: values.hours_worked,
        base_amount: values.base_amount,
        bonuses: values.bonuses,
        deductions: values.deductions,
        payment_method: values.payment_method,
        notes: normalizeOptional(values.notes),
      }

      const response = await fetch("/api/payroll", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const result = (await response.json()) as {
        success: boolean
        error?: string
      }

      if (!response.ok || !result.success) {
        throw new Error(result.error ?? "No se pudo registrar el pago.")
      }

      toast.success("Pago de planilla creado.")
      onSuccess()
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo registrar el pago."
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-4"
      noValidate
    >
      <div className="space-y-2">
        <Label className="text-sm font-medium">Empleado</Label>
        <Select
          value={form.watch("employee_id")}
          onValueChange={(value) =>
            form.setValue("employee_id", value, {
              shouldDirty: true,
              shouldValidate: true,
            })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecciona empleado" />
          </SelectTrigger>
          <SelectContent>
            {employees.map((employee) => (
              <SelectItem key={employee.id} value={employee.id}>
                {employee.fullName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.employee_id ? (
          <p className="text-danger text-xs">
            {form.formState.errors.employee_id.message}
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Inicio</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                {formatDateLabel(watchPeriodStart)}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2" align="start">
              <Calendar
                mode="single"
                selected={
                  watchPeriodStart
                    ? new Date(`${watchPeriodStart}T00:00:00`)
                    : undefined
                }
                onSelect={(date) => {
                  if (!date) {
                    return
                  }

                  form.setValue("period_start", toInputDate(date), {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }}
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">Fin</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                {formatDateLabel(watchPeriodEnd)}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2" align="start">
              <Calendar
                mode="single"
                selected={
                  watchPeriodEnd
                    ? new Date(`${watchPeriodEnd}T00:00:00`)
                    : undefined
                }
                onSelect={(date) => {
                  if (!date) {
                    return
                  }

                  form.setValue("period_end", toInputDate(date), {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }}
              />
            </PopoverContent>
          </Popover>
          {form.formState.errors.period_end ? (
            <p className="text-danger text-xs">
              {form.formState.errors.period_end.message}
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="pieces_produced" className="text-sm font-medium">
            Piezas
          </Label>
          <Input
            id="pieces_produced"
            type="number"
            min={0}
            step="1"
            {...form.register("pieces_produced", { valueAsNumber: true })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="hours_worked" className="text-sm font-medium">
            Horas
          </Label>
          <Input
            id="hours_worked"
            type="number"
            min={0}
            step="0.25"
            {...form.register("hours_worked", { valueAsNumber: true })}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="base_amount" className="text-sm font-medium">
            Monto base
          </Label>
          <Input
            id="base_amount"
            type="number"
            min={0}
            step="0.01"
            {...form.register("base_amount", { valueAsNumber: true })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bonuses" className="text-sm font-medium">
            Bonos
          </Label>
          <Input
            id="bonuses"
            type="number"
            min={0}
            step="0.01"
            {...form.register("bonuses", { valueAsNumber: true })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="deductions" className="text-sm font-medium">
            Deducciones
          </Label>
          <Input
            id="deductions"
            type="number"
            min={0}
            step="0.01"
            {...form.register("deductions", { valueAsNumber: true })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Metodo de pago (opcional)</Label>
        <Select
          value={form.watch("payment_method") ?? "none"}
          onValueChange={(value) =>
            form.setValue(
              "payment_method",
              value === "none"
                ? null
                : (value as "cash" | "transfer" | "other"),
              {
                shouldDirty: true,
              }
            )
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Sin definir" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sin definir</SelectItem>
            <SelectItem value="cash">Efectivo</SelectItem>
            <SelectItem value="transfer">Transferencia</SelectItem>
            <SelectItem value="other">Otro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes" className="text-sm font-medium">
          Notas
        </Label>
        <Textarea id="notes" className="min-h-20" {...form.register("notes")} />
      </div>

      <Card className="bg-brand-muted sticky bottom-0 border-brand/30 sm:static">
        <CardContent className="space-y-2 p-4 text-sm">
          <h3 className="font-semibold">Resumen del pago</h3>
          <div className="flex justify-between text-muted-foreground">
            <span>Base</span>
            <CurrencyDisplay amount={watchBaseAmount} />
          </div>
          {watchBonuses > 0 ? (
            <div className="text-success flex justify-between">
              <span>+ Bonificaciones</span>
              <CurrencyDisplay amount={watchBonuses} />
            </div>
          ) : null}
          {watchDeductions > 0 ? (
            <div className="text-danger flex justify-between">
              <span>- Deducciones</span>
              <CurrencyDisplay amount={watchDeductions} />
            </div>
          ) : null}
          <Separator />
          <div className="flex justify-between text-base font-bold">
            <span>Total a pagar</span>
            <CurrencyDisplay amount={total} size="lg" className="text-brand" />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        ) : null}
        <Button
          type="submit"
          className="bg-brand text-brand-foreground"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : null}
          Guardar pago
        </Button>
      </div>
    </form>
  )
}
