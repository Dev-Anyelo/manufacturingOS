# Arquitectura

## Stack tecnológico confirmado

Basado en `package.json`, `components.json` y la estructura real:

- Next.js 16 con App Router
- React 19
- TypeScript
- Tailwind CSS 4
- ShadCN UI
- Prisma Client
- PostgreSQL
- Supabase Auth, Realtime y Storage
- Zod
- React Hook Form
- TanStack Query
- Zustand
- Recharts
- React Email + Resend
- `@react-pdf/renderer`
- `xlsx`

## Estructura principal de carpetas

### `app/`

- `app/(auth)/`: rutas públicas de autenticación
- `app/(dashboard)/`: rutas protegidas del producto
- `app/api/`: route handlers internos

### `components/`

- `components/ui/`: primitives de ShadCN/Radix
- `components/shared/`: componentes reutilizables de dominio transversal
- `components/modules/`: componentes de negocio por módulo
- `components/providers/`: bootstrap global de providers y realtime
- `components/notifications/`: UI de notificaciones y campana

### `lib/`

- `lib/api/`: helpers API, auth, errores, cron y permisos
- `lib/auth/`: lectura de usuario actual
- `lib/currency/`: conversión y normalización monetaria
- `lib/data/`: consultas agregadas para páginas y dashboards
- `lib/email/`: envío y templates
- `lib/nav/`: navegación por secciones
- `lib/pdf/`: generación de PDFs
- `lib/permissions/`: sistema de permisos
- `lib/services/`: notificaciones y metadatos asociados
- `lib/storage/`: carga y firma de archivos
- `lib/supabase/`: clientes server, client, admin y middleware
- `lib/ui/`: helpers UI como revalidación de rutas
- `lib/validations/`: esquemas Zod por módulo

### Otras carpetas

- `prisma/`: schema Prisma y SQL manual auxiliar
- `supabase/migrations/`: esquema SQL, RLS, triggers y evolución operacional
- `stores/`: estado cliente con Zustand
- `hooks/`: hooks cliente
- `types/`: enums y tipos de dominio

## Arquitectura general

La app combina:

- protección de navegación con middleware/proxy,
- renderizado basado en Server Components para páginas y layouts,
- endpoints internos en `app/api/`,
- acceso a PostgreSQL vía Prisma,
- servicios de plataforma vía Supabase,
- interacción cliente con React Query y Zustand donde se necesita estado en tiempo real o experiencia interactiva.

## Patrones identificados

### 1. Auth en múltiples capas

- `proxy.ts` protege navegación de páginas.
- `lib/api/response.ts` aporta `requireAuth()` para route handlers.
- Supabase RLS sigue siendo capa de defensa de datos.

### 2. Permisos granulares por módulo

- El proyecto ya no depende solo del rol.
- `lib/permissions/constants.ts` define defaults por rol.
- `lib/permissions/resolve.ts` mezcla defaults con overrides de `user_module_permissions`.

### 3. Validación por módulo

- Cada dominio usa esquemas en `lib/validations/`.
- Los route handlers suelen parsear con `parseBodyWithSchema()`.

### 4. Data access separado por responsabilidad

- `lib/data/` contiene consultas agregadas para UI.
- `app/api/` contiene mutaciones y lecturas para clientes.
- `lib/services/` encapsula notificaciones y metadatos auxiliares.

### 5. Realtime cliente

- `components/providers/realtime-bootstrap.tsx` inicializa hooks globales.
- `hooks/use-notifications.tsx` escucha la tabla `notifications`.
- `hooks/use-realtime-inventory.ts` escucha `inventory_items`.

## Flujo de información

### Páginas protegidas

1. `proxy.ts` verifica sesión.
2. `app/(dashboard)/layout.tsx` obtiene usuario actual.
3. El layout filtra navegación según `hasPermission(...)`.
4. Las páginas consumen consultas directas o funciones en `lib/data/`.

### APIs internas

1. El handler llama `requireAuth()`.
2. El handler valida permiso con `requirePermission(...)` cuando aplica.
3. El handler valida input con Zod si hay body.
4. Prisma ejecuta lecturas o mutaciones.
5. El handler responde usando `apiSuccess()` o `handleApiError()`.

### Eventos de negocio

Parte de la lógica vive en SQL:

- triggers de producción,
- triggers de stock bajo,
- creación automática de venta desde pedido,
- creación automática de gasto desde pago de planilla,
- actualización de timestamps,
- políticas RLS por tabla.

## Puntos de arquitectura sensibles

- `proxy.ts` no protege APIs; las APIs deben protegerse por sí mismas.
- El proyecto usa Prisma y también depende de RLS/migraciones SQL de Supabase, así que cambios de datos deben revisarse en ambas capas.
- Parte del comportamiento financiero depende de monedas y conversiones históricas.
- Hay divergencias entre `rules.md` y el código actual; no asumir que el documento previo describe la arquitectura real.

## Pendiente por confirmar

- Estrategia oficial de despliegue más allá de `vercel.json`.
- Si existen consumers externos de las APIs internas además del frontend actual.
- Si todo el acceso de escritura debe seguir centralizado en Prisma o si hay procesos externos escribiendo directo a la BD.
