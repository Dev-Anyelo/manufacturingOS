"use client"

import * as React from "react"
import { CalendarDaysIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { DateRange } from "react-day-picker"
import { Calendar } from "@/components/ui/calendar"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DateRangePickerProps {
  from?: Date
  to?: Date
  onChange: (range: { from?: Date; to?: Date }) => void
  placeholder?: string
  presets?: boolean
}

function toDateOnly(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate())
}

function formatLabel(from?: Date, to?: Date) {
  if (!from) {
    return "Seleccionar rango"
  }

  const fmt = new Intl.DateTimeFormat("es-PA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })

  if (from && to) {
    return `${fmt.format(from)} - ${fmt.format(to)}`
  }

  return fmt.format(from)
}

export function DateRangePicker({
  from,
  to,
  onChange,
  placeholder = "Seleccionar rango",
  presets = true,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false)

  const today = React.useMemo(() => toDateOnly(new Date()), [])
  const selectedRange = React.useMemo<DateRange>(
    () => ({
      from: from ? toDateOnly(from) : undefined,
      to: to ? toDateOnly(to) : undefined,
    }),
    [from, to]
  )

  function setRange(nextFrom?: Date, nextTo?: Date) {
    onChange({ from: nextFrom, to: nextTo })
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-9 w-full justify-start gap-2 text-left font-normal sm:w-auto"
          aria-label="Seleccionar rango de fechas"
        >
          <CalendarDaysIcon className="size-4 text-muted-foreground" />
          <span>{from ? formatLabel(from, to) : placeholder}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto space-y-3 rounded-xl border-border/60 p-3"
        align="start"
      >
        {presets ? (
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setRange(today, today)}
            >
              Hoy
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                const start = new Date(today)
                const day = today.getDay() || 7
                start.setDate(today.getDate() - day + 1)
                start.setHours(0, 0, 0, 0)
                setRange(start, today)
              }}
            >
              Esta semana
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                const start = new Date(today.getFullYear(), today.getMonth(), 1)
                setRange(start, today)
              }}
            >
              Este mes
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                const start = new Date(today)
                start.setDate(today.getDate() - 29)
                start.setHours(0, 0, 0, 0)
                setRange(start, today)
              }}
            >
              Ultimos 30 dias
            </Button>
          </div>
        ) : null}

        <div className="rounded-lg border border-border/50 bg-card p-1">
          <Calendar
            mode="range"
            selected={selectedRange}
            onSelect={(range) => {
              setRange(range?.from, range?.to)
              if (range?.from && range?.to) {
                setOpen(false)
              }
            }}
            numberOfMonths={1}
            initialFocus
          />
        </div>

        <div className="flex justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setRange(undefined, undefined)
              setOpen(false)
            }}
          >
            Limpiar
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
