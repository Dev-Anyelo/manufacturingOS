# 🏗️ Prompt — manufacturingOS Backend Completo

> Copia y pega este prompt en Cursor AI para desarrollar el backend completo.
> Ejecutar DESPUÉS de tener el Sprint 1 (arquitectura base) completado.

---

## CONTEXTO DEL SISTEMA

Estás desarrollando el backend completo de **manufacturingOS**, un ERP para talleres de confección.

**Stack:** Next.js 15 App Router · Supabase (PostgreSQL + Auth + Realtime + Storage) · TypeScript · Zod · Resend + React Email · @react-pdf/renderer

**Reglas absolutas de arquitectura:**
- Route Handlers en `app/api/` para toda la lógica de negocio
- Server Components para data fetching en páginas
- Zod para validar TODA entrada de usuario — nunca confiar en el cliente
- RLS de Supabase es la última línea de defensa de seguridad
- Todos los errores retornados en español hacia el cliente
- Código fuente, variables, funciones y comentarios en inglés
- Nunca exponer errores internos de Supabase o PostgreSQL al cliente

---

## FASE 0 — LIMPIEZA Y PREREQUISITOS

### 0A. Eliminar flujo de registro público

El registro de usuarios es EXCLUSIVO para administradores. Elimina o bloquea el acceso público:

1. Elimina o redirige `app/(auth)/register/page.tsx` → redirigir a `/login` con mensaje: `"El registro de nuevos usuarios solo puede hacerlo el administrador del sistema"`
2. Crea `app/api/admin/users/route.ts` — endpoint protegido (solo `admin`) para crear usuarios:
   ```
   POST /api/admin/users
   Body: { email, full_name, role, password? }
   - Crea usuario en Supabase Auth (supabaseAdmin con service_role key)
   - Crea registro en profiles con el rol asignado
   - Envía email de bienvenida con Resend (template: user-welcome.tsx)
   - Solo accesible con rol admin (verificar en middleware o al inicio del handler)
   ```
3. Crea `app/api/admin/users/[id]/route.ts`:
   ```
   PATCH /api/admin/users/[id] — actualizar rol, activar/desactivar usuario
   DELETE /api/admin/users/[id] — desactivar cuenta (soft delete: is_active = false)
   ```

### 0B. Migrar emails a Resend

Reemplaza SMTP de Supabase por Resend para TODOS los emails transaccionales:

1. Crea `lib/email/resend.ts` — cliente singleton de Resend:
   ```typescript
   import { Resend } from 'resend'
   export const resend = new Resend(process.env.RESEND_API_KEY)
   export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'noreply@manufacturingos.app'
   ```

2. Crea estos templates en `lib/email/templates/`:

   **`user-welcome.tsx`** — bienvenida a nuevo usuario:
   - Nombre, email, rol asignado, link de acceso al sistema, instrucciones para cambiar contraseña

   **`order-ready.tsx`** — pedido listo para entrega (al cliente):
   - Nombre del cliente, descripción del pedido, saldo pendiente, datos de contacto del taller

   **`low-stock-alert.tsx`** — resumen diario de materiales críticos (al admin):
   - Lista de materiales con stock bajo/crítico: nombre, stock actual, stock mínimo, proveedor

   **`payslip-notification.tsx`** — comprobante de pago enviado al empleado:
   - Nombre, período, desglose de pago, total, adjunta PDF si aplica

   **`monthly-report.tsx`** — reporte mensual automático (al admin):
   - Resumen: total ventas, total gastos, utilidad bruta, top 5 clientes, top materiales consumidos

3. Crea `lib/email/send.ts` — funciones helper tipadas:
   ```typescript
   sendWelcomeEmail(to: string, data: WelcomeEmailData): Promise<void>
   sendOrderReadyEmail(to: string, data: OrderReadyEmailData): Promise<void>
   sendLowStockAlert(to: string, data: LowStockAlertData): Promise<void>
   sendPayslipNotification(to: string, data: PayslipEmailData, pdfBuffer?: Buffer): Promise<void>
   sendMonthlyReport(to: string, data: MonthlyReportData, pdfBuffer?: Buffer): Promise<void>
   ```
   Cada función debe: manejar errores sin lanzar excepciones (log + return false), loggear en `audit_log` si falla.

### 0C. Esquema SQL completo — migraciones faltantes

Verifica que existan estas tablas. Si no existen, crea `supabase/migrations/004_missing_tables.sql`:

