-- 012_fix_bimonetary_generated_columns.sql
-- Altera las columnas generadas que no consideran la moneda para que sean columnas regulares.
-- Esto permite que el backend calcule los totales y saldos considerando la tasa de cambio.

-- 1. Sales (Ventas)
ALTER TABLE public.sales ALTER COLUMN balance_due DROP EXPRESSION;

-- 2. Sale Items (Detalle de Ventas)
ALTER TABLE public.sale_items ALTER COLUMN subtotal DROP EXPRESSION;

-- 3. Work Orders (Pedidos)
ALTER TABLE public.work_orders ALTER COLUMN balance_due DROP EXPRESSION;

-- 4. Work Order Items (Detalle de Pedidos)
ALTER TABLE public.work_order_items ALTER COLUMN subtotal DROP EXPRESSION;

-- 5. Payroll Payments (Pagos de Planilla)
ALTER TABLE public.payroll_payments ALTER COLUMN total DROP EXPRESSION;
