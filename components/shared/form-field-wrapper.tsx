import type { Control, FieldPath } from "react-hook-form"
import { InventoryFormValues } from "../modules/inventory/inventory-form"

import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form"

interface FormFieldWrapperProps {
  control: Control<InventoryFormValues>
  name: FieldPath<InventoryFormValues>
  label: string
  required?: boolean
  children: (field: any) => React.ReactNode
}

export function FormFieldWrapper({
  control,
  name,
  label,
  required,
  children,
}: FormFieldWrapperProps) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-sm font-medium text-foreground">
            {label}
            {required && <span className="ml-0.5 text-destructive">*</span>}
          </FormLabel>
          <FormControl>{children(field)}</FormControl>
          <FormMessage className="text-xs" />
        </FormItem>
      )}
    />
  )
}
