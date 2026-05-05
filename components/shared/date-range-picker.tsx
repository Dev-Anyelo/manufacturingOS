"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { es } from "date-fns/locale"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useIsMobile } from "@/hooks/use-mobile"
import type { DateRange } from "react-day-picker"
import { Calendar } from "@/components/ui/calendar"
import { Separator } from "@/components/ui/separator"
import { CalendarDaysIcon, ChevronRightIcon, XIcon } from "lucide-react"

import {
  format,
  isValid,
  parse,
  startOfDay,
  startOfMonth,
  endOfMonth,
  subDays,
  subMonths,
} from "date-fns"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export interface DateRangePickerProps {
  from?: Date
  to?: Date
  onChange: (range: { from?: Date; to?: Date }) => void
  placeholder?: string
  /** Mostrar la lista de presets */
  presets?: boolean
  /** Permitir entrada manual mediante inputs */
  manualInput?: boolean
  /** Etiqueta accesible para el botón disparador */
  ariaLabel?: string
  /** Deshabilitar el componente */
  disabled?: boolean
  /** Clases adicionales para el botón disparador */
  className?: string
}

interface PresetDef {
  id: string
  label: string
  description?: string
  range: () => { from: Date; to: Date }
}

/* -------------------------------------------------------------------------- */
/*                                  Helpers                                   */
/* -------------------------------------------------------------------------- */

const INPUT_FORMAT = "dd/MM/yyyy"

function toDateOnly(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate())
}

function isSameDay(a?: Date, b?: Date) {
  if (!a || !b) return false
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function formatTriggerLabel(from?: Date, to?: Date) {
  if (!from) return ""
  if (from && to && !isSameDay(from, to)) {
    const sameYear = from.getFullYear() === to.getFullYear()
    const sameMonth = sameYear && from.getMonth() === to.getMonth()
    if (sameMonth) {
      return `${format(from, "d", { locale: es })} – ${format(to, "d 'de' MMM, yyyy", { locale: es })}`
    }
    if (sameYear) {
      return `${format(from, "d MMM", { locale: es })} – ${format(to, "d MMM, yyyy", { locale: es })}`
    }
    return `${format(from, "d MMM yyyy", { locale: es })} – ${format(to, "d MMM yyyy", { locale: es })}`
  }
  return format(from, "d 'de' MMMM, yyyy", { locale: es })
}

function buildPresets(today: Date): PresetDef[] {
  return [
    {
      id: "today",
      label: "Hoy",
      range: () => ({ from: today, to: today }),
    },
    {
      id: "yesterday",
      label: "Ayer",
      range: () => {
        const y = subDays(today, 1)
        return { from: y, to: y }
      },
    },
    {
      id: "last7",
      label: "Últimos 7 días",
      range: () => ({ from: subDays(today, 6), to: today }),
    },
    {
      id: "last30",
      label: "Últimos 30 días",
      range: () => ({ from: subDays(today, 29), to: today }),
    },
    {
      id: "thisMonth",
      label: "Este mes",
      range: () => ({ from: startOfMonth(today), to: today }),
    },
    {
      id: "lastMonth",
      label: "Mes pasado",
      range: () => {
        const ref = subMonths(today, 1)
        return { from: startOfMonth(ref), to: endOfMonth(ref) }
      },
    },
  ]
}

function detectActivePreset(
  presets: PresetDef[],
  from?: Date,
  to?: Date
): string | null {
  if (!from || !to) return null
  for (const p of presets) {
    const r = p.range()
    if (isSameDay(r.from, from) && isSameDay(r.to, to)) return p.id
  }
  return null
}

/* -------------------------------------------------------------------------- */
/*                              Manual date input                             */
/* -------------------------------------------------------------------------- */

interface DateInputProps {
  label: string
  value?: Date
  onCommit: (date?: Date) => void
  /** Fecha mínima permitida (para validar el "to") */
  min?: Date
  /** Fecha máxima permitida (para validar el "from") */
  max?: Date
}

function DateInput({ label, value, onCommit, min, max }: DateInputProps) {
  const [text, setText] = React.useState<string>(
    value ? format(value, INPUT_FORMAT, { locale: es }) : ""
  )
  const [error, setError] = React.useState<string | null>(null)

  // Sync external value -> input
  React.useEffect(() => {
    setText(value ? format(value, INPUT_FORMAT, { locale: es }) : "")
    setError(null)
  }, [value])

  function commit(raw: string) {
    const trimmed = raw.trim()
    if (!trimmed) {
      setError(null)
      onCommit(undefined)
      return
    }
    const parsed = parse(trimmed, INPUT_FORMAT, new Date(), { locale: es })
    if (!isValid(parsed)) {
      setError("Formato inválido")
      return
    }
    if (min && parsed < toDateOnly(min)) {
      setError("Fecha fuera de rango")
      return
    }
    if (max && parsed > toDateOnly(max)) {
      setError("Fecha fuera de rango")
      return
    }
    setError(null)
    onCommit(toDateOnly(parsed))
  }

  return (
    <div className="flex-1 space-y-1.5">
      <Label className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </Label>
      <Input
        inputMode="numeric"
        placeholder="dd/mm/aaaa"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault()
            commit((e.target as HTMLInputElement).value)
          }
        }}
        aria-invalid={!!error}
        className={cn(
          "h-9 font-mono text-sm tabular-nums",
          error && "border-destructive focus-visible:ring-destructive/30"
        )}
      />
      {error ? <p className="text-[11px] text-destructive">{error}</p> : null}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                Inner panel                                 */
