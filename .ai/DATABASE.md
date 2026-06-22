# Base de Datos

## Tecnología y acceso

- Base de datos: PostgreSQL
- ORM principal en aplicación: Prisma
- Proveedor de plataforma: Supabase
- Auth: Supabase Auth
- Políticas RLS y lógica operativa adicional: SQL en `supabase/migrations/`

## Fuente de verdad del esquema

La referencia principal de modelos de aplicación es:

- `prisma/schema.prisma`

La referencia principal de seguridad y automatismos SQL es:

- `supabase/migrations/`

## Modelos principales confirmados

### Seguridad y usuarios

- `Profile`
- `Employee`
- `UserModulePermission`

### Operación

- `InventoryItem`
- `InventoryMovement`
- `CatalogItem`
- `FinishedGoodStock`
- `CatalogMovement`
- `ProductionSession`
- `ProductionSessionItem`
- `Customer`
- `Sale`
- `SaleItem`
- `WorkOrder`
- `WorkOrderItem`
- `Expense`
- `PayrollPayment`
- `Notification`
- `SystemSetting`
- `ExchangeRate`
- `AuditLog`
- `EmployeeSchedule`
- `AttendanceRecord`
- `AttendanceEvent`
- `LeaveRequest`

## Relaciones importantes

- `Profile` puede tener un `Employee` asociado.
- `Profile` es dueño de notificaciones y de overrides de permisos.
- `Employee` participa en producción, planilla, horarios y asistencia.
- `InventoryItem` alimenta producción, pedidos y ciertos gastos.
- `CatalogItem` se relaciona con ventas, pedidos, stock terminado y producción.
- `FinishedGoodStock` representa stock vendible por variante.
- `Sale` agrupa `SaleItem` y puede pertenecer a un cliente.
- `WorkOrder` agrupa `WorkOrderItem` y siempre pertenece a un cliente.
- `PayrollPayment` puede disparar un gasto asociado.
- `AttendanceRecord` agrupa `AttendanceEvent`.

## Enums importantes

- `UserRole`
- `Currency`
- `WorkOrderStatus`
- `SaleStatus`
- `PaymentMethod`
- `ContractType`
- `GarmentType`
- `AttendanceStatus`
- `LeaveStatus`

## Migraciones y evolución

### Prisma

La carpeta `prisma/migrations/` contiene SQL manual complementario, no una historia completa de migraciones Prisma generadas.

### Supabase

La carpeta `supabase/migrations/` sí contiene evolución importante del sistema:

- esquema inicial,
- RLS,
- triggers,
- permisos granulares,
- storage buckets,
- attendance,
- fixes de tipos y enums.

## Triggers y automatismos relevantes confirmados

Basado en búsqueda sobre `supabase/migrations/`:

- descuento de inventario por producción,
- validación/generación de alertas de stock bajo,
- recálculo de totales de sesión,
- creación de gasto desde planilla,
- liberación de materiales reservados,
- creación de venta desde pedido,
- timestamps `updated_at`,
- creación de perfil al crear usuario auth,
- updated_at de `user_module_permissions`.

## Consideraciones antes de modificar el esquema

- Revisa si el cambio debe reflejarse en Prisma y en SQL/RLS.
- Revisa si hay enums consumidos por UI, validaciones y filtros.
- Revisa si hay triggers que dependan del nombre o tipo de columnas.
- Revisa endpoints y reportes que puedan asumir campos existentes.
- Revisa si los tipos generados de Supabase (`lib/supabase/types.ts`) quedarían desactualizados.

## Riesgos al cambiar modelos existentes

- Romper RLS si una tabla o columna cambia sin actualizar políticas.
- Romper procesos automáticos SQL.
- Romper cálculos monetarios si cambian monedas o tipos `Decimal`.
- Romper reportes o dashboards que agregan datos desde varias tablas.
- Romper permisos si `profiles`, `employees` o `user_module_permissions` cambian.

## Tablas especialmente sensibles

- `profiles`
- `user_module_permissions`
- `inventory_items`
- `production_session_items`
- `sales`
- `work_orders`
- `finished_good_stock`
- `exchange_rates`
- `attendance_records`
- `leave_requests`

## Recomendaciones de cambio seguro

1. Cambia primero la documentación si el modelo conceptual cambia.
2. Revisa validaciones Zod relacionadas.
3. Revisa endpoints del módulo.
4. Revisa reportes y agregaciones.
5. Revisa migraciones SQL y RLS.
6. Ejecuta `prisma generate`, typecheck y build.

## Pendiente por confirmar

- Flujo oficial para regenerar `lib/supabase/types.ts` dentro del equipo.
- Si hay ambientes donde Prisma y la estructura real de Supabase hayan quedado desincronizados.