```sql
-- production_sessions
CREATE TABLE IF NOT EXISTS production_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_garments INT NOT NULL DEFAULT 0,
  total_yards_used NUMERIC(12,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- production_session_items
CREATE TABLE IF NOT EXISTS production_session_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES production_sessions(id) ON DELETE CASCADE,
  inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
  garment_type TEXT NOT NULL CHECK (garment_type IN ('shirt','skirt','shorts','leggings','pajamas','suit','sheets','blankets','other')),
  size TEXT NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  yards_used NUMERIC(12,2) NOT NULL CHECK (yards_used > 0),
  notes TEXT
);

-- sales
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
  channel TEXT NOT NULL CHECK (channel IN ('in_person','order','whatsapp','marketplace','other')),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash','transfer','credit','mixed')),
  total NUMERIC(12,2) NOT NULL CHECK (total >= 0),
  discount NUMERIC(12,2) NOT NULL DEFAULT 0,
  amount_paid NUMERIC(12,2) NOT NULL DEFAULT 0,
  change_given NUMERIC(12,2) NOT NULL DEFAULT 0,
  balance_due NUMERIC(12,2) GENERATED ALWAYS AS (total - discount - amount_paid) STORED,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('paid','partial','pending')),
  notes TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- sale_items
CREATE TABLE IF NOT EXISTS sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  catalog_item_id UUID REFERENCES catalog_items(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  size TEXT,
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
  discount NUMERIC(12,2) NOT NULL DEFAULT 0,
  subtotal NUMERIC(12,2) GENERATED ALWAYS AS ((unit_price * quantity) - discount) STORED
);

-- work_orders (pedidos a la medida)
CREATE TABLE IF NOT EXISTS work_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  received_date DATE NOT NULL DEFAULT CURRENT_DATE,
  delivery_date DATE NOT NULL CHECK (delivery_date > received_date),
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received','confirmed','in_production','ready','delivered','cancelled')),
  channel TEXT NOT NULL DEFAULT 'in_person' CHECK (channel IN ('referral','social_media','returning_customer','other')),
  advance_paid NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  balance_due NUMERIC(12,2) GENERATED ALWAYS AS (total - advance_paid) STORED,
  reserved_materials JSONB,
  reference_images TEXT[],
  notes TEXT,
  cancelled_reason TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- work_order_items
CREATE TABLE IF NOT EXISTS work_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  catalog_item_id UUID REFERENCES catalog_items(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  size TEXT,
  measurements JSONB, -- {bust, waist, hips, length, sleeve}
  inventory_item_id UUID REFERENCES inventory_items(id) ON DELETE SET NULL,
  color TEXT,
  design_notes TEXT,
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
  subtotal NUMERIC(12,2) GENERATED ALWAYS AS (unit_price * quantity) STORED
);

-- expenses
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  category TEXT NOT NULL CHECK (category IN ('fabrics','supplies','tools','machinery','outsourced_labor','services','packaging','office','payroll','other')),
  concept TEXT NOT NULL,
  supplier TEXT,
  quantity NUMERIC(12,2),
  unit_price NUMERIC(12,2),
  total NUMERIC(12,2) NOT NULL CHECK (total >= 0),
  updates_inventory BOOLEAN NOT NULL DEFAULT FALSE,
  inventory_item_id UUID REFERENCES inventory_items(id) ON DELETE SET NULL,
  inventory_quantity_added NUMERIC(12,2),
  receipt_url TEXT,
  notes TEXT,
  payroll_payment_id UUID, -- referencia opcional a payroll_payments
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- payroll_payments
CREATE TABLE IF NOT EXISTS payroll_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL CHECK (period_end >= period_start),
  pieces_produced INT,
  hours_worked NUMERIC(8,2),
  base_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  bonuses NUMERIC(12,2) NOT NULL DEFAULT 0,
  deductions NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) GENERATED ALWAYS AS (base_amount + bonuses - deductions) STORED,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid')),
  payment_date DATE,
  payment_method TEXT CHECK (payment_method IN ('cash','transfer','other')),
  notes TEXT,
  receipt_url TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

Crea `supabase/migrations/005_rls_new_tables.sql` con políticas RLS para todas las tablas anteriores según estas reglas:
- `production_sessions / production_session_items`: SELECT todos autenticados; INSERT employee/manager/admin; UPDATE/DELETE solo creador o admin
- `sales / sale_items`: SELECT admin y manager; employee solo sus propias ventas; INSERT todos; UPDATE/DELETE solo admin
- `work_orders / work_order_items`: SELECT todos autenticados; INSERT/UPDATE admin y manager; DELETE solo admin
- `expenses`: SELECT/INSERT admin y manager; UPDATE/DELETE solo admin
- `payroll_payments`: SELECT/INSERT/UPDATE/DELETE solo admin

Crea `supabase/migrations/006_triggers_business_logic.sql`:
```sql
-- Trigger: descontar inventario al guardar sesión de producción
-- fn_deduct_inventory() + trg_deduct_on_production (ya especificado en Sprint 1)

