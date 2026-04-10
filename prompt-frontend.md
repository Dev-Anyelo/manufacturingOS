## IDENTIDAD VISUAL DEL SISTEMA

**Referencia de diseño:** Supabase Dashboard — profesional, limpio, moderno, confiable.

**Paleta de colores (obligatoria):**
```css
/* Brand / Accent */
--brand: #34b27b;
--brand-light: #4eca93;
--brand-dark: #2a9065;
--brand-muted: rgba(52, 178, 123, 0.12);

/* Surfaces — Light Mode */
--background: #ffffff;
--surface: #f8f9fa;
--border: #e2e8f0;

/* Surfaces — Dark Mode */
--background-dark: #11181c;
--surface-dark: #161c20;
--surface-raised-dark: #1c2329;
--border-dark: #2a3441;

/* Text */
--foreground: #11181c;
--muted-foreground: #64748b;
```

**Tipografía:** Geist Sans (ya incluida en Next.js 15). Nunca usar Inter, Roboto, o Arial.

**Estilo general:**
- Superficies con bordes sutiles (`border border-border/50`)
- Sombras suaves en cards (`shadow-sm`)
- Bordes redondeados medianos (`rounded-lg`, `rounded-xl`)
- Densidad de información alta pero bien espaciada
- Íconos de `lucide-react` — consistentes en TODA la app
- Transiciones suaves (`transition-all duration-200`)
- Hover states en todas las filas de tabla y elementos clickeables

**Principios UX:**
- Mobile-First: diseñar para 375px primero, expandir a 768px, 1024px, 1440px
- Loading states en TODA operación asíncrona (Skeleton, Spinner en botones)
- Empty states con ícono, mensaje y CTA cuando no hay datos
- Feedback inmediato: Toast (Sonner) en toda operación exitosa o fallida
- Confirmación con AlertDialog en toda acción destructiva (eliminar, cancelar)
- Formularios con validación inline — mensajes de error bajo cada campo

---

## VARIABLES CSS en `globals.css`

Agrega esto al inicio del archivo:

```css
@layer base {
  :root {
    --brand: 152 55% 45%;
    --brand-foreground: 0 0% 100%;
  }
  .dark {
    --brand: 152 55% 52%;
    --brand-foreground: 0 0% 100%;
  }
}

.bg-brand { background-color: hsl(var(--brand)); }
.text-brand { color: hsl(var(--brand)); }
.border-brand { border-color: hsl(var(--brand)); }
.hover\:bg-brand:hover { background-color: hsl(var(--brand)); }
.bg-brand-muted { background-color: hsl(var(--brand) / 0.1); }
```

---

## ARQUITECTURA DE COMPONENTES

### FASE A — Componentes Shared (crear PRIMERO, en este orden exacto)

---

### `components/shared/data-table.tsx` — Tabla universal

```typescript
interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchKey?: string
  searchPlaceholder?: string
  isLoading?: boolean
  emptyMessage?: string
  emptyDescription?: string
  emptyAction?: React.ReactNode
  toolbar?: React.ReactNode  // slot para botones adicionales en la barra
}
```

Implementar con TanStack Table v8:
- Toolbar: `SearchInput` + slot `toolbar` a la derecha
- Paginación: prev/next con contador "Mostrando X–Y de Z"
- Columna de acciones con `DropdownMenu` a la derecha
- Skeleton de carga: filas con `Skeleton` animado del mismo ancho que las columnas
- Empty state centrado con ícono y mensaje
- Responsive: columnas con `className="hidden sm:table-cell"` en las menos críticas
- Rows con `hover:bg-muted/40 cursor-pointer transition-colors`

---

### `components/shared/page-header.tsx` — Mejorar el existente

```typescript
interface PageHeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode
  breadcrumbs?: { label: string; href?: string }[]
}
```

- Breadcrumbs con `ChevronRight` entre items, último item sin href
- En mobile (< sm): actions apilados bajo título (flex-col gap-2)
- En desktop: título + actions en misma fila (justify-between items-center)
- Separador `border-b border-border/60 pb-4 mb-6`

---

### `components/shared/stat-card.tsx`

