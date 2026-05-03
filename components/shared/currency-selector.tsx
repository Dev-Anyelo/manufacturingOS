"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Currency } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { Check, ChevronsUpDown } from "lucide-react"

import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

const currencies = [
  { label: "Dólares (USD)", value: "USD" as Currency },
  { label: "Córdobas (C$)", value: "NIO" as Currency },
]

interface CurrencySelectorProps {
  value: Currency
  onChange: (value: Currency) => void
  disabled?: boolean
  className?: string
  variant?: "outline" | "ghost" | "secondary"
}

export function CurrencySelector({
  value,
  onChange,
  disabled,
  className,
  variant = "outline",
}: CurrencySelectorProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={variant}
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn("w-[90px] justify-between px-3 font-bold", className)}
        >
          {value}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-50 p-0">
        <Command>
          <CommandList>
            <CommandGroup>
              {currencies.map((currency) => (
                <CommandItem
                  key={currency.value}
                  value={currency.value}
                  onClick={() => {
                    onChange(currency.value)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === currency.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {currency.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
