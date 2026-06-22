# Roles, Permisos y Visibilidad

## Modelo de seguridad confirmado

La seguridad combina varias capas:

1. sesión Supabase
2. protección de navegación en `proxy.ts`
3. `requireAuth()` en APIs
4. `requirePermission()` por módulo/acción
5. overrides por usuario en `user_module_permissions`
6. políticas RLS en Supabase

## Roles existentes

Confirmados en `prisma/schema.prisma` y `types/index.ts`:

- `admin`
- `manager`
- `employee`
- `readonly`

## Módulos controlados

Confirmados en `lib/permissions/types.ts`:

- `dashboard`
- `inventory`
- `production`
- `sales`
- `orders`
- `customers`
- `catalog`
- `expenses`
- `payroll`
- `attendance`
- `reports`
- `settings`

## Acciones controladas

- `view`
- `create`
- `edit`
- `delete`
- `export`

## Matriz base resumida

Fuente: `lib/permissions/constants.ts`

### Admin

- Acceso total a todos los módulos y acciones.

### Manager

- Vista del dashboard.
- CRUD o CRUD+export en varios módulos operativos.
- Sin acceso por defecto a `settings`.
- Sin acceso por defecto a `payroll`.

### Employee

- Dashboard de vista.
- Acceso acotado a producción, ventas, catálogo, inventario y asistencia.
- Sin acceso por defecto a pedidos, clientes, gastos, planilla ni settings.
- Algunos alcances dependen de filtros adicionales en APIs.

### Readonly

- Vista de dashboard, inventario, catálogo y reportes.
- Sin permisos de mutación.

## Overrides por usuario

- Tabla: `user_module_permissions`
- Un override reemplaza completamente el bloque de permisos del módulo.
- Se invalida cache con `invalidatePermissions(userId)` al actualizar.

## Archivos donde se controlan permisos

### Resolución y defaults

- `lib/permissions/types.ts`
- `lib/permissions/constants.ts`
- `lib/permissions/resolve.ts`
- `lib/permissions/cache.ts`

### Guards API

- `lib/api/require-permission.ts`
- `lib/api/response.ts`

### Navegación y visibilidad de UI

- `app/(dashboard)/layout.tsx`
- `lib/nav/dashboard-links.ts`

### Persistencia

- `prisma/schema.prisma`
- `supabase/migrations/010_permissions.sql`

## Reglas de visibilidad importantes

- La navegación del sidebar se filtra por permiso `view`.
- El módulo de asistencia cambia etiqueta para `employee` a `Mi Asistencia`.
- Los admins/managers ven badge de permisos pendientes en asistencia.
- Algunas restricciones son más finas en backend que en la navegación.

## Reglas de edición

- No basta con ocultar botones; hay que proteger el endpoint.
- `requirePermission()` es obligatorio para mutaciones del módulo.
- Para cambios sensibles en settings, verificar además si el endpoint usa admin client o actualiza entidades relacionadas.

## Reglas por módulo con atención especial

### Sales

- `employee` puede tener acceso al módulo pero el listado actual se filtra por `createdBy`.

### Reports

- La documentación previa sugería reportes acotados para empleados, pero esto debe validarse endpoint por endpoint.

### Settings

- Controla usuarios, permisos y tasas. Cualquier apertura indebida aquí expone el sistema completo.

### Attendance

- Combina flujos de autoservicio de empleado con vistas administrativas.

## Recomendaciones para no exponer datos sensibles

- Revisar permiso backend antes de abrir una nueva vista o acción.
- Revisar si el endpoint filtra por owner además de permiso.
- Revisar datos devueltos por Prisma `select/include`.
- No confiar en filtros del frontend para ocultar información sensible.
- Revisar RLS si el dato también es accesible por Supabase.

## Pendiente por confirmar

- Cobertura exacta de ownership y filtros finos en todos los endpoints de reportes y asistencia.
- Si existen permisos implícitos fuera de la matriz por convenciones de negocio no codificadas todavía en un helper central.