/* -------------------------------------------------------------------------- */

interface PanelProps {
  draftRange: DateRange | undefined
  setDraftRange: (r: DateRange | undefined) => void
  presets: PresetDef[]
  activePreset: string | null
  applyPreset: (p: PresetDef) => void
  manualInput: boolean
  numberOfMonths: 1 | 2
  onApply: () => void
  onClear: () => void
  onCancel: () => void
  layout: "popover" | "drawer"
}

function Panel({
  draftRange,
  setDraftRange,
  presets,
  activePreset,
  applyPreset,
  manualInput,
  numberOfMonths,
  onApply,
  onClear,
  onCancel,
  layout,
}: PanelProps) {
  const summary = React.useMemo(() => {
    if (!draftRange?.from) return "Sin selección"
    return formatTriggerLabel(draftRange.from, draftRange.to)
  }, [draftRange])

  const canApply = !!draftRange?.from && !!draftRange?.to

  return (
    <div
      className={cn(
        "flex flex-col",
        layout === "popover" && "md:flex-row md:divide-x md:divide-border/60"
      )}
    >
      {/* Sidebar de presets */}
      <div
        className={cn(
          "flex shrink-0 flex-col gap-0.5 p-2",
          layout === "popover"
            ? "border-b border-border/60 md:w-44 md:border-b-0"
            : "border-b border-border/60"
        )}
      >
        <div className="px-2 pt-1 pb-1.5">
          <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            Rangos rápidos
          </p>
        </div>
        <div
          className={cn(
            "flex gap-1",
            layout === "popover" ? "md:flex-col" : "flex-wrap"
          )}
        >
          {presets.map((p) => {
            const isActive = activePreset === p.id
            return (
              <Button
                key={p.id}
                type="button"
                size="sm"
                variant={isActive ? "secondary" : "ghost"}
                onClick={() => applyPreset(p)}
                className={cn(
                  "justify-start text-sm font-medium",
                  layout === "popover" && "md:w-full"
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "size-1.5 rounded-full bg-muted-foreground/40 transition-colors",
                    isActive && "bg-primary"
                  )}
                />
                {p.label}
              </Button>
            )
          })}
        </div>
      </div>

      {/* Calendario + inputs */}
      <div className="flex min-w-0 flex-1 flex-col">
        {manualInput && (
          <div className="flex items-end gap-2 border-b border-border/60 p-3">
            <DateInput
              label="Desde"
              value={draftRange?.from}
              max={draftRange?.to}
              onCommit={(d) =>
                setDraftRange({
                  from: d,
                  to: draftRange?.to,
                })
              }
            />
            <div className="mb-2.5 text-muted-foreground">
              <ChevronRightIcon className="size-4" />
            </div>
            <DateInput
              label="Hasta"
              value={draftRange?.to}
              min={draftRange?.from}
              onCommit={(d) =>
                setDraftRange({
                  from: draftRange?.from,
                  to: d,
                })
              }
            />
          </div>
        )}

        <div className="flex justify-center px-2 py-2">
          <Calendar
            mode="range"
            locale={es}
            weekStartsOn={1}
            selected={draftRange}
            onSelect={(range) => setDraftRange(range)}
            numberOfMonths={numberOfMonths}
            showOutsideDays
            className="p-0"
            captionLayout="dropdown"
          />
        </div>

        <Separator />

        <div className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              Selección
            </p>
            <p className="truncate text-sm font-medium tabular-nums">
              {summary}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClear}
              disabled={!draftRange?.from && !draftRange?.to}
            >
              Limpiar
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCancel}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={onApply}
              disabled={!canApply}
            >
              Aplicar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                            Main component export                           */
/* -------------------------------------------------------------------------- */

