# manufacturingOS — Cursor AI Rules
# Blueprint v2.0 · Abril 2026
# Sistema de Gestión Empresarial para Confecciones

---

## 🧠 CONTEXTO DE LA APLICACIÓN

**manufacturingOS** es un sistema ERP completo para talleres de confección y textiles.
Reemplaza hojas de cálculo Excel con una plataforma web moderna, en tiempo real.

### Usuarios objetivo
- Administrador/dueño del taller (acceso total)
- Gerente (todo excepto configuración del sistema)
- Empleado de confección (solo producción e historial propio)
- Solo lectura (reportes y dashboard)

### Problema que resuelve
Control de inventario de telas/insumos, producción diaria, ventas (POS),
pedidos a medida (Kanban), planilla de empleados, gastos, y reportes — todo
sincronizado en tiempo real entre múltiples dispositivos.

---

## 🏗️ STACK TECNOLÓGICO — OBLIGATORIO

```
Framework:      Next.js 15 (App Router) — SSR por defecto
Database:       Supabase (PostgreSQL) con RLS obligatorio
Auth:           Supabase Auth (JWT + RBAC)
Realtime:       Supabase Realtime (inventario, notificaciones)
Storage:        Supabase Storage (fotos, PDFs, recibos)
Email:          Resend + React Email
UI Components:  ShadCN UI (ya instalado en el proyecto)
Estilos:        Tailwind CSS v4
Forms:          React Hook Form + Zod
Server State:   TanStack Query v5 (React Query)
Client State:   Zustand
Charts:         Recharts
PDFs:           @react-pdf/renderer
Tables:         TanStack Table v8
Types:          TypeScript estricto + tipos generados por Supabase CLI
Deploy:         Vercel (CI/CD automático)
```

**NUNCA** sugerir alternativas a estas tecnologías. Son decisiones fijas del proyecto.

---

## 📁 ESTRUCTURA DE CARPETAS — SEGUIR ESTRICTAMENTE

```
app/
  (auth)/               # Login, register, forgot-password (rutas públicas)
  (dashboard)/          # Layout protegido con sidebar (rutas privadas)
    inventory/          # page.tsx, [id]/page.tsx, new/page.tsx, [id]/edit/page.tsx
    production/         # page.tsx, new/page.tsx, [id]/page.tsx
    sales/              # page.tsx, new/page.tsx, [id]/page.tsx, customers/
    orders/             # page.tsx (Kanban), list/page.tsx, new/page.tsx, [id]/page.tsx
    expenses/           # page.tsx, new/page.tsx
    payroll/            # page.tsx, [id]/page.tsx
    reports/            # page.tsx
    catalog/            # page.tsx, new/page.tsx, [id]/page.tsx
    settings/           # page.tsx
  api/
    inventory/          # low-stock/route.ts, adjust/route.ts
    production/         # session/route.ts
    orders/[id]/        # status/route.ts
    sales/              # complete/route.ts
    reports/            # daily/route.ts, monthly/route.ts
    pdf/                # payslip/[id]/route.ts, sale-receipt/[id]/route.ts
    emails/             # order-ready/route.ts, low-stock-digest/route.ts
    cron/               # daily-report/route.ts, check-overdue-orders/route.ts
    import/             # excel/route.ts

components/
  ui/                   # ShadCN components re-exportados y personalizados
  modules/              # Componentes específicos por módulo
    inventory/          # InventoryTable, InventoryForm, StockBadge, etc.
    production/         # ProductionForm, SessionList, etc.
    sales/              # SalesPOS, CartPanel, CustomerSelector, etc.
    orders/             # OrderKanban, OrderCard, OrderForm, etc.
    payroll/            # EmployeeCard, PayrollForm, etc.
  shared/               # DataTable, PageHeader, StatCard, EmptyState, LoadingSkeleton
  notifications/        # NotificationBell, NotificationPanel, NotificationItem
  layout/               # Sidebar, Header, DashboardLayout

lib/
  supabase/             # client.ts, server.ts, middleware.ts
  validations/          # Esquemas Zod: inventory.ts, sales.ts, orders.ts, etc.
  email/                # Templates React Email
  pdf/                  # Templates @react-pdf

hooks/                  # useInventory, useRealtimeInventory, useNotifications, usePOS
stores/                 # notificationStore.ts, posStore.ts, uiStore.ts
types/                  # Tipos globales de dominio
supabase/migrations/    # SQL versionado con Supabase CLI
```