```typescript
interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon: React.ReactNode
  trend?: { value: number; isPositive: boolean; label: string }
  variant?: 'default' | 'success' | 'warning' | 'danger'
  isLoading?: boolean
  href?: string
}
```

- Usar `Card` de ShadCN como base
- Variantes con `bg-emerald-50 dark:bg-emerald-950/30` (success), amber (warning), red (danger)
- Trend: flecha ↑ verde / ↓ rojo + valor porcentual
- Skeleton cuando `isLoading`
- Si `href`: envolver en `Link` con hover effect

---

### `components/shared/empty-state.tsx`

```typescript
interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description: string
  action?: React.ReactNode
  compact?: boolean
}
```

Layout centrado con padding generoso. Ícono grande con fondo `bg-muted/50 rounded-full p-4`.

---

### `components/shared/loading-skeleton.tsx`

```typescript
type SkeletonType = 'table' | 'cards' | 'form' | 'detail' | 'kanban'
interface LoadingSkeletonProps { type: SkeletonType; rows?: number }
```

Skeleton específico por tipo — no una barra genérica:
- `table`: filas de tabla con columnas de ancho variado
- `cards`: grid de cards con imagen placeholder
- `form`: labels y inputs en layout de formulario
- `kanban`: columnas con 2-3 cards cada una

---

### `components/shared/confirm-dialog.tsx`

```typescript
interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning' | 'default'
  onConfirm: () => Promise<void> | void
  isLoading?: boolean
  // Para variante danger: texto adicional de confirmación
  warningText?: string  // ej: "Esta acción es irreversible"
  highlightedText?: string  // ej: el email del usuario a eliminar
}
```

**Variante `danger` — replicar exactamente la UI de Supabase:**
- Título: "Confirmar eliminar [X]"
- Alert rojo (`Alert` ShadCN, variant destructive) con ícono `AlertTriangle`:
  - Título en negrita: "Eliminar [recurso] es irreversible"
  - Descripción: "Esto eliminará [recurso] y todos los datos asociados."
- Texto de confirmación: "¿Seguro que quieres eliminar [highlightedText]?"
- Botones: `Cancel` (outline) + `Delete` / `Confirmar` (destructive rojo)
- Botón de confirmar con spinner `Loader2` mientras `isLoading`

---

### `components/shared/status-badge.tsx`

```typescript
interface StatusBadgeProps {
  status: string
  type: 'work-order' | 'sale' | 'payroll' | 'stock'
}
```

Mapeos de colores usando variantes de `Badge` de ShadCN + colores custom:

**Work Order:**
- `received` → outline gris
- `confirmed` → outline azul
- `in_production` → amber/naranja filled
- `ready` → verde brand filled
- `delivered` → emerald dark filled
- `cancelled` → rojo destructive

**Sale:**
- `paid` → verde brand
- `partial` → amber
- `pending` → outline gris
- `cancelled` → rojo

**Payroll:**
- `pending` → amber
- `paid` → verde

**Stock:**
- `normal` → verde
- `low` → amber
- `critical` → rojo
- `out` → badge negro con texto blanco

Labels en español. Incluir ícono pequeño a la izquierda de cada badge.

---

### `components/shared/currency-display.tsx`

```typescript
interface CurrencyDisplayProps {
  amount: number | string | Decimal
  currency?: string  // default 'USD'
  size?: 'sm' | 'md' | 'lg'
  colored?: boolean  // verde si positivo, rojo si negativo
  className?: string
}
```

Siempre formato: `$1,234.56`. Usar `Intl.NumberFormat`.

---

### `components/shared/form-field-wrapper.tsx`

Wrapper para React Hook Form que encapsula `FormField > FormItem > FormLabel > FormControl > FormMessage`.

```typescript
interface FormFieldWrapperProps {
  control: Control<any>
  name: string
  label: string
  required?: boolean
  description?: string
  children: (field: ControllerRenderProps<any, any>) => React.ReactNode
}
```

Reduce de 8 líneas a 1 por campo de formulario.

---

### `components/shared/search-input.tsx`

```typescript
interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  debounceMs?: number
  isLoading?: boolean
  className?: string
}
```