-- Trigger: actualizar total_garments y total_yards_used en production_sessions
CREATE OR REPLACE FUNCTION fn_update_session_totals() RETURNS TRIGGER AS $$
BEGIN
  UPDATE production_sessions SET
    total_garments = (SELECT COALESCE(SUM(quantity),0) FROM production_session_items WHERE session_id = NEW.session_id),
    total_yards_used = (SELECT COALESCE(SUM(yards_used),0) FROM production_session_items WHERE session_id = NEW.session_id)
  WHERE id = NEW.session_id;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

-- Trigger: actualizar customer total_purchases al registrar/actualizar venta
CREATE OR REPLACE FUNCTION fn_update_customer_stats() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW.customer_id IS NOT NULL THEN
      UPDATE customers SET
        total_purchases = (SELECT COALESCE(SUM(total - discount),0) FROM sales WHERE customer_id = NEW.customer_id AND status != 'cancelled'),
        updated_at = NOW()
      WHERE id = NEW.customer_id;
    END IF;
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

-- Trigger: al marcar payroll_payment como 'paid', crear gasto automático
CREATE OR REPLACE FUNCTION fn_create_payroll_expense() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'paid' AND OLD.status = 'pending' THEN
    INSERT INTO expenses (expense_date, category, concept, total, created_by, payroll_payment_id)
    VALUES (
      COALESCE(NEW.payment_date, CURRENT_DATE),
      'payroll',
      (SELECT 'Pago de planilla: ' || full_name FROM employees WHERE id = NEW.employee_id),
      NEW.total,
      NEW.created_by,
      NEW.id
    );
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

-- Trigger: al cancelar work_order, liberar materiales reservados
-- (actualizar campo reserved_materials a null e insertar movimiento de tipo 'adjustment' si aplica)

-- Trigger: al entregar work_order (status → delivered), crear venta automática
CREATE OR REPLACE FUNCTION fn_create_sale_from_work_order() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
    -- Insertar en sales
    WITH new_sale AS (
      INSERT INTO sales (customer_id, sale_date, channel, payment_method, total, amount_paid, status, notes, created_by)
      VALUES (NEW.customer_id, CURRENT_DATE, 'order', 'mixed', NEW.total, NEW.advance_paid,
              CASE WHEN NEW.advance_paid >= NEW.total THEN 'paid' ELSE 'partial' END,
              'Generado automáticamente desde pedido #' || NEW.id, NEW.created_by)
      RETURNING id
    )
    INSERT INTO sale_items (sale_id, description, quantity, unit_price)
    SELECT ns.id, woi.description, woi.quantity, woi.unit_price
    FROM work_order_items woi CROSS JOIN new_sale ns
    WHERE woi.work_order_id = NEW.id;
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;
```

---

## FASE 1 — VALIDACIONES ZOD (lib/validations/)

Crea esquemas Zod completos con mensajes de error en español para todos los módulos:

### `lib/validations/inventory.ts`
```typescript
// inventoryItemSchema — crear/editar material
// campos: name, category, fabric_type?, color?, quantity, unit, unit_price, minimum_stock, supplier?, notes?
// Reglas: quantity >= 0, unit_price >= 0, minimum_stock >= 0, name min 2 chars

// inventoryAdjustSchema — ajuste manual de stock
// campos: inventory_item_id, adjustment_type ('add'|'subtract'|'set'), quantity, reason (obligatorio)
// Regla: reason min 10 chars ("El motivo debe tener al menos 10 caracteres")
```

### `lib/validations/production.ts`
```typescript
// productionSessionSchema
// campos: employee_id, session_date, notes?, items (array min 1)
// item: inventory_item_id, garment_type, size, quantity, yards_used, notes?
// Regla cross-field: yards_used no puede ser 0 si garment_type no es 'other'

// Exportar también GarmentType y GarmentSize como constantes para reutilizar en UI
```

### `lib/validations/sales.ts`
```typescript
// saleSchema (POS)
// campos: customer_id?, sale_date, channel, payment_method, discount, amount_paid, notes?, items (array min 1)
// item: catalog_item_id?, description, size?, quantity, unit_price, discount
// Regla: amount_paid >= 0, discount >= 0, discount < total calculado

