import * as React from "react"
import { cn } from "@/lib/utils"
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
  if (!from) return ""
  const fmt = new Intl.DateTimeFormat("es-PA", {
    day: "2-digit",
    month: "short",
  })
  return from && to
    ? `${fmt.format(from)} – ${fmt.format(to)}`
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
  const isDesktop = useMediaQuery("(min-width: 768px)")

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
    { label: "Hoy", action: () => setRange(today, today) },
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

  const hasSelection = !!from

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
        >
          <CalendarDaysIcon className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate">
            {hasSelection ? formatLabel(from, to) : placeholder}
          </span>
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-auto rounded-xl border-border/40 bg-popover/95 p-0 shadow-xl backdrop-blur-sm mr-9"
      >
        <div className="flex flex-col">
          {/* Quick presets */}
          {presets && (
            <div className="flex gap-1.5 border-b border-border/40 px-3 py-2.5">
              {quickRanges.map((r) => {
                const isActive =
                  r.label === "Hoy" &&
                  from?.getTime() === today.getTime() &&
                  to?.getTime() === today.getTime()
                return (
                  <Button
                    key={r.label}
                    type="button"
                    size="sm"
                    onClick={r.action}
                    variant={isActive ? "default" : "outline"}
                  >
                    {r.label}
                  </Button>
                )
              })}
            </div>
          )}

          {/* Calendar */}
          <div className="px-2 py-2">
            <Calendar
              mode="range"
              selected={selectedRange}
              onSelect={(range) => {
                setRange(range?.from, range?.to)
                if (range?.from && range?.to) setOpen(false)
              }}
              numberOfMonths={isDesktop ? 2 : 1}
              className="pointer-events-auto p-0"
              classNames={{
                months: "flex flex-col sm:flex-row gap-3",
                month: "space-y-2",
                caption: "flex justify-center relative items-center h-8",
                caption_label: "text-sm font-semibold tracking-tight",
                nav_button:
                  "h-7 w-7 bg-transparent p-0 text-muted-foreground hover:text-foreground hover:bg-accent inline-flex items-center justify-center rounded-lg transition-colors",
                nav_button_previous: "absolute left-0",
                nav_button_next: "absolute right-0",
                table: "w-full border-collapse",
                head_row: "flex",
                head_cell:
                  "text-muted-foreground/70 w-8 font-medium text-[11px] uppercase tracking-wider",
                row: "flex w-full mt-0.5",
                cell: cn(
                  "relative h-8 w-8 p-0 text-center text-sm focus-within:relative focus-within:z-20",
                  "[&:has([aria-selected])]:rounded-none [&:has([aria-selected])]:bg-accent/60",
                  "first:[&:has([aria-selected])]:rounded-l-lg last:[&:has([aria-selected])]:rounded-r-lg",
                  "[&:has([aria-selected].day-range-end)]:rounded-r-lg",
                  "[&:has([aria-selected].day-outside)]:bg-accent/30"
                ),
                day: cn(
                  "h-8 w-8 rounded-lg p-0 text-sm font-normal transition-colors",
                  "inline-flex items-center justify-center",
                  "hover:bg-accent hover:text-accent-foreground",
                  "aria-selected:opacity-100"
                ),
                day_range_end: "day-range-end",
                day_selected:
                  "bg-primary text-primary-foreground shadow-sm hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                day_today: "bg-accent text-accent-foreground font-semibold",
                day_outside:
                  "day-outside text-muted-foreground/40 aria-selected:bg-accent/30 aria-selected:text-muted-foreground/60",
                day_disabled: "text-muted-foreground/30",
                day_range_middle:
                  "aria-selected:bg-transparent aria-selected:text-foreground",
                day_hidden: "invisible",
              }}
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-border/40 px-3 py-2">
            <span className="text-xs text-muted-foreground">
              {hasSelection ? formatLabel(from, to) : "Sin selección"}
            </span>
            <Button
              type="button"
              onClick={() => {
                setRange(undefined, undefined)
                setOpen(false)
              }}
              variant="outline"
              size="sm"
            >
              Limpiar
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
