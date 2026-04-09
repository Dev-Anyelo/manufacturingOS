# 🚀 Prompt de Inicio — manufacturingOS

> Copia y pega este prompt completo en Cursor AI para iniciar el desarrollo.
> Úsalo DESPUÉS de haber colocado el `rules.md` en la raíz del proyecto.

---

## PROMPT

```
Eres el arquitecto principal de manufacturingOS, un sistema ERP para talleres de confección.
Tienes acceso completo al `rules.md` del proyecto con toda la especificación técnica.
Vamos a iniciar el desarrollo siguiendo el Roadmap Fase 1, comenzando por la arquitectura
base y la lógica de negocio.

---

## CONTEXTO DEL PROYECTO

Ya existe en el proyecto un template de sidebar/dashboard con componentes ShadCN UI instalados.
Tu trabajo es ADAPTAR ese template existente a la estructura y necesidades de manufacturingOS,
NO crear uno desde cero. Respeta los componentes ShadCN que ya están presentes.

---

## TAREA 1 — ANALIZA EL PROYECTO ACTUAL

Antes de escribir cualquier código:

1. Lee la estructura de archivos existente con `tree` o explorando el directorio raíz
2. Identifica exactamente qué componentes del sidebar/dashboard template ya existen
3. Lista las dependencias actuales en `package.json`
4. Identifica qué componentes ShadCN ya están instalados en `components/ui/`
5. Reporta lo que encontraste antes de continuar

---

## TAREA 2 — ARQUITECTURA BASE (Sprint 1)

Con base en lo que encontraste, realiza las siguientes acciones en orden:

### 2A. Estructura de carpetas
Crea la estructura completa de carpetas del proyecto según el .cursorrules,
sin sobrescribir lo que ya existe. Usa archivos `.gitkeep` en carpetas vacías
o crea directamente los archivos que se necesiten.

### 2B. Configuración de Supabase
Crea los siguientes archivos base:

**`lib/supabase/client.ts`** — cliente browser-side para Client Components:
```typescript
import { createBrowserClient } from '@supabase/ssr'
import { Database } from './types'
// Implementa createClient() correctamente con las env vars
```

**`lib/supabase/server.ts`** — cliente server-side para Server Components y Route Handlers:
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
// Implementa createServerSupabaseClient() con manejo de cookies
```

**`lib/supabase/middleware.ts`** — para refrescar sesión en cada request:
```typescript
// Implementa updateSession() para el middleware de Next.js
```

**`middleware.ts`** (raíz del proyecto) — protección de rutas:
```typescript
// Rutas públicas: /login, /register, /forgot-password
// Todas las demás rutas bajo (dashboard)/ requieren sesión activa
// Redirigir a /login si no hay sesión
// Redirigir a / si ya hay sesión e intenta acceder a rutas de auth
```

### 2C. Tipos TypeScript base
Crea `types/index.ts` con los tipos de dominio globales del proyecto:
- `UserRole` enum: `admin | manager | employee | readonly`
- `OrderStatus` enum: `received | confirmed | in_production | ready | delivered | cancelled`
- `MaterialCategory` enum: `fabric | supplies | tools | machinery`
- `PaymentMethod` enum: `cash | transfer | credit | mixed`
- `SaleChannel` enum: `in_person | order | whatsapp | marketplace | other`
- `ContractType` enum: `fixed_salary | per_piece | hourly`
- `NotificationType` enum con todos los tipos del .cursorrules
- Interfaces base para `Profile`, `Employee`, `InventoryItem`, `Customer`

### 2D. Adaptación del sidebar/dashboard template

Con base en los componentes existentes que identificaste en la TAREA 1,
ADAPTA el sidebar para que incluya:

**Navegación del sidebar (en español, íconos de lucide-react):**
```
📊 Dashboard          → /
📦 Inventario         → /inventory
🧵 Producción         → /production
💰 Ventas             → /sales
📋 Pedidos            → /orders
💸 Gastos             → /expenses
👥 Planilla           → /payroll
👗 Catálogo           → /catalog
📈 Reportes           → /reports
⚙️ Configuración      → /settings  (solo visible para admin)
```