---

## 📐 CONVENCIONES DE NOMENCLATURA

| Elemento             | Convención         | Ejemplo                              |
|----------------------|--------------------|--------------------------------------|
| Componentes React    | PascalCase         | `InventoryTable`, `OrderKanban`      |
| Funciones / hooks    | camelCase          | `useRealtimeInventory`, `fetchById`  |
| Tablas Supabase      | snake_case plural  | `inventory_items`, `work_orders`     |
| Rutas API            | kebab-case         | `/api/inventory/low-stock`           |
| Archivos             | kebab-case         | `inventory-table.tsx`                |
| Variables de entorno | UPPER_SNAKE_CASE   | `NEXT_PUBLIC_SUPABASE_URL`           |
| Constantes           | UPPER_SNAKE_CASE   | `LOW_STOCK_THRESHOLD`                |
| Enums/tipos TS       | PascalCase         | `OrderStatus`, `UserRole`            |

---

## 🌐 IDIOMA — REGLA CRÍTICA

- **Código fuente**: TODO en inglés (variables, funciones, componentes, comentarios, tablas SQL, rutas API)
- **UI visible al usuario**: TODO en español (labels, placeholders, mensajes, botones)
- **Ejemplo correcto**:
  ```typescript
  // ✅ Correcto
  const fetchInventoryItems = async () => {}
  // Botón en UI: "Agregar Material"

  // ❌ Incorrecto
  const obtenerItemsInventario = async () => {}
  ```

---

## 🏛️ PRINCIPIOS DE ARQUITECTURA — NO NEGOCIABLES

### 1. Server Components por defecto
```typescript
// ✅ Por defecto: Server Component (sin 'use client')
export default async function InventoryPage() {
  const items = await getInventoryItems() // fetch en el servidor
  return <InventoryTable items={items} />
}

// Solo agregar 'use client' cuando hay: estado, efectos, eventos del DOM
'use client'
export function InventoryTable({ items }) { ... }
```

### 2. Type Safety End-to-End
```typescript
// ✅ Tipos generados desde Supabase CLI — SIEMPRE usar
import { Database } from '@/lib/supabase/types'
type InventoryItem = Database['public']['Tables']['inventory_items']['Row']

// ❌ Prohibido
const item: any = ...
```

### 3. Validación con Zod en todo formulario
```typescript
// lib/validations/inventory.ts
export const inventoryItemSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  quantity: z.number().positive('La cantidad debe ser positiva'),
  // ...
})
```

### 4. RLS como única fuente de verdad de seguridad
- Cada tabla debe tener políticas RLS activas
- El middleware de Next.js es una capa adicional, NO la única defensa
- Nunca usar `service_role` key en el cliente

### 5. Optimistic Updates con React Query
```typescript
const mutation = useMutation({
  mutationFn: updateInventoryItem,
  onMutate: async (newData) => {
    await queryClient.cancelQueries({ queryKey: ['inventory'] })
    const previous = queryClient.getQueryData(['inventory'])
    queryClient.setQueryData(['inventory'], (old) => /* update optimistically */)
    return { previous }
  },
  onError: (err, newData, context) => {
    queryClient.setQueryData(['inventory'], context.previous)
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['inventory'] })
  },
})
```

### 6. Mobile-first
- Diseñar primero para mobile, luego expandir para desktop
- Usar clases Tailwind en orden: `base → sm: → md: → lg:`

---

## 🔔 SISTEMA DE NOTIFICACIONES

### Tabla SQL: `notifications`
```sql
id (uuid PK) · user_id (FK → profiles) · type (text)
· title · body · metadata (jsonb) · read (boolean default false)
· created_at · expires_at (nullable)
```

