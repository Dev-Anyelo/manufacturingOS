# Contexto del Proyecto

## Qué es manufacturingOS

`manufacturingOS` es una aplicación empresarial para `DANIELSS CONFECCIONES` orientada a centralizar operación diaria, control administrativo y seguimiento productivo de un taller de confección.

No se encontró en el código actual evidencia de que el producto se llame `CombiSales`. El nombre confirmado en el repositorio es `manufacturing-os` y en configuración aparece `DANIELLS_CONFECCIONES` como nombre de empresa por defecto en `system_settings`.

## Problema que resuelve

El sistema reemplaza manejo disperso en hojas de cálculo, procesos manuales y seguimiento informal de operaciones con una plataforma web integrada para:

- inventario de materiales,
- catálogo y stock de producto terminado,
- sesiones de producción,
- ventas y abonos,
- pedidos a medida,
- gastos,
- planilla,
- asistencia del personal,
- reportes,
- configuración de usuarios, permisos y tasas de cambio.

## Usuarios principales confirmados

Según `prisma/schema.prisma`, `types/index.ts` y `lib/permissions/constants.ts`, los roles confirmados son:

- `admin`
- `manager`
- `employee`
- `readonly`

Estos roles se usan para definir defaults de permisos y visibilidad por módulo, con posibilidad de overrides por usuario.

## Módulos principales

Los módulos visibles y/o con permisos configurados actualmente son:

- Dashboard
- Inventory
- Production
- Sales
- Orders
- Customers
- Catalog
- Expenses
- Payroll
- Attendance
- Reports
- Settings

La navegación confirmada vive en `lib/nav/dashboard-links.ts`.

## Flujo general de la aplicación

1. El usuario autentica con Supabase Auth.
2. `proxy.ts` protege navegación web y redirige a `/login` si no hay sesión.
3. El layout protegido `app/(dashboard)/layout.tsx` obtiene usuario actual, resuelve permisos y filtra navegación.
4. Las pantallas usan una mezcla de Server Components, componentes cliente y endpoints internos en `app/api/`.
5. Los endpoints requieren autenticación y, en la mayoría de módulos, autorización granular por módulo/acción.
6. Prisma actúa como capa principal de acceso a PostgreSQL.
7. Supabase sigue participando en Auth, Realtime, Storage y políticas RLS.

## Contexto empresarial relevante

El dominio mezcla operación manufacturera y comercial:

- Producción consume materiales y genera actividad operativa.
- Catálogo y `finished_good_stock` representan producto terminado vendible.
- Ventas pueden descontar stock terminado.
- Pedidos manejan anticipos, fechas de entrega y materiales reservados.
- Planilla y asistencia modelan operación de personal.
- Gastos pueden impactar inventario o representar pagos de planilla.
- Reportes agregan información financiera y operativa.

## Elementos de negocio observables en código

- Multi-moneda `USD` y `NIO`.
- Conversión de montos mediante tasas históricas (`ExchangeRate` y `lib/currency/`).
- Notificaciones internas en base de datos y por Realtime.
- Correos transaccionales mediante Resend.
- Exportaciones PDF y Excel.

## Pendiente por confirmar

- Nombre comercial definitivo del producto si `manufacturingOS` es nombre interno y `DANIELSS/DANIELLS CONFECCIONES` es la marca visible.
- Si existen flujos externos no reflejados en el código, por ejemplo integraciones contables o procesos fuera de la app.
- Si el módulo de ventas debe operar solo sobre producto terminado o también sobre ítems de catálogo sin stock asociado en todos los casos.
