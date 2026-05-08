"use client"

import * as z from "zod"
import { toast } from "sonner"
import * as React from "react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { CalendarIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { zodResolver } from "@hookform/resolvers/zod"
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
    documentId: z.string().optional(),
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
      // Email is required for new users
      if (!data.id && (!data.email || data.email === "")) return false
      return true
    },
    {
      message: "El correo es obligatorio para nuevos usuarios",
      path: ["email"],
    }
  )
  .refine(
    (data) => {
      if (
        data.role === UserRole.employee &&
        (!data.documentId || !data.hireDate)
      )
        return false
      return true
    },
    {
      message: "Cédula y Fecha de contratación son obligatorias para empleados",
      path: ["documentId"],
    }
  )

type FormValues = z.infer<typeof formSchema>

type UserFormProps = {
  initialData?: Record<string, unknown> & {
    id?: string
    email?: string | null
    fullName?: string | null
    role?: UserRole
    employee?: {
      documentId: string | null
      hireDate: Date | string
      contractType: ContractType
      baseSalary: number | string | null | any
      baseSalaryCurrency: Currency | null
    } | null
  }
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
      documentId: initialData?.employee?.documentId || "",
      hireDate: initialData?.employee?.hireDate
        ? new Date(initialData.employee.hireDate)
        : undefined,
      contractType: initialData?.employee?.contractType || "fixed_salary",
      baseSalary: initialData?.employee?.baseSalary
        ? String(initialData.employee.baseSalary)
        : "",
      baseSalaryCurrency: initialData?.employee?.baseSalaryCurrency || "NIO",
    },
  })

  const selectedRole = form.watch("role")

  async function onSubmit(data: FormValues) {
    try {
      setIsSubmitting(true)
      const url = initialData
        ? `/api/settings/users/${initialData.id}`
        : `/api/settings/users`

      const payload = {
        ...data,
        hireDate: data.hireDate
          ? format(data.hireDate, "yyyy-MM-dd")
          : undefined,
        baseSalary: data.baseSalary ? Number(data.baseSalary) : undefined,
      }

      const res = await fetch(url, {
        method: initialData ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || "Error al guardar el usuario")
      }

      toast.success(
        initialData
          ? "Usuario actualizado exitosamente"
          : "Usuario creado exitosamente. Ahora puedes compartir las credenciales."
      )

      try {
        await revalidatePaths(["/settings/users"])
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("revalidatePaths failed", e)
      }
      if (onSuccess) {
        onSuccess()
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown error"
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-3">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {!initialData && (
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Correo Electrónico</FormLabel>
                  <FormControl>
                    <Input placeholder="usuario@empresa.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="full_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre completo</FormLabel>
                <FormControl>
                  <Input placeholder="Juan Pérez" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {!initialData && (
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña inicial</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Contraseña segura"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-[11px] text-pretty">
                    Define una contraseña para acceso inmediato.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rol en el sistema</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
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
                    <SelectItem value={UserRole.employee}>Empleado</SelectItem>
                    <SelectItem value={UserRole.readonly}>
                      Solo lectura
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription className="text-[11px] text-pretty">
                  El rol determina los permisos base.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {selectedRole === UserRole.employee && (
          <div className="mt-4 space-y-4">
            <h4 className="text-sm font-medium">Datos de Empleado</h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="documentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cédula / Identidad *</FormLabel>
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
                name="hireDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha Contratación *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
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
                    <FormLabel>Tipo de Contrato</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecciona" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="fixed_salary">
                          Salario Fijo
                        </SelectItem>
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
                  <FormItem>
                    <FormLabel>Salario Base (Opcional)</FormLabel>
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
                            defaultValue={currencyField.value}
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
        )}

        <div className="flex items-center justify-center pt-4">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            {initialData ? "Guardar cambios" : "Crear usuario"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
