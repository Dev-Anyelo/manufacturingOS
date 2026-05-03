"use client"

import { z } from "zod"
import * as React from "react"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Textarea } from "@/components/ui/textarea"
import { zodResolver } from "@hookform/resolvers/zod"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import { CustomerSelector } from "@/components/modules/sales/customer-selector"
import type { PosCustomer } from "@/components/modules/sales/types"

import {
  Loader2,
  Calendar as CalendarIcon,
  User,
  Banknote,
  Plus,
  Minus,
  CreditCard,
  Clock,
  Scissors,
} from "lucide-react"

import { Currency } from "@prisma/client"
import { CurrencySelector } from "@/components/shared/currency-selector"
import { formatCurrencyNI, getCurrencySymbol } from "@/lib/currency/exchange"

const payrollFormSchema = z
  .object({
    employee_id: z.string().uuid("Selecciona un empleado válido"),
    period_start: z.string().min(1, "La fecha de inicio es obligatoria"),
    period_end: z.string().min(1, "La fecha de fin es obligatoria"),
    pieces_produced: z.coerce.number().int().min(0).optional().nullable(),
    hours_worked: z.coerce.number().min(0).optional().nullable(),
    base_amount: z.coerce.number().min(0),
    base_amount_currency: z.nativeEnum(Currency).default(Currency.USD),
    bonuses: z.coerce.number().min(0).default(0),
    bonuses_currency: z.nativeEnum(Currency).default(Currency.USD),
    deductions: z.coerce.number().min(0).default(0),
    deductions_currency: z.nativeEnum(Currency).default(Currency.USD),
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

function parseInputDate(value: string) {
  const [year, month, day] = value.split("-").map(Number)
  return new Date(year, (month || 1) - 1, day || 1)
}

function formatDateLabel(value: string) {
  if (!value) return "Seleccionar"

  return new Intl.DateTimeFormat("es-NI", {
    day: "2-digit",
    month: "short",
  }).format(parseInputDate(value))
}

// formatCurrency eliminado, se usa exchange.ts

const contractTypeLabels = {
  fixed_salary: "Salario fijo",
  per_piece: "Por pieza",
  hourly: "Por hora",
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
      base_amount_currency: Currency.USD,
      bonuses: 0,
      bonuses_currency: Currency.USD,
      deductions: 0,
      deductions_currency: Currency.USD,
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

  const selectedEmployee = React.useMemo(
    () => employees.find((e) => e.id === selectedEmployeeId),
    [employees, selectedEmployeeId]
  )

  const customerList = React.useMemo<PosCustomer[]>(
    () =>
      employees.map((e) => ({
        id: e.id,
        fullName: e.fullName,
      })),
    [employees]
  )

  const selectedCustomer = React.useMemo<PosCustomer | null>(
    () =>
      selectedEmployee
        ? {
            id: selectedEmployee.id,
            fullName: selectedEmployee.fullName,
          }
        : null,
    [selectedEmployee]
  )

  React.useEffect(() => {
    const selected = employees.find((e) => e.id === selectedEmployeeId)
    if (!selected) return

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
        period_start: parseInputDate(values.period_start),
        period_end: parseInputDate(values.period_end),
        pieces_produced: values.pieces_produced,
        hours_worked: values.hours_worked,
        base_amount: values.base_amount,
        base_amount_currency: values.base_amount_currency,
        bonuses: values.bonuses,
        bonuses_currency: values.bonuses_currency,
        deductions: values.deductions,
        deductions_currency: values.deductions_currency,
        total_amount: total,
        total_amount_currency: values.base_amount_currency,
        payment_method: values.payment_method,
        notes: normalizeOptional(values.notes),
      }

      const response = await fetch("/api/payroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const result = (await response.json()) as {
        success: boolean
        error?: string
      }

      if (!response.ok || !result.success) {
        throw new Error(result.error ?? "No se pudo registrar el pago.")
      }

      toast.success("Pago de nómina registrado exitosamente")
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
      className="mx-auto w-full space-y-4"
      noValidate
    >
      {/* Total Summary - Compact Info Bar */}
      <div className="flex items-center justify-center gap-0 border-b border-t bg-muted/20 overflow-x-auto py-1">
        <div className="flex flex-col items-center px-4 py-2 shrink-0">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total a pagar</span>
          <span className="text-sm font-bold tabular-nums mt-0.5 text-brand">{formatCurrencyNI(total, form.watch("base_amount_currency") || Currency.USD)}</span>
        </div>
      </div>

      {/* Tabbed Form */}
      <Tabs defaultValue="employee" className="w-full">
        <TabsList className="mb-4 grid w-full grid-cols-3">
          <TabsTrigger value="employee" className="gap-1.5 text-xs sm:text-sm">
            <User className="size-3.5" />
            Empleado
          </TabsTrigger>
          <TabsTrigger value="amounts" className="gap-1.5 text-xs sm:text-sm">
            <Banknote className="size-3.5" />
            Montos
          </TabsTrigger>
          <TabsTrigger value="metrics" className="gap-1.5 text-xs sm:text-sm">
            <Clock className="size-3.5" />
            Métricas
          </TabsTrigger>
        </TabsList>

        {/* Employee Tab */}
        <TabsContent value="employee" className="space-y-4">
          <div>
            <div className="space-y-4">
              {/* Employee Selector */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Empleado <span className="text-destructive">*</span>
                </Label>
                <CustomerSelector
                  customers={customerList}
                  value={selectedCustomer}
                  onChange={(customer) =>
                    form.setValue("employee_id", customer?.id || "", {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                  label=""
                  placeholder="Selecciona un empleado"
                  disabled={isSubmitting}
                />
                {form.formState.errors.employee_id && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.employee_id.message}
                  </p>
                )}

                {/* Employee Info Badge */}
                {selectedEmployee && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                      {contractTypeLabels[selectedEmployee.contractType]}
                    </span>
                    {selectedEmployee.baseSalary && (
                      <span className="inline-flex items-center rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium">
                        Base: {formatCurrencyNI(selectedEmployee.baseSalary, Currency.USD)}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Period Dates - Inline */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Inicio</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-10 w-full justify-start font-normal"
                      >
                        <CalendarIcon className="mr-2 size-4 text-muted-foreground" />
                        {formatDateLabel(watchPeriodStart)}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={
                          watchPeriodStart
                            ? parseInputDate(watchPeriodStart)
                            : undefined
                        }
                        onSelect={(date) => {
                          if (!date) return
                          form.setValue("period_start", toInputDate(date), {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                        }}
                        initialFocus
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
                        className="h-10 w-full justify-start font-normal"
                      >
                        <CalendarIcon className="mr-2 size-4 text-muted-foreground" />
                        {formatDateLabel(watchPeriodEnd)}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={
                          watchPeriodEnd
                            ? parseInputDate(watchPeriodEnd)
                            : undefined
                        }
                        onSelect={(date) => {
                          if (!date) return
                          form.setValue("period_end", toInputDate(date), {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {form.formState.errors.period_end && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.period_end.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Amounts Tab */}
        <TabsContent value="amounts" className="space-y-4">
          <div>
            <div className="space-y-4">
              {/* Base + Bonuses + Deductions in grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label
                    htmlFor="base_amount"
                    className="flex items-center gap-1 text-sm font-medium"
                  >
                    <Banknote className="size-3.5" />
                    Base
                  </Label>
                  <div className="flex gap-2">
                    <CurrencySelector
                      value={form.watch("base_amount_currency") || Currency.USD}
                      onChange={(val) => {
                        form.setValue("base_amount_currency", val)
                        form.setValue("bonuses_currency", val)
                        form.setValue("deductions_currency", val)
                      }}
                    />
                    <Input
                      id="base_amount"
                      type="number"
                      min={0}
                      step="0.01"
                      {...form.register("base_amount", { valueAsNumber: true })}
                      className="h-10 text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="bonuses"
                    className="flex items-center gap-1 text-sm font-medium"
                  >
                    <Plus className="text-success size-3.5" />
                    Bonos
                  </Label>
                  <div className="relative flex items-center">
                    <span className="absolute left-2.5 text-xs text-muted-foreground font-medium">
                      {getCurrencySymbol(form.watch("base_amount_currency") || Currency.USD)}
                    </span>
                    <Input
                      id="bonuses"
                      type="number"
                      min={0}
                      step="0.01"
                      {...form.register("bonuses", { valueAsNumber: true })}
                      className="h-10 pl-8 text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="deductions"
                    className="flex items-center gap-1 text-sm font-medium"
                  >
                    <Minus className="size-3.5 text-destructive" />
                    Deducciones
                  </Label>
                  <div className="relative flex items-center">
                    <span className="absolute left-2.5 text-xs text-muted-foreground font-medium">
                      {getCurrencySymbol(form.watch("base_amount_currency") || Currency.USD)}
                    </span>
                    <Input
                      id="deductions"
                      type="number"
                      min={0}
                      step="0.01"
                      {...form.register("deductions", { valueAsNumber: true })}
                      className="h-10 pl-8 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1 text-sm font-medium">
                    <CreditCard className="size-3.5" />
                    Método de pago
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {["cash", "transfer", "other"].map((method) => (
                      <Button
                        key={method}
                        type="button"
                        variant={form.watch("payment_method") === method ? "default" : "outline"}
                        size="sm"
                        onClick={() => form.setValue("payment_method", method as "cash" | "transfer" | "other", { shouldDirty: true })}
                        className="flex-1 min-w-[100px] h-10"
                      >
                        {method === "cash" ? "Efectivo" : method === "transfer" ? "Transferencia" : "Otro"}
                      </Button>
                    ))}
                  </div>
                </div>
            </div>
          </div>
        </TabsContent>

        {/* Metrics Tab */}
        <TabsContent value="metrics" className="space-y-4">
          <div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label
                    htmlFor="pieces_produced"
                    className="flex items-center gap-1 text-sm font-medium"
                  >
                    <Scissors className="text-success size-3.5" />
                    Piezas producidas
                  </Label>
                  <Input
                    id="pieces_produced"
                    type="number"
                    min={0}
                    step="1"
                    placeholder="0"
                    {...form.register("pieces_produced", {
                      valueAsNumber: true,
                    })}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="hours_worked"
                    className="flex items-center gap-1 text-sm font-medium"
                  >
                    <Clock className="text-info size-3.5" />
                    Horas trabajadas
                  </Label>
                  <Input
                    id="hours_worked"
                    type="number"
                    min={0}
                    step="0.25"
                    placeholder="0"
                    {...form.register("hours_worked", { valueAsNumber: true })}
                    className="h-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-medium">
                  Notas
                </Label>
                <Textarea
                  id="notes"
                  rows={3}
                  placeholder="Observaciones del período..."
                  {...form.register("notes")}
                  className="resize-none"
                />
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <div className="mt-6 flex gap-3">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1"
          >
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting} className="flex-1 gap-2">
          {isSubmitting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Banknote className="size-4" />
          )}
          Registrar
        </Button>
      </div>
    </form>
  )
}