export function DateRangePicker({
  from,
  to,
  onChange,
  placeholder = "Seleccionar rango",
  presets = true,
  manualInput = true,
  ariaLabel = "Seleccionar rango de fechas",
  disabled,
  className,
}: DateRangePickerProps) {
  const isMobile = useIsMobile()
  const [open, setOpen] = React.useState(false)
  const [isWide, setIsWide] = React.useState(true)

  const today = React.useMemo(() => startOfDay(new Date()), [])
  const presetList = React.useMemo(() => buildPresets(today), [today])

  // Detectar viewport ancho para mostrar 2 meses en popover
  React.useEffect(() => {
    if (typeof window === "undefined") return
    const mql = window.matchMedia("(min-width: 720px)")
    const onChange = () => setIsWide(mql.matches)
    onChange()
    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  // Estado "borrador" mientras el popover está abierto.
  // Sólo se confirma al hacer "Aplicar" o al elegir un preset.
  const [draftRange, setDraftRange] = React.useState<DateRange | undefined>(
    from || to ? { from, to } : undefined
  )

  // Sincronizar al abrir
  React.useEffect(() => {
    if (open) {
      setDraftRange(from || to ? { from, to } : undefined)
    }
  }, [open, from, to])

  const activePreset = React.useMemo(
    () => detectActivePreset(presetList, draftRange?.from, draftRange?.to),
    [presetList, draftRange]
  )

  const hasSelection = !!from
  const triggerLabel = hasSelection ? formatTriggerLabel(from, to) : placeholder

  function handleApply() {
    onChange({
      from: draftRange?.from,
      to: draftRange?.to ?? draftRange?.from,
    })
    setOpen(false)
  }

  function handleClear() {
    setDraftRange(undefined)
  }

  function handleCancel() {
    setDraftRange(from || to ? { from, to } : undefined)
    setOpen(false)
  }

  function handleApplyPreset(p: PresetDef) {
    const r = p.range()
    setDraftRange(r)
    onChange(r)
    setOpen(false)
  }

  function handleQuickClear(e: React.MouseEvent) {
    e.stopPropagation()
    onChange({ from: undefined, to: undefined })
  }

  function renderTrigger(extraOnClick?: () => void) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={extraOnClick}
        className={cn(
          "group h-9 w-full min-w-50 justify-between gap-2 px-3 font-normal sm:w-auto",
          !hasSelection && "text-muted-foreground",
          className
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          <CalendarDaysIcon
            className={cn(
              "size-4 shrink-0 text-muted-foreground transition-colors",
              hasSelection && "text-foreground"
            )}
            aria-hidden
          />
          <span className="truncate text-sm">{triggerLabel}</span>
        </span>
        {hasSelection ? (
          <span
            role="button"
            tabIndex={0}
            aria-label="Limpiar selección"
            onClick={handleQuickClear}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ")
                handleQuickClear(e as never)
            }}
            className={cn(
              "ml-1 inline-flex size-5 shrink-0 items-center justify-center rounded-md",
              "text-muted-foreground/70 hover:bg-accent hover:text-foreground"
            )}
          >
            <XIcon className="size-3.5" aria-hidden />
          </span>
        ) : (
          <ChevronRightIcon
            className="size-4 shrink-0 text-muted-foreground/70 transition-transform group-data-[state=open]:rotate-90"
            aria-hidden
          />
        )}
      </Button>
    )
  }

  /* Mobile -> Drawer */
  if (isMobile) {
    return (
      <>
        {renderTrigger(() => !disabled && setOpen(true))}
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerContent className="px-0 pb-2">
            <DrawerHeader className="px-4 pb-2 text-left">
              <DrawerTitle className="text-base">Seleccionar rango</DrawerTitle>
              <DrawerDescription className="text-xs">
                Elige un rango rápido o escoge fechas en el calendario.
              </DrawerDescription>
            </DrawerHeader>
            <Panel
              draftRange={draftRange}
              setDraftRange={setDraftRange}
              presets={presets ? presetList : []}
              activePreset={activePreset}
              applyPreset={handleApplyPreset}
              manualInput={manualInput}
              numberOfMonths={1}
              onApply={handleApply}
              onClear={handleClear}
              onCancel={handleCancel}
              layout="drawer"
            />
          </DrawerContent>
        </Drawer>
      </>
    )
  }

  /* Desktop -> Popover */
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{renderTrigger()}</PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        className={cn(
          "w-auto overflow-hidden rounded-xl border-border/60 p-0 shadow-xl",
          "max-w-[calc(100vw-2rem)]"
        )}
      >
        <Panel
          draftRange={draftRange}
          setDraftRange={setDraftRange}
          presets={presets ? presetList : []}
          activePreset={activePreset}
          applyPreset={handleApplyPreset}
          manualInput={manualInput}
          numberOfMonths={isWide ? 2 : 1}
          onApply={handleApply}
          onClear={handleClear}
          onCancel={handleCancel}
          layout="popover"
        />
      </PopoverContent>
    </Popover>
  )
}
