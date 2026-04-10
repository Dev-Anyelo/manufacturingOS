"use client"

import * as React from "react"
import { CalendarDaysIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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

function formatDateInput(value?: Date) {
  if (!value) {
    return ""
  }

  const year = value.getFullYear()
  const month = `${value.getMonth() + 1}`.padStart(2, "0")
  const day = `${value.getDate()}`.padStart(2, "0")
  return `${year}-${month}-${day}`
}

function formatLabel(from?: Date, to?: Date) {
  if (!from && !to) {
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

  return from ? fmt.format(from) : fmt.format(to as Date)
}

export function DateRangePicker({
  from,
  to,
  onChange,
  placeholder = "Seleccionar rango",
  presets = true,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false)

  const today = new Date()

  function setRange(nextFrom?: Date, nextTo?: Date) {
    onChange({ from: nextFrom, to: nextTo })
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="h-9 w-full justify-start gap-2 text-left font-normal sm:w-auto"
        >
          <CalendarDaysIcon className="size-4 text-muted-foreground" />
          <span>{formatLabel(from, to) || placeholder}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[20rem] space-y-3 rounded-xl border-border/60 p-4"
        align="start"
      >
        {presets ? (
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRange(today, today)}
            >
              Hoy
            </Button>
            <Button
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

        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Desde</label>
          <Input
            type="date"
            value={formatDateInput(from)}
            onChange={(event) => {
              const value = event.target.value
              setRange(value ? new Date(`${value}T00:00:00`) : undefined, to)
            }}
            className="h-9"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Hasta</label>
          <Input
            type="date"
            value={formatDateInput(to)}
            onChange={(event) => {
              const value = event.target.value
              setRange(from, value ? new Date(`${value}T00:00:00`) : undefined)
            }}
            className="h-9"
          />
        </div>

        <div className="flex justify-end">
          <Button
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
