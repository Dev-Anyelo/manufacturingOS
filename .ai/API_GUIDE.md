# Guía de APIs

## Estructura general

Las APIs internas viven en `app/api/` y están organizadas por dominio:

- `attendance`
- `catalog`
- `cron`
- `customers`
- `expenses`
- `inventory`
- `notifications`
- `orders`
- `payroll`
- `production`
- `reports`
- `sales`
- `settings`
- `storage`
- `revalidate`

## Patrón base observado

Muchos endpoints siguen este patrón:

1. `requireAuth()`
2. `requirePermission(profile, module, action)`
3. validación con Zod si hay body
4. operación Prisma
5. `apiSuccess(...)` o `handleApiError(...)`

Archivos clave:

- `lib/api/response.ts`
- `lib/api/require-permission.ts`
- `lib/api/utils.ts`

## Autenticación

- Las APIs no dependen del `proxy.ts`.
- La autenticación server-side se resuelve vía Supabase usando `createServerSupabaseClient()`.
- `requireAuth()` también valida que exista `profile` y esté activo.

## Autorización

- La autorización estándar se aplica con `requirePermission(profile, module, action)`.
- El módulo y acción deben existir en `lib/permissions/types.ts`.
- Algunos endpoints aplican restricciones adicionales por rol o por ownership dentro del mismo handler.

## Formato de respuesta

Cuando se usa el helper estándar:

### Éxito

```json
{
  "success": true,
  "data": {}
}
```

### Error

```json
{
  "success": false,
  "error": "mensaje"
}
```

## Manejo de errores

- `ApiRouteError` permite responder con status controlado.
- `handleApiError()` centraliza errores esperados e inesperados.
- No todos los endpoints viejos siguen el mismo patrón; por ejemplo algunos de asistencia responden directo con `NextResponse`.

## Endpoints y áreas principales

### Inventario

- `GET /api/inventory`
- `POST /api/inventory`
- `GET|PUT|DELETE /api/inventory/[id]`
- `POST /api/inventory/[id]/adjust`
- `GET /api/inventory/movements`
- `GET /api/inventory/low-stock`
- `POST /api/inventory/[id]/image`

### Producción

- `GET|POST /api/production`
- `GET|PUT|DELETE /api/production/[id]`

### Ventas

- `GET|POST /api/sales`
- `GET|PUT|DELETE /api/sales/[id]`
- `POST /api/sales/[id]/payment`
- `PATCH/POST /api/sales/[id]/status`
- `GET /api/sales/summary`

### Pedidos

- `GET|POST /api/orders`
- `GET|PUT|DELETE /api/orders/[id]`
- `GET /api/orders/kanban`
- `POST /api/orders/[id]/status`
- `POST|DELETE /api/orders/[id]/images`

### Clientes

- `GET|POST /api/customers`
- `GET|PUT|DELETE /api/customers/[id]`

### Catálogo

- `GET|POST /api/catalog`
- `GET|PUT|DELETE /api/catalog/[id]`
- `POST /api/catalog/[id]/image`
- `POST /api/catalog/bulk-price`

### Gastos

- `GET|POST /api/expenses`
- `GET|PUT|DELETE /api/expenses/[id]`
- `GET /api/expenses/summary`
- `POST /api/expenses/[id]/receipt`

### Planilla

- `GET|POST /api/payroll`
- `GET|PUT|DELETE /api/payroll/[id]`
- `POST /api/payroll/[id]/mark-paid`
- `POST /api/payroll/[id]/send-email`
- `GET /api/payroll/[id]/pdf`
- `POST /api/payroll/[id]/receipt`
- `GET /api/payroll/summary`
- `GET /api/payroll/info`

### Asistencia

- `POST /api/attendance/check-in`
- `POST /api/attendance/lunch-start`
- `POST /api/attendance/lunch-end`
- `POST /api/attendance/check-out`
- `POST /api/attendance/leave`
- `GET /api/attendance/history`
- endpoints admin bajo `api/attendance/admin/...`

### Reportes

- `GET /api/reports/daily`
- `GET /api/reports/sales`
- `GET /api/reports/production`
- `GET /api/reports/orders`
- `GET /api/reports/inventory`
- `GET /api/reports/attendance`
- `GET /api/reports/export/pdf`
- `GET /api/reports/export/excel`

### Configuración

- `GET|PUT /api/settings`
- `GET|POST /api/settings/users`
- `GET|PUT /api/settings/users/[id]`
- `GET|PUT /api/settings/users/[id]/permissions`
- `GET|PUT /api/settings/users/[id]/schedule`
- `GET|PUT /api/settings/users/[id]/employee`
- `GET|POST /api/settings/exchange-rates`
- `GET|PUT|DELETE /api/settings/exchange-rates/[id]`

### Notificaciones

- `GET /api/notifications`
- `POST /api/notifications/read-all`
- `GET|DELETE /api/notifications/[id]`
- `POST /api/notifications/[id]/read`

### Infraestructura

- `POST /api/storage/upload`
- `GET /api/storage/signed-url`
- `POST /api/revalidate`
- `api/cron/*`

## Convenciones al crear o modificar endpoints

- Usa `requireAuth()` salvo que el endpoint sea explícitamente público.
- Usa `requirePermission()` para enforcement por módulo.
- Valida payload con Zod.
- No mezcles lógica compleja de negocio y parsing si puedes extraer helpers.
- Mantén consistencia del shape de respuesta.
- Si el endpoint toca dinero, fechas o stock, documenta supuestos explícitos.

## Endpoints especiales a tratar con cuidado

- `app/api/settings/users/route.ts`: usa `SUPABASE_SERVICE_ROLE_KEY` por admin client
- `app/api/cron/*`: validan `CRON_SECRET`
- `app/api/revalidate/route.ts`: depende de key de revalidación
- `app/api/storage/*`: expone acceso a buckets y URLs firmadas

## Pendiente por confirmar

- Matriz exacta de métodos HTTP por algunos endpoints sin inspección línea a línea completa.
- Si todos los handlers antiguos ya fueron migrados al patrón estándar de `apiSuccess/handleApiError`.