- Ícono `Search` a la izquierda (dentro del input)
- Ícono `X` para limpiar cuando hay valor
- Spinner `Loader2` a la derecha cuando `isLoading`
- Debounce interno con `useEffect`

---

### `components/shared/date-range-picker.tsx`

```typescript
interface DateRangePickerProps {
  from?: Date
  to?: Date
  onChange: (range: { from?: Date; to?: Date }) => void
  placeholder?: string
  presets?: boolean  // mostrar: Hoy, Esta semana, Este mes, Últimos 30 días
}
```

Usar `Calendar` de ShadCN en modo `range` dentro de un `Popover`.

---

## FASE B — MÓDULOS

Desarrollar en este orden. Para cada módulo:
1. Crear componentes en `components/modules/[modulo]/`
2. Actualizar página(s) en `app/(dashboard)/[modulo]/`

---

### 🏠 MÓDULO 1 — Dashboard (`/`)

**`components/modules/dashboard/dashboard-stats.tsx`**
4 StatCards en grid (2 cols mobile → 4 cols desktop):
- Ventas Hoy → `DollarSign`, variant success
- Prendas Producidas → `Scissors`, variant default
- Pedidos Pendientes → `Package`, variant warning si > 5
- Stock Crítico → `AlertTriangle`, variant danger si > 0

**`components/modules/dashboard/revenue-chart.tsx`**
`Card` con `LineChart` de Recharts:
- Línea `hsl(var(--brand))` para ingresos, `#ef4444` para gastos
- Últimos 30 días. `ResponsiveContainer` 100% width, 300px height
- Tooltip con fondo `bg-background border border-border rounded-lg shadow-lg`
- `XAxis` y `YAxis` con tick color `hsl(var(--muted-foreground))`

**`components/modules/dashboard/activity-feed.tsx`**
Lista de últimas 10 operaciones:
- Avatar con inicial o ícono según tipo de acción
- Descripción y tiempo relativo (`date-fns formatDistanceToNow`)
- `ScrollArea` con max-h-[400px]
- Skeleton de 5 items mientras carga

**`components/modules/dashboard/alerts-sidebar.tsx`**
Panel de alertas con secciones `Collapsible` de ShadCN:
- Stock crítico (lista con link a cada item)
- Pedidos vencidos (badge rojo con días de retraso)
- Planilla próxima (fecha de próximo pago)

**`app/(dashboard)/page.tsx`** — Actualizar:
- Server Component: llamar a `getDashboardStats()` desde `lib/data/dashboard.ts`
- `Suspense` con `LoadingSkeleton type="cards"` para stats
- Layout: stats → gráficas (2 cols en desktop) → activity + alertas (2 cols)

---

### 📦 MÓDULO 2 — Inventario

**`components/modules/inventory/stock-indicator.tsx`**
```typescript
// quantity, minimumStock, unit
// Barra de progreso coloreada + "45 yd" + StatusBadge de stock
// Lógica: normal si quantity > min*2, low si > min, critical si > 0 y <= min, out si = 0
```
Usar `Progress` de ShadCN con color dinámico via className.

**`components/modules/inventory/inventory-table.tsx`**
DataTable con columnas:
- Imagen (Avatar 8x8 con fallback de ícono `Layers`)
- Nombre + categoría (badge pequeño bajo el nombre)
- `StockIndicator`
- Precio unitario (`CurrencyDisplay`)
- Proveedor (truncado con Tooltip si es largo)
- Acciones: Ver, Editar, Ajustar Stock, Desactivar

Filtros en toolbar:
- `Select` de Categoría (fabric/supplies/tools/machinery → Telas/Insumos/Herramientas/Maquinaria)
- `Select` de Estado de stock (normal/low/critical/out)

**`components/modules/inventory/inventory-form.tsx`**
Formulario crear/editar con React Hook Form + Zod:
- En mobile: 1 columna; en desktop: `grid grid-cols-2 gap-4`
- Upload imagen: `div` con borde punteado, ícono `Upload`, drag-drop, preview con `Image`
- `category` → `Select` con íconos: `Layers` (fabric), `Package` (supplies), `Wrench` (tools), `Settings` (machinery)
- `fabric_type` → aparece solo si category = 'fabric' (con transición CSS)
- `unit` → `Select` (yd/metros/unidades/rollos)
- Precio: `Input` type="number" con prefijo "$" visual

