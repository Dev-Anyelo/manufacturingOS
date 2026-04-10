"use client"

import * as React from "react"
import {
  Controller,
  type Control,
  type ControllerRenderProps,
  type FieldValues,
} from "react-hook-form"

import { Label } from "@/components/ui/label"

interface FormFieldWrapperProps {
  control: Control<FieldValues>
  name: string
  label: string
  required?: boolean
  description?: string
  children: (
    field: ControllerRenderProps<FieldValues, string>
  ) => React.ReactNode
}

export function FormFieldWrapper({
  control,
  name,
  label,
  required = false,
  description,
  children,
}: FormFieldWrapperProps) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <div className="space-y-2">
          <Label htmlFor={field.name} className="text-sm font-medium">
            {label}
            {required ? <span className="ml-1 text-red-500">*</span> : null}
          </Label>
          {children(field)}
          {description ? (
            <p className="text-xs text-muted-foreground">{description}</p>
          ) : null}
          {fieldState.error?.message ? (
            <p className="text-xs text-red-600 dark:text-red-400">
              {fieldState.error.message}
            </p>
          ) : null}
        </div>
      )}
    />
  )
}
