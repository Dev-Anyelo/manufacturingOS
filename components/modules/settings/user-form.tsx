"use client"

import * as z from "zod"
import { toast } from "sonner"
import * as React from "react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useForm } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Calendar } from "@/components/ui/calendar"
import { Loader2, CalendarIcon } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { zodResolver } from "@hookform/resolvers/zod"
import type { UserFormData } from "./user-form-sheet"
import { revalidatePaths } from "@/lib/ui/revalidatePaths"
import { UserRole, ContractType, Currency } from "@prisma/client"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// ---------------------------------------------------------------------------
// Zod Schema
// ---------------------------------------------------------------------------

const formSchema = z
  .object({
    id: z.string().optional(),
    email: z
      .string()
      .refine((val) => val === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
        message: "Correo electrónico inválido",
      })
      .optional(),
    full_name: z.string().min(2, "Mínimo 2 caracteres"),
    role: z.nativeEnum(UserRole),
    password: z
      .string()
      .refine((val) => val === "" || val.length >= 8, {
        message: "La contraseña debe tener al menos 8 caracteres",
      })
      .optional(),
    isActive: z.boolean(),
    // Personal fields
    phone: z.string().optional(),
    address: z.string().optional(),
    birthDate: z.date().optional().nullable(),
    // Employee / Labor fields — available for ALL roles
    documentId: z.string().min(1, "La cédula es obligatoria"),
    hireDate: z.date().optional(),
    contractType: z.nativeEnum(ContractType).optional(),
    baseSalary: z.string().optional(),
    baseSalaryCurrency: z.nativeEnum(Currency).optional(),
  })
  .refine(
    (data) => {
      // Password is required for new users
      if (!data.id && (!data.password || data.password === "")) return false
      return true
    },
    {
      message: "La contraseña es obligatoria para nuevos usuarios",
      path: ["password"],
    }
  )
  .refine(
    (data) => {
      if (!data.id && (!data.email || data.email === "")) return false
      return true
    },
    {
      message: "El correo es obligatorio para nuevos usuarios",
      path: ["email"],
    }
  )

type FormValues = z.infer<typeof formSchema>

interface UserFormProps {
  initialData?: UserFormData
  onSuccess?: () => void
}

