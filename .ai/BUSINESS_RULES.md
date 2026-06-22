# Reglas de Negocio

## Reglas generales confirmadas

- Todo usuario operativo debe estar autenticado para acceder al dashboard y a APIs privadas.
- La visibilidad y acción sobre módulos depende de permisos resueltos por módulo/acción, no solo del rol base.
- Los textos visibles al usuario están en español; el código se mantiene en inglés.

## Inventario

- Solo se listan ítems activos por defecto en endpoints como `app/api/inventory/route.ts`.
- El stock se clasifica operativamente en normal, bajo, crítico o agotado según `quantity` y `minimumStock`.
- Los movimientos de inventario (`inventory_movements`) funcionan como historial; la documentación previa y el modelo sugieren tratarlos como log inmutable.
- La UI y el realtime generan alertas cuando un material cae al umbral mínimo o por debajo.

## Producción

- Una sesión de producción pertenece a un empleado.
- Los ítems de sesión registran prenda, talla, color, cantidad y yardas usadas.
- Existen triggers SQL para descontar inventario a partir de producción.
- Existen triggers SQL para recalcular totales de sesión.

## Ventas

- Una venta puede tener cliente o no, según el modelo `customerId` nullable.
- El total y el saldo se calculan considerando descuentos y conversiones de moneda.
- El estado de venta se deriva del balance:
  - `paid` si no hay saldo pendiente,
  - `partial` si hubo abono parcial,
  - `pending` si no hubo pago suficiente.
- Si el usuario es `employee`, el endpoint `app/api/sales/route.ts` limita la vista a ventas creadas por ese usuario.
- Una venta puede descontar `finished_good_stock`.
- Si no hay stock suficiente de producto terminado, la venta debe fallar.

## Pedidos

- Un pedido tiene fecha de recepción, fecha de entrega, cliente, estado, anticipos y saldo.
- Los pedidos urgentes son los vencidos o próximos a vencer.
- Los pedidos cancelados o entregados no se consideran activos para urgencias.
- Existe lógica SQL para:
  - liberar materiales reservados,
  - crear venta desde pedido en ciertos cambios de estado.

## Catálogo y producto terminado

- `catalog_items` describe productos.
- `finished_good_stock` representa inventario vendible por combinación de catálogo, tipo de prenda, talla y color.
- Existe historial de movimientos de producto terminado en `catalog_movements`.

## Gastos

- Un gasto puede o no actualizar inventario.
- Un gasto puede estar vinculado a un pago de planilla.

## Planilla

- Los pagos de planilla pertenecen a un empleado y cubren un período.
- El sistema soporta distintos tipos de contratación: salario fijo, por pieza y por hora.
- Existen triggers SQL para crear gasto asociado desde pagos de planilla.

## Asistencia

- La asistencia depende de un empleado vinculado al perfil autenticado.
- Puede existir horario por empleado.
- `check-in` determina si el registro es puntual, tardío o sin horario.
- Una llegada tardía genera notificaciones para `admin` y `manager`.
- Las solicitudes de permiso (`leave_requests`) tienen estados `pending`, `approved` y `rejected`.

## Configuración y seguridad

- Los permisos por usuario se almacenan en `user_module_permissions`.
- Los overrides reemplazan permisos por módulo definidos por rol.
- Un perfil inactivo pierde acceso efectivo porque `requireAuth()` y `resolvePermissions()` fallan en cerrado.

## Reglas especiales detectadas

- `employee` no hereda acceso general a todos los clientes según la matriz de permisos.
- La matriz de permisos indica que ciertos alcances se afinan en capa API, no solamente en la matriz.
- `reports.view` puede requerir filtros adicionales por rol aunque el permiso esté activo.

## Restricciones funcionales importantes

- No cambiar enums de estado o moneda sin revisar Prisma, validaciones, UI, reportes y SQL.
- No modificar triggers o políticas RLS sin revisar impacto transversal.
- No dar por hecho que una validación visual equivale a seguridad; la seguridad real vive también en API y RLS.

## Pendiente por confirmar

- Alcance exacto de todos los reportes por rol, porque al menos `app/api/reports/production/route.ts` hoy no filtra por empleado aunque la documentación previa sugería scope parcial.
- Flujo exacto de reserva/consumo de materiales en pedidos personalizados.
- Si existe una política operativa para soft delete vs hard delete en cada módulo más allá de los campos `isActive`.