// customerSchema
// campos: full_name (min 2), phone?, email? (email válido), address?, notes?
```

### `lib/validations/orders.ts`
```typescript
// workOrderSchema
// campos: customer_id, delivery_date, channel, advance_paid, total, notes?, items (array min 1)
// item: description, size?, measurements? ({bust?,waist?,hips?,length?,sleeve?} todos en cm numérico),
//       inventory_item_id?, color?, design_notes?, quantity, unit_price
// Regla: delivery_date debe ser futura (> hoy)
// Regla: advance_paid <= total

// workOrderStatusSchema — para cambio de estado
// campos: status, cancelled_reason? (obligatorio si status = 'cancelled')
```

### `lib/validations/expenses.ts`
```typescript
// expenseSchema
// campos: expense_date, category, concept (min 3), supplier?, quantity?, unit_price?, total,
//         updates_inventory, inventory_item_id? (required si updates_inventory=true),
//         inventory_quantity_added? (required y > 0 si updates_inventory=true), notes?, receipt_url?
// Validación condicional con Zod .superRefine()
```

### `lib/validations/payroll.ts`
```typescript
// payrollPaymentSchema
// campos: employee_id, period_start, period_end, pieces_produced?, hours_worked?,
//         base_amount, bonuses, deductions, payment_method?, notes?
// Reglas: period_end >= period_start, base_amount >= 0, bonuses >= 0, deductions >= 0