**Header del dashboard:**
- Logo/nombre: "manufacturingOS"
- Ícono de campana de notificaciones (NotificationBell) con badge de no leídas
- Avatar del usuario con dropdown (perfil, cerrar sesión)
- Indicador del rol del usuario actual

**Layout general:**
- Sidebar colapsable en mobile (usando Sheet de ShadCN)
- Sidebar fijo en desktop
- Área de contenido con padding correcto
- Soporte para rutas activas en el sidebar (highlight visual)

### 2E. Esquema SQL — Migración inicial

Crea el archivo `supabase/migrations/001_initial_schema.sql` con:

1. Tabla `profiles` (extiende auth.users de Supabase)
2. Tabla `employees`
3. Tabla `inventory_items` con todos los campos del .cursorrules
4. Tabla `inventory_movements` (log inmutable)
5. Tabla `customers`
6. Tabla `catalog_items`
7. Tabla `notifications`
8. Tabla `system_settings`
9. Tabla `audit_log`

Para cada tabla incluye:
- Todos los campos especificados en el .cursorrules
- `created_at TIMESTAMPTZ DEFAULT NOW()`
- `updated_at TIMESTAMPTZ DEFAULT NOW()` donde aplique
- Constraints apropiados (NOT NULL, CHECK, FOREIGN KEY)
- Comentarios SQL explicando el propósito de cada tabla

Crea `supabase/migrations/002_rls_policies.sql` con:
- RLS habilitado para TODAS las tablas
- Políticas exactas descritas en el .cursorrules por cada tabla
- Función helper `get_user_role()` para consultar el rol del usuario autenticado

Crea `supabase/migrations/003_triggers.sql` con:
- `fn_deduct_inventory()` + `trg_deduct_on_production`
- `fn_check_low_stock()` para insertar notificaciones automáticas
- `fn_update_customer_stats()` para actualizar `total_purchases` al registrar una venta
- `fn_update_updated_at()` trigger genérico para actualizar `updated_at`

### 2F. Validaciones Zod base

Crea los esquemas Zod más críticos:

**`lib/validations/inventory.ts`:**
- `inventoryItemSchema` para crear/editar material
- `inventoryAdjustSchema` para ajuste manual de stock
- Mensajes de error en español

**`lib/validations/auth.ts`:**
- `loginSchema` (email + password)
- `registerSchema` (email + password + full_name)

---

## TAREA 3 — PÁGINAS BASE

### 3A. Página de Login (`app/(auth)/login/page.tsx`)
- Server Component wrapper con Client Component para el form
- Formulario: email + password con validación Zod
- Manejo de errores de Supabase Auth en español
- Link a "¿Olvidaste tu contraseña?"
- Botón de submit con loading state
- Diseño usando ShadCN Card, Input, Button, Label

### 3B. Dashboard principal (`app/(dashboard)/page.tsx`)
- Server Component que obtiene datos básicos del servidor
- Muestra 4 StatCards con datos reales de Supabase:
  1. Total de materiales en inventario
  2. Materiales con stock bajo o crítico
  3. Ventas del día
  4. Pedidos activos (no entregados ni cancelados)
- Usa el componente `<StatCard>` del shared/
- Sección de "Actividad reciente" (últimas 5 operaciones del audit_log)
- Sección de "Alertas activas" (materiales con stock crítico)
- Si no hay datos aún, usar `<EmptyState>` con mensaje apropiado

### 3C. Componentes shared esenciales
Crea en `components/shared/`:

```typescript
// page-header.tsx — Header reutilizable para cada módulo
interface PageHeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode
}

// stat-card.tsx — Tarjeta de estadística para el dashboard
interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon: React.ReactNode
  trend?: { value: number; label: string }
  variant?: 'default' | 'warning' | 'danger' | 'success'
}

// empty-state.tsx — Estado vacío reutilizable
interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description: string
  action?: React.ReactNode
}

// loading-skeleton.tsx — Skeleton de carga
interface LoadingSkeletonProps {
  rows?: number
  type?: 'table' | 'cards' | 'list'
}
```

---

