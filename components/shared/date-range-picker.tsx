import * as React from "react"
import { CalendarDaysIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useMediaQuery } from "@/hooks/use-mobile"
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
  if (!from) return "Seleccionar rango"
  const fmt = new Intl.DateTimeFormat("es-PA", {
    day: "2-digit",
    month: "short",
  })
  return from && to
    ? `${fmt.format(from)} - ${fmt.format(to)}`
    : fmt.format(from)
}

export function DateRangePicker({
  from,
  to,
  onChange,
  placeholder = "Seleccionar rango",
  presets = true,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false)
  const isDesktop = useMediaQuery("(min-width: 1024px)")

  const today = React.useMemo(() => toDateOnly(new Date()), [])

  const selectedRange = React.useMemo(
    () => ({
      from: from ? toDateOnly(from) : undefined,
      to: to ? toDateOnly(to) : undefined,
    }),
    [from, to]
  )

  function setRange(nextFrom?: Date, nextTo?: Date) {
    onChange({ from: nextFrom, to: nextTo })
  }

  const quickRanges = [
    {
      label: "Hoy",
      action: () => setRange(today, today),
    },
    {
      label: "Semana",
      action: () => {
        const start = new Date(today)
        const day = today.getDay() || 7
        start.setDate(today.getDate() - day + 1)
        setRange(start, today)
      },
    },
    {
      label: "Mes",
      action: () => {
        const start = new Date(today.getFullYear(), today.getMonth(), 1)
        setRange(start, today)
      },
    },
    {
      label: "30d",
      action: () => {
        const start = new Date(today)
        start.setDate(today.getDate() - 29)
        setRange(start, today)
      },
    },
  ]

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline">
          <CalendarDaysIcon className="size-4 text-muted-foreground" />
          <span className="truncate">
            {from ? formatLabel(from, to) : placeholder}
          </span>
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-[95vw] max-w-105 rounded-2xl p-0 shadow-xl sm:w-auto lg:max-w-162.5 sm:mr-6"
      >
        <div className="flex flex-col gap-2 p-3">
          {/* Quick ranges compactos */}
          {presets && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {quickRanges.map((r) => (
                <Button
                  key={r.label}
                  variant="secondary"
                  size="sm"
                  className="h-7 px-2 text-xs whitespace-nowrap"
                  onClick={r.action}
                >
                  {r.label}
                </Button>
              ))}
            </div>
          )}

          {/* Calendar */}
          <div className="flex justify-center">
            <Calendar
              mode="range"
              selected={selectedRange}
              onSelect={(range) => {
                setRange(range?.from, range?.to)
                if (range?.from && range?.to) setOpen(false)
              }}
              numberOfMonths={isDesktop ? 2 : 1}
              className="scale-[0.95] sm:scale-100"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-muted-foreground">
              {from ? formatLabel(from, to) : "Sin selección"}
            </span>

            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                setRange(undefined, undefined)
                setOpen(false)
              }}
            >
              Limpiar
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