// payrollMarkPaidSchema
// campos: payment_date, payment_method (required), notes?
```

### `lib/validations/catalog.ts`
```typescript
// catalogItemSchema
// campos: name, description?, garment_type, market_price_unit, market_price_dozen?,
//         our_price_unit, our_price_dozen?, estimated_cost?, image_url?, notes?
// Regla: our_price_unit > 0, market_price_unit > 0
```

### `lib/validations/settings.ts`
```typescript
// systemSettingsSchema
// campos: company_name, company_phone?, company_email?, company_address?,
//         low_stock_threshold (int 1-1000), currency, timezone
```

---

## FASE 2 — ROUTE HANDLERS (app/api/)

Para cada handler: validar sesión → verificar rol → validar body con Zod → ejecutar lógica → retornar respuesta tipada.

Crea un helper base en `lib/api/response.ts`:
```typescript
// apiSuccess(data, status = 200) → NextResponse con {success: true, data}
// apiError(message, status = 400) → NextResponse con {success: false, error: message}
// requireAuth(request) → devuelve {user, profile} o lanza → respuesta 401
// requireRole(profile, roles[]) → verifica rol o lanza → respuesta 403
```

### 📦 Inventario — `app/api/inventory/`

```
GET    /api/inventory              → lista con filtros: ?category, ?search, ?stock_status (normal|low|critical|out)
POST   /api/inventory              → crear material (admin/manager)
GET    /api/inventory/[id]         → detalle + últimos 20 movimientos
PATCH  /api/inventory/[id]         → editar material (admin/manager)
DELETE /api/inventory/[id]         → soft delete is_active=false (admin)
POST   /api/inventory/[id]/adjust  → ajuste manual de stock (admin) — crea inventory_movement
GET    /api/inventory/movements    → historial global de movimientos con filtros
GET    /api/inventory/low-stock    → materiales con quantity <= minimum_stock (para alertas)
```

Lógica especial del ajuste manual:
1. Obtener quantity actual con SELECT FOR UPDATE
2. Calcular nueva quantity según tipo de ajuste
3. Validar que no quede negativa
4. Actualizar inventory_items
5. Insertar en inventory_movements (previous_quantity, new_quantity, reason, created_by)
6. Si nueva quantity <= minimum_stock → insertar notificación para admin

### 🧵 Producción — `app/api/production/`

```
GET  /api/production               → lista de sesiones con filtros: ?employee_id, ?date_from, ?date_to, ?garment_type
POST /api/production               → crear sesión con items (employee/manager/admin)
GET  /api/production/[id]          → detalle de sesión con items y estado de inventario al momento
PATCH /api/production/[id]         → editar sesión (solo si misma jornada, solo creador o admin)
DELETE /api/production/[id]        → cancelar sesión — REVERTIR descuentos de inventario (admin)
```

Lógica crítica del POST:
1. Validar body con productionSessionSchema
2. Para cada item, verificar que inventory_items.quantity >= yards_used (SELECT FOR UPDATE)
3. Si alguno falla: retornar error 422 con el nombre del material sin stock suficiente
4. Insertar production_session (los triggers se encargan del descuento de inventario)
5. Insertar production_session_items
6. Emitir notificación `production_saved` al creador
7. Para cada item descuente, verificar si quedó en stock crítico → notificación `low_stock`

### 💰 Ventas — `app/api/sales/`

```
GET  /api/sales                    → lista con filtros: ?date_from, ?date_to, ?status, ?customer_id, ?channel
POST /api/sales                    → registrar venta (POS)
GET  /api/sales/[id]               → detalle con items
PATCH /api/sales/[id]/status       → actualizar status de pago (admin/manager)
GET  /api/sales/summary            → totales del día: {total_sales, total_amount, by_channel, by_payment_method}
```

Lógica del POST (POS):
1. Calcular total desde items en el servidor (nunca confiar en total del cliente)
2. Calcular balance_due = total - discount - amount_paid
3. Determinar status automáticamente: paid | partial | pending
4. Crear sale + sale_items en transacción
5. Actualizar customer.total_purchases si hay customer_id (trigger lo hace)
6. Emitir notificación `sale_completed`
7. Retornar sale con ID para generar recibo

### 📋 Pedidos — `app/api/orders/`

```
GET  /api/orders                   → lista con filtros: ?status, ?customer_id, ?date_from, ?date_to, ?overdue (bool)
POST /api/orders                   → crear pedido nuevo
GET  /api/orders/[id]              → detalle con items e historial de cambios de estado
PATCH /api/orders/[id]             → editar datos del pedido (solo si status = received/confirmed)
PATCH /api/orders/[id]/status      → cambiar estado — con validación de transiciones permitidas
DELETE /api/orders/[id]            → solo admin, solo si status = received/cancelled
GET  /api/orders/kanban            → datos agrupados por status para la vista Kanban
```

Lógica del PATCH status (transiciones permitidas):
```
received → confirmed | cancelled
confirmed → in_production | cancelled
in_production → ready | cancelled
ready → delivered
(delivered y cancelled son estados finales)
```

Al cambiar a `ready`:
- Insertar notificación `order_ready` para admin
- Enviar email al cliente si tiene email (template `order-ready.tsx` via Resend)

Al cambiar a `cancelled`:
- `cancelled_reason` es obligatorio
- Liberar materiales reservados: insertar movimientos de tipo `adjustment` en inventory_movements

Al cambiar a `delivered`:
- El trigger SQL `fn_create_sale_from_work_order` crea la venta automáticamente
- Insertar notificación `sale_completed`

### 💸 Gastos — `app/api/expenses/`

```
GET  /api/expenses                 → lista con filtros: ?date_from, ?date_to, ?category
POST /api/expenses                 → registrar gasto
GET  /api/expenses/[id]            → detalle
PATCH /api/expenses/[id]           → editar (admin)
DELETE /api/expenses/[id]          → eliminar (admin)
GET  /api/expenses/summary         → resumen: {by_category, monthly_total, top_concepts}
POST /api/expenses/[id]/receipt    → subir comprobante a Supabase Storage, actualizar receipt_url
```

Lógica especial si `updates_inventory = true`:
1. Validar que inventory_item_id y inventory_quantity_added estén presentes
2. Crear expense
3. Obtener quantity actual del item
4. Actualizar inventory_items.quantity += inventory_quantity_added
5. Insertar en inventory_movements con type = 'in', reason = 'Compra: ' + expense.concept

### 👥 Planilla — `app/api/payroll/`

```
GET  /api/payroll                  → lista de pagos con filtros: ?employee_id, ?status, ?date_from
POST /api/payroll                  → crear registro de pago (admin)
GET  /api/payroll/[id]             → detalle
PATCH /api/payroll/[id]            → editar (solo si status = pending)
PATCH /api/payroll/[id]/mark-paid  → marcar como pagado (admin)
DELETE /api/payroll/[id]           → eliminar (admin, solo si status = pending)
GET  /api/payroll/[id]/pdf         → generar PDF del comprobante (stream)
POST /api/payroll/[id]/send-email  → enviar comprobante por email al empleado
GET  /api/payroll/summary          → totales por empleado en el período
```

Lógica del mark-paid:
1. Actualizar status = 'paid', payment_date, payment_method
2. El trigger `fn_create_payroll_expense` crea el gasto automáticamente
3. Generar PDF del comprobante con @react-pdf/renderer
4. Si employee tiene email → enviar con Resend (template payslip-notification)
5. Guardar PDF en Supabase Storage, actualizar receipt_url
6. Insertar notificación `production_saved` o equivalente

### 👗 Catálogo — `app/api/catalog/`

```
GET    /api/catalog                → lista activa con ?search, ?garment_type
POST   /api/catalog                → crear ítem (admin/manager)
GET    /api/catalog/[id]           → detalle
PATCH  /api/catalog/[id]           → editar
DELETE /api/catalog/[id]           → soft delete (admin)
POST   /api/catalog/[id]/image     → subir imagen a Supabase Storage
PATCH  /api/catalog/bulk-price     → actualizar precios en masa por porcentaje (admin)
```

### ⚙️ Configuración — `app/api/settings/`

```
GET   /api/settings                → obtener configuración del sistema (admin)
PATCH /api/settings                → actualizar configuración (admin)
GET   /api/settings/users          → listar todos los usuarios/profiles (admin)
POST  /api/settings/users          → crear usuario nuevo (admin) — ver Fase 0A
PATCH /api/settings/users/[id]     → cambiar rol o desactivar (admin)
```

### 📈 Reportes — `app/api/reports/`

```
GET /api/reports/daily             → resumen del día: ventas, producción, gastos
GET /api/reports/inventory         → estado completo del inventario
GET /api/reports/sales             → ventas por período: ?date_from, ?date_to
GET /api/reports/production        → producción por período
GET /api/reports/orders            → estado de pedidos
GET /api/reports/export/pdf        → generar PDF del reporte actual (con @react-pdf)
GET /api/reports/export/excel      → exportar a Excel (con xlsx library)
```

### 🔔 Notificaciones — `app/api/notifications/`

```
GET   /api/notifications           → listar notificaciones del usuario autenticado (?unread_only)
PATCH /api/notifications/[id]/read → marcar como leída
PATCH /api/notifications/read-all  → marcar todas como leídas
DELETE /api/notifications/[id]     → eliminar notificación propia
```

---

## FASE 3 — LÓGICA DE NEGOCIO AUXILIAR

### 3A. PDF Generation — `lib/pdf/`

```typescript
// lib/pdf/payslip.tsx — PayslipPDF con @react-pdf/renderer
// Props: { employee, payment, company }
// Contenido: logo empresa, nombre empleado, período, desglose (base + bonos - deducciones), total, firma