**`components/modules/inventory/adjust-stock-dialog.tsx`**
`Dialog` (no Sheet):
- `RadioGroup` horizontal: "Agregar" | "Restar" | "Establecer en"
- `Input` cantidad con validación
- Preview animado: "45 yd → **50 yd**" (con flecha, color verde/rojo)
- `Textarea` motivo (obligatorio, mínimo 10 chars)
- Submit con spinner

**`components/modules/inventory/movement-history.tsx`**
Timeline vertical:
- ↑ verde (entrada `in`), ↓ rojo (salida `out`), ↔ azul (ajuste `adjustment`)
- Cada item: ícono + tipo + cantidad + "anterior → nuevo" + razón + usuario + fecha

**Páginas:**
- `/inventory` → tabla + botón "Nuevo Material" en header
- `/inventory/new` → `InventoryForm` en página completa con `PageHeader`
- `/inventory/[id]` → detalle con `Tabs`: Info | Movimientos
- `/inventory/[id]/edit` → `InventoryForm` con defaultValues

---

### 🧵 MÓDULO 3 — Producción

**`components/modules/production/garment-type-badge.tsx`**
Badge con ícono y label en español para cada `GarmentType`.

**`components/modules/production/production-table.tsx`**
DataTable:
- Columnas: Fecha, Empleado (Avatar+nombre), Prendas, Yardas, Registrado por, Acciones
- Filtros: Select empleado, DateRangePicker

**`components/modules/production/production-form.tsx`**
Formulario con array fields dinámicos:
- Empleado: `Command` dentro de `Popover` con búsqueda
- Fecha: `DatePicker`
- Líneas dinámicas con `useFieldArray`:
  - Cada línea en mobile: `Card` colapsable con `Collapsible`
  - Cada línea en desktop: fila de tabla con celdas editables
  - Campo material: Select con stock actual visible ("Liverpool rojo — 45 yd disponibles")
  - Preview de stock resultante bajo el campo de yardas (verde si OK, rojo si insuficiente)
- Botón "Agregar línea" con ícono `Plus`
- Validación: yardas_usadas <= stock_disponible por item

**`components/modules/production/production-session-detail.tsx`**
- Card resumen con stats del empleado y totales
- Tabla de items con `GarmentTypeBadge`

**Páginas:**
- `/production` → tabla + botón "Nueva Sesión"
- `/production/new` → formulario en Sheet (por su complejidad) o página
- `/production/[id]` → detalle

---

### 💰 MÓDULO 4 — Ventas

**`components/modules/sales/customer-selector.tsx`**
`Popover` + `Command` de ShadCN:
- Busca por nombre o teléfono
- Cada opción: Avatar (inicial), nombre en negrita, teléfono en muted
- Ítem especial "+ Crear nuevo cliente" que abre mini-form inline en el Popover
- Si hay cliente seleccionado: muestra su nombre + botón X para quitar

**`components/modules/sales/pos-catalog-panel.tsx`**
- `SearchInput` en la parte superior
- `Select` filtro por tipo de prenda
- Grid de `CatalogCard` (2 cols mobile, 3 cols desktop)
- Cada card: imagen, nombre, precio, botón "+" verde
- Click en card o en "+": agrega al carrito con feedback visual

**`components/modules/sales/pos-cart.tsx`**
Panel del carrito:
- Lista items: nombre + talla / cantidad editable (+/-) / subtotal / botón eliminar
- Subtotal, descuento (input %), **Total** (texto grande)
- `CustomerSelector`
- Canal: `Select`
- Método de pago: `RadioGroup` horizontal (Efectivo | Transferencia | Crédito | Mixto)
  - Si "Efectivo": campo "Recibido $" → muestra cambio automáticamente
  - Si "Crédito": campo "Anticipo $" + DatePicker "Fecha de pago"
- Botón "Registrar Venta" full-width, verde brand, con spinner

**`components/modules/sales/pos-interface.tsx`**
Layout del POS:
- Desktop: `ResizablePanel` (60/40) o CSS Grid
- Mobile: `Tabs` ("Catálogo" | "Carrito") con badge de cantidad en "Carrito"