### Tipos válidos de notificación
`low_stock | out_of_stock | order_ready | order_overdue | sale_completed | production_saved | payment_due | monthly_report | inventory_updated`

### Suscripción Realtime (patrón obligatorio)
```typescript
// hooks/use-notifications.ts
supabase.channel('notifications')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'notifications',
    filter: `user_id=eq.${userId}`
  }, callback)
  .subscribe()
```

### Toast con Sonner
- Éxito: 4 segundos
- Alerta: 8 segundos
- Error crítico: permanente hasta que el usuario cierre

---

## 📦 INVENTARIO EN TIEMPO REAL

### Hook obligatorio: `useRealtimeInventory`
```typescript
// hooks/use-realtime-inventory.ts
export const useRealtimeInventory = () => {
  const queryClient = useQueryClient()
  useEffect(() => {
    const channel = supabase.channel('inventory-changes')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'inventory_items'
      }, (payload) => {
        queryClient.invalidateQueries({ queryKey: ['inventory'] })
        if (payload.new?.quantity <= payload.new?.minimum_stock) {
          triggerLowStockNotification(payload.new)
        }
      }).subscribe()
    return () => supabase.removeChannel(channel)
  }, [])
}
```

### Indicadores de stock (UI obligatoria)
| Estado    | Condición                                 | Badge       | Barra      |
|-----------|-------------------------------------------|-------------|------------|
| Normal    | quantity > minimum_stock * 2              | Verde       | Verde      |
| Bajo      | minimum_stock < quantity ≤ min_stock * 2  | Amarillo    | Naranja    |
| Crítico   | 0 < quantity ≤ minimum_stock              | Rojo        | Rojo       |
| Agotado   | quantity = 0                              | Negro/Gris  | Sin barra  |

---

## 🗄️ ESQUEMA DE BASE DE DATOS

### Tablas principales y sus relaciones
```
profiles (1) ──── (N) production_sessions (1) ──── (N) production_session_items
inventory_items (1) ──── (N) inventory_movements
production_session_items (N) ──── (1) inventory_items
customers (1) ──── (N) sales (1) ──── (N) sale_items
customers (1) ──── (N) work_orders (1) ──── (N) work_order_items
sale_items (N) ──── (1) catalog_items ──── (1) work_order_items
employees (1) ──── (N) payroll_payments ──── (N) expenses
profiles (1) ──── (N) notifications
```

### Trigger SQL crítico: descuento de inventario automático
```sql
CREATE OR REPLACE FUNCTION fn_deduct_inventory() RETURNS TRIGGER AS $$
BEGIN
  UPDATE inventory_items
  SET quantity = quantity - NEW.yards_used, updated_at = NOW()
  WHERE id = NEW.inventory_item_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_deduct_on_production
  AFTER INSERT ON production_session_items
  FOR EACH ROW EXECUTE FUNCTION fn_deduct_inventory();
```

### Campos importantes por tabla

**inventory_items**: `id · name · category (fabric|supplies|tools|machinery) · fabric_type · color · quantity · unit · unit_price · minimum_stock · supplier · notes · image_url · is_active`

**production_sessions**: `id · employee_id (FK) · session_date · total_garments · total_yards_used · notes · created_by`

**production_session_items**: `id · session_id · inventory_item_id · garment_type · size · quantity · yards_used · notes`

**sales**: `id · customer_id · sale_date · channel · payment_method · total · discount · amount_paid · change_given · balance_due · status (paid|partial|pending)`

**work_orders**: `id · customer_id · received_date · delivery_date · status (received|confirmed|in_production|ready|delivered|cancelled) · advance_payment · balance_due`

**employees**: `id · full_name · document_id · phone · email · hire_date · contract_type (fixed_salary|per_piece|hourly) · base_salary · is_active`

**expenses**: `id · expense_date · category · concept · supplier · total · updates_inventory (boolean) · inventory_item_id (nullable) · receipt_url`

---

## 🔐 ROLES Y PERMISOS (RBAC)