// lib/pdf/sale-receipt.tsx — SaleReceiptPDF
// Props: { sale, items, customer?, company }
// Contenido: fecha, N° de recibo, items, subtotal, descuento, total, método de pago, cambio

// lib/pdf/inventory-report.tsx — InventoryReportPDF
// Props: { items, generatedAt, company }
// Contenido: tabla de materiales con columnas: nombre, categoría, stock actual, mínimo, estado, precio

// Función helper: generatePDFBuffer(component) → Promise<Buffer>
// Para uso en Route Handlers que necesitan el PDF como buffer (email adjunto, Storage)
```

### 3B. Cron Jobs — `app/api/cron/`

Estos endpoints son llamados por Vercel Cron o un cron job externo. Protegerlos con `CRON_SECRET` en header:

```typescript
// app/api/cron/daily-report/route.ts — POST
// Ejecutar a las 23:00 diariamente
// 1. Compilar resumen del día (ventas, producción, gastos)
// 2. Generar PDF del reporte con InventoryReportPDF
// 3. Enviar email al admin con Resend (monthly-report template)
// 4. Insertar notificación 'monthly_report' en tabla notifications para admin

// app/api/cron/check-overdue-orders/route.ts — POST
// Ejecutar cada día a las 08:00
// 1. Buscar work_orders donde delivery_date = hoy Y status NOT IN ('delivered','cancelled')
// 2. Insertar notificaciones 'order_overdue' para admin

// app/api/cron/check-low-stock/route.ts — POST
// Ejecutar diariamente a las 09:00
// 1. Buscar inventory_items con quantity <= minimum_stock Y is_active = true
// 2. Si hay items críticos → insertar notificación 'low_stock' para admin + enviar email de alerta

// app/api/cron/check-payroll-due/route.ts — POST
// Ejecutar diariamente
// 1. Leer system_settings.payroll_day (día del mes de pago)
// 2. Si faltan 3 días → insertar notificación 'payment_due' para admin
```

Agrega en `vercel.json`:
```json
{
  "crons": [
    { "path": "/api/cron/daily-report", "schedule": "0 23 * * *" },
    { "path": "/api/cron/check-overdue-orders", "schedule": "0 8 * * *" },
    { "path": "/api/cron/check-low-stock", "schedule": "0 9 * * *" },
    { "path": "/api/cron/check-payroll-due", "schedule": "0 8 * * *" }
  ]
}
```

### 3C. Supabase Storage — `lib/storage/`

```typescript
// lib/storage/upload.ts

// uploadInventoryImage(file: File, itemId: string): Promise<string>
// → bucket: 'inventory', path: inventory/{itemId}/{timestamp}.{ext}

// uploadOrderReference(file: File, orderId: string): Promise<string>
// → bucket: 'orders', path: orders/{orderId}/{timestamp}.{ext}