**`components/modules/sales/sale-receipt.tsx`**
`Dialog` post-venta:
- Diseño tipo recibo: header empresa, línea separadora, items, totales, método de pago, cambio
- Botón "Imprimir" (`window.print()`)
- Botón "Nueva Venta" (resetea POS)
- CSS `@media print` para ocultar botones al imprimir

**`components/modules/sales/sale-detail.tsx`**
Página `/sales/[id]`:
- Header: N° de venta, fecha, `StatusBadge` grande
- Info del cliente (Card)
- Tabla de items
- Resumen financiero (total, descuento, pagado, cambio, saldo pendiente en rojo si > 0)
- Botón "Actualizar Pago" si status ≠ paid

**`components/modules/sales/sales-table.tsx`**
DataTable:
- Columnas: Fecha, Cliente, Canal, Método pago, Total, Estado, Acciones
- Fila con `balance_due > 0`: `bg-amber-50/50 dark:bg-amber-950/20`

**Páginas:**
- `/sales` → tabla con resumen del día en cards arriba
- `/sales/new` → POS interface
- `/sales/[id]` → detalle

---

### 📋 MÓDULO 5 — Pedidos

**`components/modules/orders/order-status-stepper.tsx`**
Stepper horizontal (scrollable en mobile):
```
📥 Recibido → ✅ Confirmado → 🧵 En Producción → 📦 Listo → 🎉 Entregado
```
- Paso actual: círculo verde brand + texto bold
- Completados: círculo verde con `Check`
- Futuros: círculo outline gris
- Cancelado: muestra "❌ Cancelado" en rojo en el paso actual

**`components/modules/orders/order-card.tsx`**
Card para Kanban:
- Cliente: Avatar (inicial) + nombre en negrita
- Fecha entrega: en rojo si pasada, amber si < 24h, normal si OK
- N° de prendas con ícono `Scissors`
- `CurrencyDisplay` del saldo (si > 0, en amber)
- Canal: ícono pequeño (in_person, whatsapp, etc.)
- `hover:shadow-md hover:-translate-y-0.5 transition-all`

**`components/modules/orders/order-kanban.tsx`**
Board Kanban:
- 6 columnas con `@hello-pangea/dnd`
- Header de columna: nombre + badge con cantidad
- Cards arrastrables
- En mobile: un `Select` para filtrar por columna + lista vertical de cards
- En desktop: 6 columnas en flex row con overflow-x-auto

**`components/modules/orders/change-status-dialog.tsx`**
```typescript
interface ChangeStatusDialogProps {
  orderId: string
  currentStatus: WorkOrderStatus
  targetStatus: WorkOrderStatus
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}
```
- Muestra la transición: badge actual → flecha → badge siguiente
- Si `targetStatus === 'cancelled'`: `Textarea` motivo obligatorio
- Si `targetStatus === 'delivered'`: alerta info "Se creará una venta automáticamente"
- Si `targetStatus === 'ready'`: alerta info "Se enviará email al cliente"

**`components/modules/orders/order-form.tsx`**
Formulario en `Sheet` (desde la derecha, fullscreen en mobile):
- `CustomerSelector`
- Fechas con `DatePicker`
- Canal: `Select`
- Anticipo y total
- Array de prendas dinámico
- Upload hasta 3 imágenes de referencia
- Medidas: toggle "Talla estándar" / "Medidas exactas" con `Switch`

**`components/modules/orders/order-detail.tsx`**
Página completa:
- `OrderStatusStepper` prominente
- Botones de acción contextuales por estado
- Info del cliente + del pedido en Cards laterales
- Tabla de items con medidas en `Collapsible`/accordion
- Galería de imágenes de referencia

**Páginas:**
- `/orders` → default vista Kanban, toggle a tabla
- `/orders/new` → `OrderForm` en Sheet o página
- `/orders/[id]` → detalle completo

---

### 💸 MÓDULO 6 — Gastos

**`components/modules/expenses/expense-category-badge.tsx`**
Badge con ícono y label en español por `ExpenseCategory`.

