# Módulos del Sistema

## Dashboard

### Propósito

Mostrar estado operativo, financiero y de atención inmediata.

### Archivos principales

- `app/(dashboard)/page.tsx`
- `lib/data/dashboard.ts`
- `components/chart-area-interactive.tsx`
- `components/shared/stat-card.tsx`

### Funcionalidades

- KPIs diarios
- pedidos urgentes
- stock crítico
- actividad reciente
- resumen de asistencia
- gráfico financiero

### Consideraciones

- La página usa datos agregados multi-módulo.
- Parte de la lógica depende de moneda base del sistema.

## Inventory

### Propósito

Gestionar materiales e historial de movimientos.

### Archivos principales

- `app/(dashboard)/inventory/`
- `components/modules/inventory/`
- `app/api/inventory/`
- `lib/validations/inventory.ts`

### Funcionalidades

- CRUD de materiales
- ajuste de stock
- imagen por ítem
- historial y stock bajo
- realtime de cambios

### Dependencias

- `inventory_items`
- `inventory_movements`
- `hooks/use-realtime-inventory.ts`

## Production

### Propósito

Registrar sesiones de producción por empleado.

### Archivos principales

- `app/(dashboard)/production/`
- `components/modules/production/`
- `app/api/production/`
- `lib/validations/production.ts`

### Funcionalidades

- listar sesiones
- crear/editar/eliminar sesiones
- registrar ítems producidos
- detalle por sesión

### Dependencias

- `production_sessions`
- `production_session_items`
- `employees`
- `inventory_items`

## Sales

### Propósito

Registrar ventas, pagos y consumo de producto terminado.

### Archivos principales

- `app/(dashboard)/sales/`
- `components/modules/sales/`
- `app/api/sales/`
- `lib/validations/sales.ts`

### Funcionalidades

- POS
- historial de ventas
- detalle de venta
- actualización de estado y pagos
- recibos y resumen

### Dependencias

- `sales`
- `sale_items`
- `customers`
- `finished_good_stock`
- `catalog_movements`

### Consideraciones

- Maneja conversión monetaria.
- Puede generar notificaciones.

## Orders

### Propósito

Administrar pedidos personalizados y su progreso.

### Archivos principales

- `app/(dashboard)/orders/`
- `components/modules/orders/`
- `app/api/orders/`
- `lib/validations/orders.ts`

### Funcionalidades

- listado
- detalle
- creación y edición
- cambio de estado
- kanban
- imágenes de referencia

### Dependencias

- `work_orders`
- `work_order_items`
- `customers`
- `inventory_items`

### Consideraciones

- Usa fechas de entrega para urgencias.
- Puede disparar efectos SQL al cambiar estado.

## Customers

### Propósito

Gestionar clientes y su relación con ventas y pedidos.

### Archivos principales

- `app/(dashboard)/customers/`
- `components/modules/customers/`
- `app/api/customers/`

### Funcionalidades

- CRUD
- detalle
- edición

### Dependencias

- `customers`
- `sales`
- `work_orders`

## Catalog

### Propósito

Gestionar productos, precios y stock terminado asociado.

### Archivos principales

- `app/(dashboard)/catalog/`
- `components/modules/catalog/`
- `app/api/catalog/`
- `lib/validations/catalog.ts`

### Funcionalidades

- CRUD
- imagen
- precio masivo
- detalle
- stock terminado por variante

### Dependencias

- `catalog_items`
- `finished_good_stock`
- `catalog_movements`

## Expenses

### Propósito

Registrar egresos operativos y vinculaciones con inventario o planilla.

### Archivos principales

- `app/(dashboard)/expenses/`
- `components/modules/expenses/`
- `app/api/expenses/`
- `lib/validations/expenses.ts`

### Funcionalidades

- CRUD
- resumen
- recibos
- alta desde UI

### Dependencias

- `expenses`
- `inventory_items`
- `payroll_payments`

## Payroll

### Propósito

Gestionar pagos al personal.

### Archivos principales

- `app/(dashboard)/payroll/`
- `components/modules/payroll/`
- `app/api/payroll/`
- `lib/validations/payroll.ts`

### Funcionalidades

- listado
- detalle
- marcar pagado
- enviar por correo
- generar PDF

### Dependencias

- `employees`
- `payroll_payments`
- `expenses`
- `lib/pdf/`
- `lib/email/`

## Attendance

### Propósito

Registrar asistencia diaria y permisos.

### Archivos principales

- `app/(dashboard)/attendance/`
- `components/modules/attendance/`
- `app/api/attendance/`
- `hooks/use-attendance.ts`
- `lib/attendance/utils.ts`

### Funcionalidades

- check-in
- lunch start/end
- check-out
- historial
- vista administrativa
- estadísticas
- permisos/leave requests

### Dependencias

- `employee_schedules`
- `attendance_records`
- `attendance_events`
- `leave_requests`

## Reports

### Propósito

Exponer reportes operativos y financieros.

### Archivos principales

- `app/(dashboard)/reports/`
- `app/api/reports/`

### Funcionalidades

- reportes de ventas
- producción
- inventario
- pedidos
- asistencia
- exportaciones PDF/Excel

### Consideraciones

- Los permisos de exportación son independientes del permiso de vista.

## Settings

### Propósito

Administrar configuración general, usuarios, permisos y tasas.

### Archivos principales

- `app/(dashboard)/settings/`
- `components/modules/settings/`
- `app/api/settings/`
- `lib/validations/settings.ts`

### Funcionalidades

- usuarios
- detalle de usuario
- permisos por usuario
- empleado asociado
- horario
- tasas de cambio
- ajustes del sistema

### Dependencias

- `profiles`
- `employees`
- `user_module_permissions`
- `system_settings`
- `exchange_rates`

## Pendiente por confirmar

- Si existe un módulo funcional de documentos independiente de storage.
- Si todos los módulos listados en permisos tienen cobertura completa en navegación y páginas visibles.