// uploadReceipt(file: File, type: 'expense'|'payroll', refId: string): Promise<string>
// → bucket: 'receipts', path: {type}/{refId}/{timestamp}.{ext}

// uploadCatalogImage(file: File, itemId: string): Promise<string>
// → bucket: 'catalog', path: catalog/{itemId}/{timestamp}.{ext}

// deleteFile(bucket: string, path: string): Promise<void>

// Reglas de Storage en Supabase:
// - inventory: lectura pública, escritura autenticada
// - orders: lectura autenticada, escritura admin/manager
// - receipts: lectura admin only, escritura admin
// - catalog: lectura pública, escritura admin/manager
```

---

## FASE 4 — SERVER COMPONENTS (Data Fetching en Páginas)

Para cada página, crea la función de data fetching que se llama directamente desde el Server Component:

### `lib/data/` — funciones de fetching del servidor

```typescript
// inventory.ts
getInventoryItems(filters?: InventoryFilters): Promise<InventoryItem[]>
getInventoryItem(id: string): Promise<InventoryItemWithMovements | null>
getInventoryMovements(filters?: MovementFilters): Promise<InventoryMovement[]>
getLowStockItems(): Promise<InventoryItem[]>

// production.ts
getProductionSessions(filters?: ProductionFilters): Promise<ProductionSession[]>
getProductionSession(id: string): Promise<ProductionSessionWithItems | null>
getTodayProductionSummary(): Promise<{ total_garments: number; total_yards: number }>

// sales.ts
getSales(filters?: SaleFilters): Promise<Sale[]>
getSale(id: string): Promise<SaleWithItems | null>
getTodaySalesSummary(): Promise<{ total_sales: number; total_amount: number }>

// orders.ts
getWorkOrders(filters?: OrderFilters): Promise<WorkOrder[]>
getWorkOrder(id: string): Promise<WorkOrderWithItems | null>
getKanbanData(): Promise<Record<OrderStatus, WorkOrder[]>>
getOverdueOrders(): Promise<WorkOrder[]>

// expenses.ts
getExpenses(filters?: ExpenseFilters): Promise<Expense[]>
getExpenseSummary(dateFrom: Date, dateTo: Date): Promise<ExpenseSummary>

// payroll.ts
getPayrollPayments(filters?: PayrollFilters): Promise<PayrollPayment[]>
getPayrollPayment(id: string): Promise<PayrollPaymentWithEmployee | null>
getEmployeeProductionForPeriod(employeeId: string, from: Date, to: Date): Promise<number>

// dashboard.ts — agrega las 4 StatCards en UNA sola query eficiente
getDashboardStats(): Promise<{
  todaySales: number
  todaySalesCount: number
  criticalStockCount: number
  pendingOrdersCount: number
  todayGarments: number
}>
getRecentActivity(limit?: number): Promise<AuditLogEntry[]>
```

---

## FASE 5 — TIPOS TYPESCRIPT COMPLETOS

Actualiza `types/index.ts` con TODOS los tipos de dominio incluyendo las tablas nuevas:

```typescript
// Enums (como const objects para usarlos en UI también)
export const GARMENT_TYPES = { shirt: 'Camisa', skirt: 'Falda', ... } as const
export const ORDER_STATUSES = { received: '📥 Recibido', confirmed: '✅ Confirmado', ... } as const
export const EXPENSE_CATEGORIES = { fabrics: 'Telas', supplies: 'Insumos', ... } as const

// Tipos base (alineados 1:1 con el schema de Supabase/Prisma)
export type ProductionSession = { ... }
export type ProductionSessionItem = { ... }
export type Sale = { ... }
export type SaleItem = { ... }
export type WorkOrder = { ... }
export type WorkOrderItem = { ... }
export type Expense = { ... }
export type PayrollPayment = { ... }
export type CatalogItem = { ... }

// Tipos extendidos con joins
export type ProductionSessionWithItems = ProductionSession & { items: (ProductionSessionItem & { inventory_item: InventoryItem })[] }
export type SaleWithItems = Sale & { items: SaleItem[]; customer?: Customer }
export type WorkOrderWithItems = WorkOrder & { items: WorkOrderItem[]; customer: Customer }
export type PayrollPaymentWithEmployee = PayrollPayment & { employee: Employee }