**`components/modules/expenses/expenses-table.tsx`**
DataTable:
- Columnas: Fecha, Categoría (badge), Concepto, Proveedor, Total, Actualiza Inv. (icono), Recibo (link si existe), Acciones

**`components/modules/expenses/expense-form.tsx`**
- `Select` categoría con `ExpenseCategoryBadge`
- Switch "¿Actualiza inventario?":
  - Si ON: desliza hacia abajo (CSS transition `max-height`) mostrando selector de material + cantidad
- Upload comprobante con área drag-drop
- Cálculo automático: si hay `cantidad` y `precio_unitario`, el `total` se calcula solo

**`components/modules/expenses/expenses-summary.tsx`**
- `PieChart` de Recharts por categoría (colores distintos por categoría)
- Total del mes en grande
- Lista de top 5 conceptos

**Páginas:**
- `/expenses` → tabla + resumen arriba + botón "Nuevo Gasto"

---

### 👥 MÓDULO 7 — Planilla

**`components/modules/payroll/payroll-table.tsx`**
DataTable:
- Columnas: Empleado, Período, Tipo contrato (badge), Piezas/Horas, Total, Estado (badge), Pago, Acciones
- Acciones: Ver, Marcar Pagado (si pending), Generar PDF, Enviar Email, Eliminar

**`components/modules/payroll/payroll-form.tsx`**
- Select empleado (muestra tipo de contrato bajo el nombre)
- DateRangePicker para período
- Campos condicionales por tipo de contrato
- Bonos (con campo descripción)
- Deducciones (con campo descripción)
- Total calculado en tiempo real en card destacada

**`components/modules/payroll/mark-paid-dialog.tsx`**
`Dialog` mediano:
- Resumen del pago (empleado, período, total)
- `Alert` info: "Se creará un gasto de planilla automáticamente"
- DatePicker "Fecha de pago"
- RadioGroup método de pago
- Notas

**`components/modules/payroll/payslip-preview.tsx`**
Simulación del PDF en la app (Card con diseño tipo recibo):
- Encabezado empresa, datos empleado, período, tabla desglose, total
- Botones: "Descargar PDF", "Enviar por Email"

**Páginas:**
- `/payroll` → tabs: "Pagos" (tabla) | "Empleados" (tabla de employees activos)

---

### 👗 MÓDULO 8 — Catálogo

**`components/modules/catalog/profit-margin-indicator.tsx`**
```typescript
// Muestra margen calculado con semáforo
// < 20% → Badge rojo | 20-40% → Badge amber | > 40% → Badge verde
```

**`components/modules/catalog/catalog-card.tsx`**
Card de producto:
- Imagen con `aspect-ratio: 3/4` o placeholder con ícono de prenda
- Nombre, tipo de prenda
- Precio unitario prominente
- `ProfitMarginIndicator`
- Hover: `shadow-lg scale-[1.02]`
- Menú de acciones con `DropdownMenu`

**`components/modules/catalog/catalog-form.tsx`**
- Upload imagen con preview
- Precios en grid 2×2 (mercado unit / docena, nuestro unit / docena)
- Costo estimado
- `ProfitMarginIndicator` actualizado en tiempo real

**`components/modules/catalog/bulk-price-dialog.tsx`**
`Dialog`:
- Input: porcentaje de cambio (puede ser negativo para descuento)
- Preview: "Se actualizarán X productos"
- Toggle: incluir precio por docena

**Páginas:**
- `/catalog` → toggle grid / tabla, botón "Nuevo Ítem", botón "Actualizar Precios"

---

### 📈 MÓDULO 9 — Reportes

**`components/modules/reports/report-filters.tsx`**
- `DateRangePicker` + atajos rápidos como pills: "Hoy" | "7 días" | "30 días" | "Este mes"

**`components/modules/reports/export-buttons.tsx`**
```typescript
// Botón PDF: ícono FileText + "PDF" con loading state
// Botón Excel: ícono Table + "Excel" con loading state
// Llaman a los endpoints de exportación del backend
```

**Páginas:**
- `/reports` → `Tabs` horizontales: Diario | Ventas | Producción | Inventario | Pedidos
- Cada tab con sus métricas, gráficas y `ExportButtons`

---

