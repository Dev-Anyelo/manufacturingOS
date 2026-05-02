"use client"

import type { PosCustomer } from "@/components/modules/sales/types"

import {
  EntitySelector,
  type EntityOption,
} from "@/components/shared/entity-selector"

interface CustomerSelectorProps {
  customers: PosCustomer[]
  value: PosCustomer | null
  onChange: (customer: PosCustomer | null) => void
  onCustomerCreated?: (customer: PosCustomer) => void
  label?: string
  placeholder?: string
  disabled?: boolean
}

export function CustomerSelector({
  customers,
  value,
  onChange,
  onCustomerCreated,
  label = "Cliente",
  placeholder = "Buscar cliente...",
  disabled = false,
}: CustomerSelectorProps) {
  const handleChange = (id: string | null) => {
    if (!id) {
      onChange(null)
      return
    }
    const customer = customers.find((c) => c.id === id) || null
    onChange(customer)
  }

  const handleCreated = (entity: EntityOption) => {
    const customer: PosCustomer = {
      id: entity.id,
      fullName: entity.fullName,
      phone: entity.phone,
      email: entity.email,
    }
    onCustomerCreated?.(customer)
  }

  return (
    <EntitySelector
      entities={customers as EntityOption[]}
      value={value?.id || null}
      onChange={handleChange}
      label={label}
      placeholder={placeholder}
      emptyMessage="No se encontraron clientes."
      disabled={disabled}
    />
  )
}