export function UserForm({ initialData, onSuccess }: UserFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: initialData?.id,
      email: initialData?.email || "",
      full_name: initialData?.fullName || "",
      role: initialData?.role || UserRole.employee,
      password: "",
      isActive: initialData?.isActive ?? true,
      // Personal
      phone: initialData?.phone || "",
      address: initialData?.address || "",
      birthDate: initialData?.birthDate
        ? new Date(initialData.birthDate)
        : undefined,
      // Labor
      documentId: initialData?.employee?.documentId || "",
      hireDate: initialData?.employee?.hireDate
        ? new Date(initialData.employee.hireDate)
        : undefined,
      contractType:
        initialData?.employee?.contractType || ContractType.fixed_salary,
      baseSalary: initialData?.employee?.baseSalary
        ? String(initialData.employee.baseSalary)
        : "",
      baseSalaryCurrency:
        initialData?.employee?.baseSalaryCurrency || Currency.NIO,
    },
  })

  // Re-initialize form when initialData changes
  React.useEffect(() => {
    if (initialData) {
      form.reset({
        id: initialData.id,
        email: initialData.email || "",
        full_name: initialData.fullName || "",
        role: initialData.role || UserRole.employee,
        password: "",
        isActive: initialData.isActive ?? true,
        phone: initialData.phone || "",
        address: initialData.address || "",
        birthDate: initialData.birthDate
          ? new Date(initialData.birthDate)
          : undefined,
        documentId: initialData.employee?.documentId || "",
        hireDate: initialData.employee?.hireDate
          ? new Date(initialData.employee.hireDate)
          : undefined,
        contractType:
          initialData.employee?.contractType || ContractType.fixed_salary,
        baseSalary: initialData.employee?.baseSalary
          ? String(initialData.employee.baseSalary)
          : "",
        baseSalaryCurrency:
          initialData.employee?.baseSalaryCurrency || Currency.NIO,
      })
    }
  }, [initialData, form])

  async function onSubmit(data: FormValues) {
    try {
      setIsSubmitting(true)
      const url = initialData?.id
        ? `/api/settings/users/${initialData.id}`
        : `/api/settings/users`

      const payload = {
        ...data,
        birthDate: data.birthDate
          ? format(data.birthDate, "yyyy-MM-dd")
          : undefined,
        hireDate: data.hireDate
          ? format(data.hireDate, "yyyy-MM-dd")
          : undefined,
        baseSalary: data.baseSalary ? Number(data.baseSalary) : undefined,
        is_active: data.isActive,
      }

      const res = await fetch(url, {
        method: initialData?.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || "Error al guardar el usuario")
      }

      toast.success(
        initialData?.id
          ? "Usuario actualizado exitosamente"
          : "Usuario creado exitosamente. Ahora puedes compartir las credenciales."
      )

      try {
        await revalidatePaths([
          "/settings/users",
          `/settings/users/${initialData?.id || result.data?.id}`,
        ])
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("revalidatePaths failed", e)
      }
      onSuccess?.()
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Error desconocido"
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 px-4">
        {/* ── Section: Información Personal ── */}
        <div>
          <h4 className="mb-3 text-sm font-semibold text-foreground">
            Información Personal
          </h4>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Correo Electrónico</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="usuario@empresa.com"
                      {...field}
                      disabled={!!initialData?.id}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Nombre completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Juan Pérez" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="documentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cédula / Documento *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="001-000000-0000A"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="8888-8888"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="birthDate"
              render={({ field }) => (
                <FormItem className="flex flex-col sm:col-span-2">
                  <FormLabel>Fecha de nacimiento</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PP", { locale: es })
                          ) : (
                            <span>Seleccionar fecha</span>
                          )}
                          <CalendarIcon className="ml-auto size-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value ?? undefined}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                        locale={es}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Dirección</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej: Santa Elena, calle principal, casa #123"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!initialData?.id && (
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Contraseña inicial</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Contraseña segura"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-xs text-pretty">
                      Define una contraseña para acceso inmediato.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
        </div>

        <Separator />

        {/* ── Section: Acceso y Rol ── */}
        <div>
          <h4 className="mb-3 text-sm font-semibold text-foreground">
            Acceso y Rol
          </h4>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Rol en el sistema</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecciona un rol" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={UserRole.admin}>
                        Administrador
                      </SelectItem>
                      <SelectItem value={UserRole.manager}>Gerente</SelectItem>
                      <SelectItem value={UserRole.employee}>
                        Empleado
                      </SelectItem>
                      <SelectItem value={UserRole.readonly}>
                        Solo lectura
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-xs text-pretty">
                    El rol determina los permisos base.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {initialData?.id && (
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 sm:col-span-2">
                    <div className="space-y-0.5">
                      <FormLabel>Estado activo</FormLabel>
                      <FormDescription className="text-xs text-pretty">
                        Los usuarios inactivos no pueden acceder al sistema.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}
          </div>
        </div>

        <Separator />

        {/* ── Section: Información Laboral (ALL roles) ── */}
        <div>
          <h4 className="mb-1 text-sm font-semibold text-foreground">
            Información Laboral
          </h4>
          <p className="mb-3 text-xs text-pretty text-muted-foreground">
            Datos de contrato. Requeridos para habilitar horario y asistencia.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="hireDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Fecha de contratación</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PP", { locale: es })
                          ) : (
                            <span>Seleccionar fecha</span>
                          )}
                          <CalendarIcon className="ml-auto size-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                        locale={es}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contractType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de contrato</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecciona" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="fixed_salary">Salario Fijo</SelectItem>
                      <SelectItem value="per_piece">
                        Por Obra / Destajo
                      </SelectItem>
                      <SelectItem value="hourly">Por Hora</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="baseSalary"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Salario Base</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormField
                      control={form.control}
                      name="baseSalaryCurrency"
                      render={({ field: currencyField }) => (
                        <Select
                          onValueChange={currencyField.onChange}
                          value={currencyField.value}
                        >
                          <FormControl>
                            <SelectTrigger className="w-24">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={Currency.NIO}>NIO</SelectItem>
                            <SelectItem value={Currency.USD}>USD</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex items-center justify-center pt-4">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            {initialData?.id ? "Guardar cambios" : "Crear usuario"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