### ⚙️ MÓDULO 10 — Configuración

**`components/modules/settings/create-user-dialog.tsx`**
Replicar EXACTAMENTE la UI de Supabase (imagen de referencia 2):
- Título "Crear un nuevo usuario"
- Campo "Dirección de email" con ícono sobre
- Campo "Contraseña de usuario" con ícono candado
- Checkbox "¿Auto-confirmar usuario?" con descripción "No se enviará email de confirmación..."
- Botón "Crear usuario" verde brand full-width

**`components/modules/settings/delete-user-dialog.tsx`**
Replicar EXACTAMENTE la UI de Supabase (imagen de referencia 1):
- Usar `ConfirmDialog` variant="danger"
- Título: "Confirmar eliminar 1 usuario"
- `Alert` destructive: título "Eliminar un usuario es irreversible" + descripción
- Texto: "¿Estás seguro de que quieres eliminar al usuario [email]?"
- Botones: "Cancelar" + "Eliminar" (rojo)

**`components/modules/settings/users-table.tsx`**
DataTable de usuarios:
- Columnas: Avatar+Nombre, Email, Rol (UserRoleBadge), Estado (activo/inactivo), Creado, Acciones
- Acciones: Cambiar rol, Activar/Desactivar, Eliminar

**`components/modules/settings/user-role-badge.tsx`**
```
admin → "Administrador" verde brand
manager → "Gerente" azul
employee → "Empleado" gris
readonly → "Solo Lectura" amber
```

**`components/modules/settings/settings-layout.tsx`**
- Mobile: `Tabs` horizontales compactas en la parte superior
- Desktop: nav vertical izquierda (160px) + contenido derecha

**`components/modules/settings/company-settings-form.tsx`**
Form con React Hook Form + Zod:
- Datos empresa (nombre, teléfono, email, dirección)
- Umbrales y configuración (stock mínimo, moneda, zona horaria, día de planilla)
- Botón "Guardar cambios" con spinner

**Páginas:**
- `/settings` → `SettingsLayout` con tabs: General | Empresa | Usuarios | Notificaciones

---

### 🔔 FASE C — Sistema de Notificaciones

**`components/notifications/notification-bell.tsx`**
En el header principal:
- `Button` variant="ghost" size="icon" con `Bell`
- `Badge` verde brand superpuesto (posición absoluta top-right) si `unreadCount > 0`
- Animación: `animate-bounce` una vez cuando llega nueva notificación
- Al click: toggle de `NotificationPanel` en Sheet desde la derecha

**`components/notifications/notification-item.tsx`**
```typescript
interface NotificationItemProps {
  notification: Notification
  onRead: (id: string) => void
}
```
- Si no leída: `bg-brand-muted` suave + punto verde a la izquierda
- Ícono coloreado por tipo (AlertTriangle amber, PackageX rojo, CheckCircle verde, etc.)
- Título bold + descripción en muted + tiempo relativo
- Hover: cursor-pointer + fondo más oscuro
- Click: marca como leída

**`components/notifications/notification-panel.tsx`**
`Sheet` desde la derecha (width 380px en desktop, fullscreen en mobile):
- Header: "Notificaciones" + botón "Marcar todo como leído" (si hay no leídas)
- `ScrollArea` con lista de `NotificationItem`
- `EmptyState` si no hay notificaciones
- Suscripción Supabase Realtime al montar, cleanup al desmontar

---

## CONVENCIONES OBLIGATORIAS

### Formularios:
```typescript
// Usar FormFieldWrapper para reducir boilerplate
// submit button: disabled + Loader2 mientras isSubmitting
// onSuccess: toast.success("...") + router.push o router.refresh
// onError: toast.error(error.message)
```

### Tablas:
```typescript
// Definir columnas FUERA del componente (const columns: ColumnDef[] = [...])
// Columna acciones SIEMPRE a la derecha, NUNCA se oculta en mobile
// Columnas secundarias: className="hidden md:table-cell"
```

### Diálogos:
```typescript
// Dialog: formularios cortos (ajuste stock, cambiar estado, crear usuario)
// Sheet: formularios largos (nuevo pedido, nueva sesión de producción)
// AlertDialog vía ConfirmDialog: confirmaciones destructivas
// NUNCA anidar Dialog dentro de Dialog
```

