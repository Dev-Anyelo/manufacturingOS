"use client"

import * as z from "zod"
import * as React from "react"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { UserRole } from "@prisma/client"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { zodResolver } from "@hookform/resolvers/zod"

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
    email: z.string().email("Correo electrónico inválido"),
    full_name: z.string().min(2, "Mínimo 2 caracteres"),
    role: z.nativeEnum(UserRole),
    password: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres")
      .optional(),
  })
  .refine(
    (data) => {
      // Password is required for new users
      if (!data.id && !data.password) return false
      return true
    },
    {
      message: "La contraseña es obligatoria para nuevos usuarios",
      path: ["password"],
    }
  )

type FormValues = z.infer<typeof formSchema>

type UserFormProps = {
  initialData?: any
  onSuccess?: () => void
}

export function UserForm({ initialData, onSuccess }: UserFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: initialData?.id,
      email: initialData?.email || "",
      full_name: initialData?.fullName || "",
      role: initialData?.role || UserRole.employee,
      password: "",
    },
  })

  async function onSubmit(data: FormValues) {
    try {
      setIsSubmitting(true)
      const url = initialData
        ? `/api/settings/users/${initialData.id}`
        : `/api/settings/users`

      const res = await fetch(url, {
        method: initialData ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
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

      router.refresh()
      onSuccess?.()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-3">
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
                <FormDescription className="text-pretty">
                  Define una contraseña para que el usuario pueda acceder de
                  inmediato.
                </FormDescription>
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

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rol en el sistema</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full text-sm">
                    <SelectValue placeholder="Selecciona un rol" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={UserRole.admin}>Administrador</SelectItem>
                  <SelectItem value={UserRole.manager}>Gerente</SelectItem>
                  <SelectItem value={UserRole.employee}>Empleado</SelectItem>
                  <SelectItem value={UserRole.readonly}>
                    Solo lectura
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormDescription className="text-pretty">
                El rol determina los permisos base del usuario.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end pt-4">
          <Button
            type="submit"
            className="w-full sm:w-auto"
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            {initialData ? "Guardar cambios" : "Crear usuario"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