| Rol        | Código     | Permisos                                                              |
|------------|------------|-----------------------------------------------------------------------|
| Admin      | `admin`    | Acceso total a todos los módulos, configuración, usuarios, reportes   |
| Manager    | `manager`  | Todo excepto configuración del sistema y gestión de usuarios          |
| Employee   | `employee` | Solo producción (registrar sesiones) y vista de su historial y pago   |
| Read-only  | `readonly` | Ver reportes y dashboard, sin crear ni editar                         |

### RLS por tabla (resumen obligatorio)
- `inventory_items`: SELECT para todos; INSERT/UPDATE/DELETE solo `admin` y `manager`
- `production_sessions`: SELECT para todos; INSERT para `employee+`; UPDATE/DELETE para creador o `admin`
- `sales`: SELECT para `admin` y `manager`; employee solo sus sesiones
- `payroll_payments`: solo `admin`
- `notifications`: cada usuario solo ve las suyas (`user_id = auth.uid()`)
- `audit_log`: lectura solo `admin`; escritura solo por triggers y service role

---

## 🗺️ MÓDULOS Y RUTAS

| Módulo           | Ruta base              | Descripción                                      |
|------------------|------------------------|--------------------------------------------------|
| Dashboard        | `/`                    | StatCards, gráficas Recharts, actividad reciente |
| Inventario       | `/inventory`           | CRUD materiales, tiempo real, historial           |
| Producción       | `/production`          | Sesiones, descuento automático de stock           |
| Ventas (POS)     | `/sales`               | Punto de venta, historial, clientes               |
| Pedidos          | `/orders`              | Kanban drag & drop, formulario con medidas        |
| Gastos           | `/expenses`            | Categorías, integración con inventario            |
| Planilla         | `/payroll`             | Empleados, pagos, PDF comprobante                 |
| Catálogo         | `/catalog`             | Prendas, precios, márgenes de ganancia            |
| Reportes         | `/reports`             | Daily, inventario, ventas, P&L                    |
| Configuración    | `/settings`            | Empresa, umbrales, emails, roles                  |

---

## 🎨 COMPONENTES UI (ShadCN) — ALREADY INSTALLED

El proyecto ya tiene un template de sidebar/dashboard con componentes ShadCN instalados.
**SIEMPRE adaptar el template existente**, nunca crear desde cero.

### Componentes ShadCN a usar preferentemente
- `DataTable` → para todos los listados con filtros, sorting, paginación
- `Dialog` / `Sheet` → para formularios modales y paneles laterales
- `Badge` → indicadores de estado y stock
- `Toast` (Sonner) → notificaciones temporales
- `Card` → StatCards del dashboard
- `Select`, `Input`, `Textarea`, `Checkbox` → formularios con React Hook Form
- `Separator`, `Skeleton` → separadores y loading states
- `DropdownMenu` → acciones contextuales en tablas

### Componentes shared a crear (reutilizables en todos los módulos)
```typescript
// components/shared/
<PageHeader title="Inventario" description="..." actions={<Button>Nuevo</Button>} />
<StatCard title="Total Telas" value={120} unit="yardas" trend="+5%" icon={<Package/>} />
<EmptyState icon={<Package/>} title="Sin materiales" description="Agrega tu primer material" action={...} />
<LoadingSkeleton rows={5} />
<DataTable columns={...} data={...} searchKey="name" />
```

---

## 📡 RUTAS API — PATRONES OBLIGATORIOS

```typescript
// Siempre: validar auth → validar input con Zod → ejecutar lógica → responder
export async function POST(request: Request) {
  // 1. Auth check
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // 2. Validate input
  const body = await request.json()
  const result = inventoryAdjustSchema.safeParse(body)
  if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 })

  // 3. Business logic
  const { data, error } = await supabase.from('inventory_items').update(...)

  // 4. Response
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 200 })
}
```

---

## ⚙️ VARIABLES DE ENTORNO