## TAREA 4 — LÓGICA DE NEGOCIO CRÍTICA

### 4A. Store de notificaciones (Zustand)

Crea `stores/notificationStore.ts`:
```typescript
interface NotificationStore {
  notifications: Notification[]
  unreadCount: number
  addNotification: (notification: Notification) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  removeNotification: (id: string) => void
}
// Implementar con persistencia en Supabase + cache local en Zustand
```

### 4B. Hook de notificaciones en tiempo real

Crea `hooks/use-notifications.ts`:
- Suscribirse a la tabla `notifications` via Supabase Realtime
- Filtrar por `user_id = auth.uid()`
- Actualizar el Zustand store automáticamente
- Limpiar la suscripción al desmontar

### 4C. Componentes de notificaciones

**`components/notifications/notification-bell.tsx`:**
- Ícono de campana con badge numérico (usando ShadCN Badge)
- Al hacer click, abre un Sheet de ShadCN con el historial
- Animación sutil cuando llega una nueva notificación

**`components/notifications/notification-panel.tsx`:**
- Lista de notificaciones con scroll
- Cada ítem: ícono por tipo, título, descripción, tiempo relativo
- Botón "Marcar todo como leído"
- Link de acción directa cuando aplica ("Ver pedido", "Ver inventario")
- EmptyState si no hay notificaciones

### 4D. Hook de inventario en tiempo real

Crea `hooks/use-realtime-inventory.ts` exactamente como está especificado
en el .cursorrules, asegurando:
- Suscripción a cambios en `inventory_items`
- Invalidación automática del cache de React Query
- Detección de stock bajo con llamada a notificación

---

## INSTRUCCIONES DE EJECUCIÓN

1. **Ejecuta las tareas en orden**: 1 → 2A → 2B → 2C → 2D → 2E → 2F → 3A → 3B → 3C → 4A → 4B → 4C → 4D

2. **Después de cada archivo creado**, verifica que:
   - No hay errores de TypeScript
   - Los imports son correctos y los archivos referenciados existen
   - Se siguen las convenciones de nomenclatura del .cursorrules

3. **Para el sidebar/dashboard**: NO lo reescribas completo. Identifica primero la estructura
   existente y haz los cambios mínimos necesarios para adaptarlo.

4. **Para el SQL**: Escribe migraciones completas y ejecutables. Usa `IF NOT EXISTS` donde
   aplique para que sean idempotentes.

5. **Al terminar**, dame un resumen de:
   - Qué archivos fueron creados o modificados
   - Qué componentes del template existente fueron adaptados
   - Qué pasos quedan pendientes para el Sprint 2 (Auth + Notificaciones)
   - Si encontraste alguna inconsistencia con el .cursorrules que debamos resolver

¿Listo? Comienza con la TAREA 1 — análisis del proyecto existente.
```

---

## NOTAS DE USO

- **Coloca el `.cursorrules` en la raíz del proyecto** antes de ejecutar este prompt
- Este prompt asume que el proyecto ya tiene Next.js 15 inicializado con el template de ShadCN
- Si necesitas instalar dependencias faltantes, el modelo te lo indicará al analizar el `package.json`
- Después de este Sprint 1, usa el siguiente prompt: `"Continúa con el Sprint 2: Auth + Roles + Notificaciones en tiempo real"`

---

## DEPENDENCIAS QUE DEBEN ESTAR EN package.json

Si alguna de estas no está instalada, agrégalas antes de ejecutar el prompt:

```bash
# Supabase
npm install @supabase/supabase-js @supabase/ssr

# Estado y queries
npm install @tanstack/react-query zustand

# Formularios y validación
npm install react-hook-form zod @hookform/resolvers

# Tablas
npm install @tanstack/react-table

# Notificaciones toast
npm install sonner

# Gráficas
npm install recharts

# PDFs
npm install @react-pdf/renderer

# Email
npm install resend @react-email/components

# Drag and drop (para Kanban - Fase 2)
npm install @hello-pangea/dnd

# Utilidades
npm install date-fns clsx tailwind-merge lucide-react
```

---

*manufacturingOS · Prompt v1.0 · Sprint 1 · Abril 2026*
