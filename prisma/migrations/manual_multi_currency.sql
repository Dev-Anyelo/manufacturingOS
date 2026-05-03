-- 💱 MIGRACIÓN ESTRUCTURAL Y DE DATOS - MANUFACTURING OS NI (CORREGIDA)
-- Esta migración añade soporte multi-moneda y localización nicaragüense.

-- 1. Crear Enum de Moneda
DO $$ BEGIN
    CREATE TYPE "currency" AS ENUM ('USD', 'NIO');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Tabla de Tasas de Cambio
CREATE TABLE IF NOT EXISTS "exchange_rates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "fromCurrency" "currency" NOT NULL,
    "toCurrency" "currency" NOT NULL,
    "rate" DECIMAL(12,6) NOT NULL,
    "valid_from" DATE NOT NULL,
    "valid_to" DATE,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exchange_rates_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "exchange_rates_fromCurrency_toCurrency_valid_from_key" ON "exchange_rates"("fromCurrency", "toCurrency", "valid_from");

-- 3. Actualizar System Settings (CORREGIDO: añadir columnas primero)
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "base_currency" "currency" NOT NULL DEFAULT 'USD';
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "display_currency" "currency" NOT NULL DEFAULT 'USD';
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "locale" TEXT NOT NULL DEFAULT 'es-NI';

-- Ahora actualizar tipos y valores
ALTER TABLE "system_settings" ALTER COLUMN "timezone" SET DEFAULT 'America/Managua';
ALTER TABLE "system_settings" ALTER COLUMN "locale" SET DEFAULT 'es-NI';

UPDATE "system_settings" SET 
    "timezone" = 'America/Managua', 
    "locale" = 'es-NI',
    "base_currency" = 'USD',
    "display_currency" = 'USD';

-- 4. Añadir columnas de moneda a todas las tablas
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "base_salary_currency" "currency" DEFAULT 'USD';
ALTER TABLE "inventory_items" ADD COLUMN IF NOT EXISTS "unit_price_currency" "currency" NOT NULL DEFAULT 'USD';
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "total_purchases_currency" "currency" NOT NULL DEFAULT 'USD';

ALTER TABLE "catalog_items" 
    ADD COLUMN IF NOT EXISTS "market_price_unit_currency" "currency" DEFAULT 'USD',
    ADD COLUMN IF NOT EXISTS "market_price_dozen_currency" "currency" DEFAULT 'USD',
    ADD COLUMN IF NOT EXISTS "our_price_unit_currency" "currency" DEFAULT 'USD',
    ADD COLUMN IF NOT EXISTS "our_price_dozen_currency" "currency" DEFAULT 'USD',
    ADD COLUMN IF NOT EXISTS "sale_price_currency" "currency" NOT NULL DEFAULT 'USD',
    ADD COLUMN IF NOT EXISTS "estimated_cost_currency" "currency" DEFAULT 'USD';

ALTER TABLE "sales" 
    ADD COLUMN IF NOT EXISTS "total_currency" "currency" NOT NULL DEFAULT 'USD',
    ADD COLUMN IF NOT EXISTS "discount_currency" "currency" NOT NULL DEFAULT 'USD',
    ADD COLUMN IF NOT EXISTS "amount_paid_currency" "currency" NOT NULL DEFAULT 'USD',
    ADD COLUMN IF NOT EXISTS "change_given_currency" "currency" NOT NULL DEFAULT 'USD';

ALTER TABLE "sale_items" 
    ADD COLUMN IF NOT EXISTS "unit_price_currency" "currency" NOT NULL DEFAULT 'USD',
    ADD COLUMN IF NOT EXISTS "discount_currency" "currency" NOT NULL DEFAULT 'USD';

ALTER TABLE "work_orders" 
    ADD COLUMN IF NOT EXISTS "advance_paid_currency" "currency" NOT NULL DEFAULT 'USD',
    ADD COLUMN IF NOT EXISTS "total_currency" "currency" NOT NULL DEFAULT 'USD';

ALTER TABLE "work_order_items" 
    ADD COLUMN IF NOT EXISTS "unit_price_currency" "currency" NOT NULL DEFAULT 'USD';

ALTER TABLE "expenses" 
    ADD COLUMN IF NOT EXISTS "unit_price_currency" "currency" DEFAULT 'USD',
    ADD COLUMN IF NOT EXISTS "total_currency" "currency" NOT NULL DEFAULT 'USD';

ALTER TABLE "payroll_payments" 
    ADD COLUMN IF NOT EXISTS "base_amount_currency" "currency" NOT NULL DEFAULT 'USD',
    ADD COLUMN IF NOT EXISTS "bonuses_currency" "currency" NOT NULL DEFAULT 'USD',
    ADD COLUMN IF NOT EXISTS "deductions_currency" "currency" NOT NULL DEFAULT 'USD';

-- 5. Migrar datos históricos (Marcar como USD)
UPDATE "employees" SET "base_salary_currency" = 'USD' WHERE "base_salary" IS NOT NULL;
UPDATE "inventory_items" SET "unit_price_currency" = 'USD';
UPDATE "customers" SET "total_purchases_currency" = 'USD';
UPDATE "catalog_items" SET 
    "market_price_unit_currency" = 'USD', 
    "market_price_dozen_currency" = 'USD', 
    "our_price_unit_currency" = 'USD', 
    "our_price_dozen_currency" = 'USD', 
    "sale_price_currency" = 'USD', 
    "estimated_cost_currency" = 'USD';
UPDATE "sales" SET 
    "total_currency" = 'USD', 
    "discount_currency" = 'USD', 
    "amount_paid_currency" = 'USD', 
    "change_given_currency" = 'USD';
UPDATE "sale_items" SET "unit_price_currency" = 'USD', "discount_currency" = 'USD';
UPDATE "work_orders" SET "advance_paid_currency" = 'USD', "total_currency" = 'USD';
UPDATE "work_order_items" SET "unit_price_currency" = 'USD';
UPDATE "expenses" SET "unit_price_currency" = 'USD', "total_currency" = 'USD';
UPDATE "payroll_payments" SET "base_amount_currency" = 'USD', "bonuses_currency" = 'USD', "deductions_currency" = 'USD';
