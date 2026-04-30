"use client"

import * as React from "react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ChevronsUpDownIcon, PlusIcon, XIcon, UserPlusIcon, Loader2Icon } from "lucide-react"
import type { PosCustomer } from "@/components/modules/sales/types"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface CustomerSelectorProps {
  customers: PosCustomer[]
  value: PosCustomer | null
  onChange: (customer: PosCustomer | null) => void
  onCustomerCreated?: (customer: PosCustomer) => void
}

function initialsFromName(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

export function CustomerSelector({
  customers,
  value,
  onChange,
  onCustomerCreated,
}: CustomerSelectorProps) {
  const [open, setOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState("")
  const [showCreateForm, setShowCreateForm] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [newCustomerName, setNewCustomerName] = React.useState("")
  const [newCustomerPhone, setNewCustomerPhone] = React.useState("")

  const filteredCustomers = React.useMemo(() => {
    const normalized = searchValue.trim().toLowerCase()

    if (!normalized) {
      return customers
    }

    return customers.filter((customer) => {
      return (
        customer.fullName.toLowerCase().includes(normalized) ||
        String(customer.phone ?? "")
          .toLowerCase()
          .includes(normalized)
      )
    })
  }, [customers, searchValue])

  async function handleCreateCustomer() {
    if (!newCustomerName.trim()) {
      toast.error("Ingresa el nombre del cliente.")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: newCustomerName.trim(),
          phone: newCustomerPhone.trim() || null,
        }),
      })

      const payload = (await response.json()) as {
        success: boolean
        data?: PosCustomer
        error?: string
      }

      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(payload.error ?? "No se pudo crear el cliente.")
      }

      toast.success("Cliente creado correctamente.")
      onCustomerCreated?.(payload.data)
      onChange(payload.data)
      setOpen(false)
      setShowCreateForm(false)
      setSearchValue("")
      setNewCustomerName("")
      setNewCustomerPhone("")
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo crear el cliente."
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-2">
      <Label>Cliente</Label>
      {value ? (
        <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
          <div className="flex items-center gap-2">
            <Avatar size="sm">
              <AvatarFallback>
                {initialsFromName(value.fullName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{value.fullName}</p>
              {value.phone ? (
                <p className="text-xs text-muted-foreground">{value.phone}</p>
              ) : null}
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => onChange(null)}
            aria-label="Quitar cliente"
          >
            <XIcon className="size-4" />
          </Button>
        </div>
      ) : (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between"
            >
              Buscar cliente
              <ChevronsUpDownIcon className="size-4 opacity-60" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-screen p-0 sm:w-104" align="start">
            <Command>
              <CommandInput
                placeholder="Buscar por nombre o telefono..."
                value={searchValue}
                aria-label="Buscar cliente por nombre o telefono"
                onChange={(event) => setSearchValue(event.target.value)}
              />
              <CommandList>
                {filteredCustomers.length === 0 ? (
                  <CommandEmpty>No se encontraron clientes.</CommandEmpty>
                ) : (
                  <CommandGroup>
                    <p className="px-2 py-1 text-xs text-muted-foreground">
                      Clientes
                    </p>
                    {filteredCustomers.map((customer) => (
                      <CommandItem
                        key={customer.id}
                        onClick={() => {
                          onChange(customer)
                          setOpen(false)
                          setSearchValue("")
                        }}
                      >
                        <Avatar size="sm">
                          <AvatarFallback>
                            {initialsFromName(customer.fullName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">
                            {customer.fullName}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {customer.phone || "Sin telefono"}
                          </p>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                <CommandSeparator />

                <CommandGroup>
                  <CommandItem
                    onClick={() => {
                      setShowCreateForm(true)
                      setNewCustomerName(searchValue.trim())
                      setOpen(false) // Close the combobox
                    }}
                    className="font-medium text-brand"
                  >
                    <PlusIcon className="size-4" />
                    Crear nuevo cliente
                  </CommandItem>
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )}

      {/* Sheet for creating a new customer */}
      <Sheet open={showCreateForm} onOpenChange={setShowCreateForm}>
        <SheetContent className="sm:max-w-md w-full p-0 flex flex-col gap-0">
          <SheetHeader className="border-b border-border/70 px-6 py-4 text-left">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                <UserPlusIcon className="size-4 text-primary" />
              </div>
              <div>
                <SheetTitle className="text-base">Nuevo cliente</SheetTitle>
                <SheetDescription className="text-sm">
                  Añade un nuevo cliente para esta orden/venta.
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>
          
          <div className="px-6 py-6 space-y-4 flex-1 overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="customer-name">Nombre completo <span className="text-destructive">*</span></Label>
              <Input
                id="customer-name"
                placeholder="Ej: Juan Perez"
                value={newCustomerName}
                onChange={(event) => setNewCustomerName(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-phone">Telefono</Label>
              <Input
                id="customer-phone"
                placeholder="Ej: 6000-0000"
                value={newCustomerPhone}
                onChange={(event) => setNewCustomerPhone(event.target.value)}
              />
            </div>
          </div>
          
          <SheetFooter className="border-t border-border/70 p-4 sm:flex-row sm:justify-end sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowCreateForm(false)
                setNewCustomerName("")
                setNewCustomerPhone("")
              }}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleCreateCustomer}
              disabled={isSubmitting}
              className="mt-2 sm:mt-0"
            >
              {isSubmitting ? (
                <Loader2Icon className="size-4 animate-spin mr-2" />
              ) : null}
              {isSubmitting ? "Guardando..." : "Guardar cliente"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