// Tipos de request (para los Route Handlers)
export type CreateProductionSessionRequest = z.infer<typeof productionSessionSchema>
export type CreateSaleRequest = z.infer<typeof saleSchema>
// ... etc para cada schema Zod
```

---

## INSTRUCCIONES DE EJECUCIÓN

Ejecuta en este orden estricto:

1. **Fase 0** — Limpieza (eliminar registro público, configurar Resend, migraciones SQL)
2. **Fase 1** — Todos los schemas Zod
3. **Fase 2** — Route Handlers (en orden: inventory → production → sales → orders → expenses → payroll → catalog → settings → reports → notifications)
4. **Fase 3** — Lógica auxiliar (PDF, crons, Storage)
5. **Fase 4** — Funciones de data fetching
6. **Fase 5** — Tipos TypeScript

**Reglas de calidad para cada archivo:**
- Verificar que todos los imports resuelven correctamente
- No usar `any` implícito — si algo es desconocido, usar `unknown` y narrowing
- Todos los errores de Supabase deben ser capturados y retornados como `apiError()`
- Las operaciones que modifican múltiples tablas deben usar transacciones o funciones SQL atómicas
- Agregar comentarios JSDoc en funciones de lógica de negocio compleja

**Verificaciones post-implementación:**
- Ejecutar `npx tsc --noEmit` — cero errores de TypeScript
- Verificar que cada Route Handler retorna el tipo correcto en éxito y error
- Confirmar que todos los endpoints protegidos verifican sesión y rol al inicio

---

## VARIABLES DE ENTORNO REQUERIDAS

Verifica que estas variables existan en `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=       # Para operaciones admin (crear usuarios, etc.)

# Resend
RESEND_API_KEY=
RESEND_FROM_EMAIL=noreply@manufacturingos.app

# Cron security
CRON_SECRET=                     # Token secreto para proteger endpoints de cron

# App
NEXT_PUBLIC_APP_URL=             # URL base para links en emails
```

---

## RESUMEN DE ARCHIVOS A CREAR

```
app/
  api/
    admin/users/route.ts
    admin/users/[id]/route.ts
    inventory/route.ts
    inventory/[id]/route.ts
    inventory/[id]/adjust/route.ts
    inventory/movements/route.ts
    inventory/low-stock/route.ts
    production/route.ts
    production/[id]/route.ts
    sales/route.ts
    sales/[id]/route.ts
    sales/[id]/status/route.ts
    sales/summary/route.ts
    orders/route.ts
    orders/[id]/route.ts
    orders/[id]/status/route.ts
    orders/kanban/route.ts
    expenses/route.ts
    expenses/[id]/route.ts
    expenses/[id]/receipt/route.ts
    expenses/summary/route.ts
    payroll/route.ts
    payroll/[id]/route.ts
    payroll/[id]/mark-paid/route.ts
    payroll/[id]/pdf/route.ts
    payroll/[id]/send-email/route.ts
    catalog/route.ts
    catalog/[id]/route.ts
    catalog/[id]/image/route.ts
    catalog/bulk-price/route.ts
    settings/route.ts
    settings/users/route.ts
    settings/users/[id]/route.ts
    reports/daily/route.ts
    reports/inventory/route.ts
    reports/sales/route.ts
    reports/production/route.ts
    reports/orders/route.ts
    reports/export/pdf/route.ts
    reports/export/excel/route.ts
    notifications/route.ts
    notifications/[id]/read/route.ts
    notifications/read-all/route.ts
    cron/daily-report/route.ts
    cron/check-overdue-orders/route.ts
    cron/check-low-stock/route.ts
    cron/check-payroll-due/route.ts
  (auth)/register/page.tsx        ← MODIFICAR para redirigir

lib/
  api/response.ts
  email/resend.ts
  email/send.ts
  email/templates/user-welcome.tsx
  email/templates/order-ready.tsx
  email/templates/low-stock-alert.tsx
  email/templates/payslip-notification.tsx
  email/templates/monthly-report.tsx
  pdf/payslip.tsx
  pdf/sale-receipt.tsx
  pdf/inventory-report.tsx
  storage/upload.ts
  data/inventory.ts
  data/production.ts
  data/sales.ts
  data/orders.ts
  data/expenses.ts
  data/payroll.ts
  data/dashboard.ts
  validations/inventory.ts
  validations/production.ts
  validations/sales.ts
  validations/orders.ts
  validations/expenses.ts
  validations/payroll.ts
  validations/catalog.ts
  validations/settings.ts

supabase/migrations/
  004_missing_tables.sql
  005_rls_new_tables.sql
  006_triggers_business_logic.sql

types/index.ts                    ← ACTUALIZAR con todos los tipos nuevos
vercel.json                       ← CREAR/ACTUALIZAR con crons
```

---

*manufacturingOS · Prompt Backend Completo v1.0 · Sprint 2 · Abril 2026*