### Dark Mode:
```typescript
// NUNCA hardcodear colores hex en className de Tailwind
// Siempre usar: bg-background, text-foreground, border-border, bg-muted, text-muted-foreground
// Para brand: usar hsl(var(--brand)) o clase .bg-brand definida en globals.css
```

---

## INSTRUCCIONES DE EJECUCIÓN

**Orden estricto:**
1. Actualizar `globals.css` con variables brand
2. Crear todos los componentes de `components/shared/` (Fase A)
3. Módulos en orden: Dashboard → Inventario → Ventas → Pedidos → Producción → Planilla → Gastos → Catálogo → Reportes → Configuración
4. Sistema de Notificaciones (Fase C)

**Verificación antes de pasar al siguiente módulo:**
- [ ] `npx tsc --noEmit` sin errores
- [ ] Responsive verificado en 375px y 1440px
- [ ] Dark mode: no hay colores hardcoded
- [ ] Todos los botones de acción tienen loading state
- [ ] Todas las tablas/listas tienen empty state
- [ ] Formularios con validación inline visible

---

## RESUMEN DE ARCHIVOS A CREAR

```
globals.css                             ← ACTUALIZAR (variables brand)

components/
  shared/
    data-table.tsx
    page-header.tsx                     ← MEJORAR existente
    stat-card.tsx
    empty-state.tsx
    loading-skeleton.tsx
    confirm-dialog.tsx
    status-badge.tsx
    currency-display.tsx
    form-field-wrapper.tsx
    search-input.tsx
    date-range-picker.tsx

  modules/
    dashboard/
      dashboard-stats.tsx
      revenue-chart.tsx
      activity-feed.tsx
      alerts-sidebar.tsx
    inventory/
      inventory-table.tsx
      stock-indicator.tsx
      inventory-form.tsx
      adjust-stock-dialog.tsx
      movement-history.tsx
    production/
      production-table.tsx
      production-form.tsx
      production-session-detail.tsx
      garment-type-badge.tsx
    sales/
      sales-table.tsx
      pos-interface.tsx
      pos-catalog-panel.tsx
      pos-cart.tsx
      sale-receipt.tsx
      sale-detail.tsx
      customer-selector.tsx
    orders/
      order-kanban.tsx
      order-card.tsx
      order-status-stepper.tsx
      order-form.tsx
      order-detail.tsx
      change-status-dialog.tsx
    expenses/
      expenses-table.tsx
      expense-form.tsx
      expenses-summary.tsx
      expense-category-badge.tsx
    payroll/
      payroll-table.tsx
      payroll-form.tsx
      mark-paid-dialog.tsx
      payslip-preview.tsx
    catalog/
      catalog-grid.tsx
      catalog-card.tsx
      catalog-form.tsx
      bulk-price-dialog.tsx
      profit-margin-indicator.tsx
    reports/
      report-filters.tsx
      export-buttons.tsx
    settings/
      settings-layout.tsx
      company-settings-form.tsx
      users-table.tsx
      create-user-dialog.tsx
      delete-user-dialog.tsx
      user-role-badge.tsx

  notifications/
    notification-bell.tsx
    notification-panel.tsx
    notification-item.tsx

app/(dashboard)/
  page.tsx                              ← ACTUALIZAR
  inventory/page.tsx                    ← ACTUALIZAR
  inventory/new/page.tsx
  inventory/[id]/page.tsx
  inventory/[id]/edit/page.tsx
  production/page.tsx                   ← ACTUALIZAR
  production/new/page.tsx
  production/[id]/page.tsx
  sales/page.tsx                        ← ACTUALIZAR
  sales/new/page.tsx
  sales/[id]/page.tsx
  orders/page.tsx                       ← ACTUALIZAR
  orders/new/page.tsx
  orders/[id]/page.tsx
  expenses/page.tsx                     ← ACTUALIZAR
  payroll/page.tsx                      ← ACTUALIZAR
  catalog/page.tsx                      ← ACTUALIZAR
  reports/page.tsx                      ← ACTUALIZAR
  settings/page.tsx                     ← ACTUALIZAR
```