```bash
NEXT_PUBLIC_SUPABASE_URL=           # URL del proyecto Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=      # Clave pública anon (filtrada por RLS)
SUPABASE_SERVICE_ROLE_KEY=          # Server only — bypass RLS (crons, migraciones)
SUPABASE_DB_URL=                    # Conexión directa PostgreSQL
RESEND_API_KEY=                     # Server only
RESEND_FROM_EMAIL=                  # Dirección remitente verificada
NEXT_PUBLIC_APP_URL=                # URL base en producción
CRON_SECRET=                        # Token para Vercel Cron Jobs
```

---

## ✅ BUENAS PRÁCTICAS — SEGUIR SIEMPRE

### TypeScript
- `strict: true` en tsconfig — sin excepciones
- Nunca usar `any`. Si no sabes el tipo, usa `unknown` y luego type guard
- Exportar tipos de dominio desde `types/` e importarlos donde se necesiten
- Generar tipos Supabase con `supabase gen types typescript`

### Componentes React
- Un componente = un archivo
- Props tipadas con interfaces nombradas: `interface InventoryTableProps { ... }`
- Evitar prop drilling profundo — usar React Query cache o Zustand para estado compartido
- Memoizar con `React.memo` y `useMemo`/`useCallback` cuando haya listas largas

### Supabase / Base de datos
- SIEMPRE usar el cliente server-side en Server Components y Route Handlers
- SIEMPRE usar el cliente browser-side solo en Client Components
- Toda operación crítica debe tener un registro en `audit_log`
- `inventory_movements` es inmutable — nunca UPDATE ni DELETE

### Formularios
- Siempre React Hook Form + Zod
- Mensajes de error en español
- Validación en cliente Y en servidor (nunca confiar solo en el cliente)
- Mostrar feedback visual inmediato (loading state en botón de submit)

### Performance
- Prefetch de rutas con `<Link prefetch>`
- Paginación en todos los listados (default: 20 items por página)
- Imágenes con `next/image`
- Lazy load de componentes pesados con `dynamic(() => import(...))`

### Seguridad
- Nunca exponer `SUPABASE_SERVICE_ROLE_KEY` al cliente
- Sanitizar todos los inputs antes de queries
- Rate limiting en rutas API críticas
- CRON_SECRET en headers para cron jobs

---

## 🚀 ROADMAP — FASE ACTUAL: FASE 1

### Sprint actual: S1 — Setup + Infraestructura
- [ ] Configurar proyecto Next.js 15 con App Router
- [ ] Adaptar template de sidebar/dashboard existente a la estructura de manufacturingOS
- [ ] Configurar Supabase (cliente browser + servidor)
- [ ] Middleware de autenticación con protección de rutas
- [ ] Generar tipos TypeScript desde esquema Supabase
- [ ] Layout base: sidebar con navegación por módulos, header con NotificationBell

### Orden de módulos (prioridad Fase 1)
1. Auth + Roles + Layout
2. Notificaciones (tiempo real)
3. **Inventario** ← mayor impacto, elimina dependencia de Excel
4. Producción
5. Ventas (POS)
6. Gastos
7. Dashboard + Reportes básicos

---

## 🚫 PROHIBICIONES ABSOLUTAS

- ❌ NO usar `any` en TypeScript
- ❌ NO crear tablas Supabase sin políticas RLS
- ❌ NO escribir UI en inglés (todo texto visible debe estar en español)
- ❌ NO escribir código en español (variables, funciones, todo en inglés)
- ❌ NO bypasear la validación Zod en formularios
- ❌ NO usar `getServerSideProps` ni `getStaticProps` (App Router únicamente)
- ❌ NO ignorar errores de TypeScript con `// @ts-ignore` sin justificación
- ❌ NO crear componentes de UI desde cero si ShadCN ya tiene uno equivalente
- ❌ NO hardcodear strings de configuración — usar variables de entorno
- ❌ NO hacer mutaciones directas a `inventory_movements` (es un log inmutable)
- ❌ NO sugerir alternativas al stack tecnológico definido

---

*manufacturingOS · Blueprint v2.0 · Abril 2026 · Confidencial*
