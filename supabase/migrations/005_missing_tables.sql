-- 005_missing_tables.sql
-- Creates Sprint 2 missing backend tables and extends catalog/settings metadata.

CREATE TABLE IF NOT EXISTS public.production_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE RESTRICT,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_garments INT NOT NULL DEFAULT 0,
  total_yards_used NUMERIC(12,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.production_session_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.production_sessions(id) ON DELETE CASCADE,
  inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE RESTRICT,
  garment_type TEXT NOT NULL CHECK (garment_type IN ('shirt','skirt','shorts','leggings','pajamas','suit','sheets','blankets','other')),
  size TEXT NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  yards_used NUMERIC(12,2) NOT NULL CHECK (yards_used > 0),
  notes TEXT
);

CREATE TABLE IF NOT EXISTS public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
  channel TEXT NOT NULL CHECK (channel IN ('in_person','order','whatsapp','marketplace','other')),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash','transfer','credit','mixed')),
  total NUMERIC(12,2) NOT NULL CHECK (total >= 0),
  discount NUMERIC(12,2) NOT NULL DEFAULT 0,
  amount_paid NUMERIC(12,2) NOT NULL DEFAULT 0,
  change_given NUMERIC(12,2) NOT NULL DEFAULT 0,
  balance_due NUMERIC(12,2) GENERATED ALWAYS AS (total - discount - amount_paid) STORED,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('paid','partial','pending','cancelled')),
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  catalog_item_id UUID REFERENCES public.catalog_items(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  size TEXT,
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
  discount NUMERIC(12,2) NOT NULL DEFAULT 0,
  subtotal NUMERIC(12,2) GENERATED ALWAYS AS ((unit_price * quantity) - discount) STORED
);

CREATE TABLE IF NOT EXISTS public.work_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  received_date DATE NOT NULL DEFAULT CURRENT_DATE,
  delivery_date DATE NOT NULL CHECK (delivery_date > received_date),
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received','confirmed','in_production','ready','delivered','cancelled')),
  channel TEXT NOT NULL DEFAULT 'in_person' CHECK (channel IN ('in_person','referral','social_media','returning_customer','other')),
  advance_paid NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  balance_due NUMERIC(12,2) GENERATED ALWAYS AS (total - advance_paid) STORED,
  reserved_materials JSONB,
  reference_images TEXT[],
  notes TEXT,
  cancelled_reason TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.work_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
  catalog_item_id UUID REFERENCES public.catalog_items(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  size TEXT,
  measurements JSONB,
  inventory_item_id UUID REFERENCES public.inventory_items(id) ON DELETE SET NULL,
  color TEXT,
  design_notes TEXT,
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
  subtotal NUMERIC(12,2) GENERATED ALWAYS AS (unit_price * quantity) STORED
);

CREATE TABLE IF NOT EXISTS public.payroll_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE RESTRICT,
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
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  category TEXT NOT NULL CHECK (category IN ('fabrics','supplies','tools','machinery','outsourced_labor','services','packaging','office','payroll','other')),
  concept TEXT NOT NULL,
  supplier TEXT,
  quantity NUMERIC(12,2),
  unit_price NUMERIC(12,2),
  total NUMERIC(12,2) NOT NULL CHECK (total >= 0),
  updates_inventory BOOLEAN NOT NULL DEFAULT FALSE,
  inventory_item_id UUID REFERENCES public.inventory_items(id) ON DELETE SET NULL,
  inventory_quantity_added NUMERIC(12,2),
  receipt_url TEXT,
  notes TEXT,
  payroll_payment_id UUID,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'expenses_payroll_payment_fk'
  ) THEN
    ALTER TABLE public.expenses
      ADD CONSTRAINT expenses_payroll_payment_fk
      FOREIGN KEY (payroll_payment_id) REFERENCES public.payroll_payments(id) ON DELETE SET NULL;
  END IF;
END;
$$;

ALTER TABLE public.catalog_items
  ADD COLUMN IF NOT EXISTS garment_type TEXT,
  ADD COLUMN IF NOT EXISTS market_price_unit NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS market_price_dozen NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS our_price_unit NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS our_price_dozen NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE public.system_settings
  ADD COLUMN IF NOT EXISTS payroll_day INTEGER DEFAULT 30;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'system_settings_payroll_day_check'
  ) THEN
    ALTER TABLE public.system_settings
      ADD CONSTRAINT system_settings_payroll_day_check CHECK (payroll_day BETWEEN 1 AND 31);
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_production_sessions_employee_date ON public.production_sessions(employee_id, session_date DESC);
CREATE INDEX IF NOT EXISTS idx_production_session_items_session_id ON public.production_session_items(session_id);
CREATE INDEX IF NOT EXISTS idx_sales_date_status ON public.sales(sale_date DESC, status);
CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON public.sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON public.sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_status_delivery ON public.work_orders(status, delivery_date);
CREATE INDEX IF NOT EXISTS idx_work_orders_customer_id ON public.work_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_work_order_items_work_order_id ON public.work_order_items(work_order_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date_category ON public.expenses(expense_date DESC, category);
CREATE INDEX IF NOT EXISTS idx_payroll_employee_period ON public.payroll_payments(employee_id, period_start, period_end);
