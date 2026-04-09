-- 001_initial_schema.sql
-- Base schema for manufacturingOS (Sprint 1)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('admin', 'manager', 'employee', 'readonly');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contract_type') THEN
    CREATE TYPE contract_type AS ENUM ('fixed_salary', 'per_piece', 'hourly');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'material_category') THEN
    CREATE TYPE material_category AS ENUM ('fabric', 'supplies', 'tools', 'machinery');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'inventory_movement_type') THEN
    CREATE TYPE inventory_movement_type AS ENUM ('in', 'out', 'adjustment');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'audit_action') THEN
    CREATE TYPE audit_action AS ENUM ('insert', 'update', 'delete');
  END IF;
END
$$;

-- Profiles table extends auth.users with app metadata and RBAC role.
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'employee',
  phone TEXT,
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.profiles IS 'Application profile linked 1:1 with auth.users';

-- Employees stores payroll and labor contract information.
CREATE TABLE IF NOT EXISTS public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  document_id TEXT,
  phone TEXT,
  email TEXT,
  hire_date DATE NOT NULL,
  contract_type contract_type NOT NULL,
  base_salary NUMERIC(12, 2),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  profile_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT employees_base_salary_check CHECK (base_salary IS NULL OR base_salary >= 0)
);

COMMENT ON TABLE public.employees IS 'Employee records for payroll and production assignment';

-- Inventory items stores all materials and supplies tracked in stock.
CREATE TABLE IF NOT EXISTS public.inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category material_category NOT NULL,
  fabric_type TEXT,
  color TEXT,
  quantity NUMERIC(12, 2) NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'yd',
  unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  minimum_stock NUMERIC(12, 2) NOT NULL DEFAULT 0,
  supplier TEXT,
  notes TEXT,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT inventory_items_quantity_check CHECK (quantity >= 0),
  CONSTRAINT inventory_items_price_check CHECK (unit_price >= 0),
  CONSTRAINT inventory_items_minimum_stock_check CHECK (minimum_stock >= 0)
);

COMMENT ON TABLE public.inventory_items IS 'Master list of stockable materials with thresholds and pricing';

-- Inventory movements is an immutable audit trail for stock changes.
CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE RESTRICT,
  movement_type inventory_movement_type NOT NULL,
  quantity NUMERIC(12, 2) NOT NULL,
  previous_quantity NUMERIC(12, 2) NOT NULL,
  new_quantity NUMERIC(12, 2) NOT NULL,
  reason TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT inventory_movements_non_zero_quantity CHECK (quantity <> 0)
);

COMMENT ON TABLE public.inventory_movements IS 'Immutable log for every inventory adjustment and stock deduction';

-- Customers stores contacts and purchasing history for sales and orders.
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  notes TEXT,
  total_purchases NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT customers_total_purchases_check CHECK (total_purchases >= 0)
);

COMMENT ON TABLE public.customers IS 'Customer base and aggregated purchase metrics';

-- Catalog items stores garment SKUs and pricing for quote/sales workflows.
CREATE TABLE IF NOT EXISTS public.catalog_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  sale_price NUMERIC(12, 2) NOT NULL,
  estimated_cost NUMERIC(12, 2),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT catalog_items_sale_price_check CHECK (sale_price >= 0),
  CONSTRAINT catalog_items_estimated_cost_check CHECK (estimated_cost IS NULL OR estimated_cost >= 0)
);

COMMENT ON TABLE public.catalog_items IS 'Catalog of garments/services with sale price and estimated cost';

-- Notifications stores user-scoped operational and system alerts.
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (
    type IN (
      'low_stock',
      'out_of_stock',
      'order_ready',
      'order_overdue',
      'sale_completed',
      'production_saved',
      'payment_due',
      'monthly_report',
      'inventory_updated'
    )
  ),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  metadata JSONB,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

COMMENT ON TABLE public.notifications IS 'Per-user notifications consumed in realtime and notification center';

-- System settings stores global business configuration values.
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  low_stock_threshold INTEGER NOT NULL DEFAULT 10,
  currency TEXT NOT NULL DEFAULT 'USD',
  timezone TEXT NOT NULL DEFAULT 'America/Panama',
  company_name TEXT NOT NULL DEFAULT 'manufacturingOS',
  company_phone TEXT,
  company_email TEXT,
  company_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT system_settings_low_stock_threshold_check CHECK (low_stock_threshold >= 0)
);

COMMENT ON TABLE public.system_settings IS 'Global settings used across inventory, notifications, and reporting';

-- Audit log stores immutable domain-level mutations for compliance.
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID,
  action audit_action NOT NULL,
  old_values JSONB,
  new_values JSONB,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.audit_log IS 'Immutable audit history of CRUD operations on critical entities';

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_employees_profile_id ON public.employees(profile_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON public.inventory_items(category);
CREATE INDEX IF NOT EXISTS idx_inventory_items_low_stock ON public.inventory_items(minimum_stock, quantity);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_item_id ON public.inventory_movements(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_created_at ON public.inventory_movements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customers_full_name ON public.customers(full_name);
CREATE INDEX IF NOT EXISTS idx_catalog_items_name ON public.catalog_items(name);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_read ON public.notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_table_record ON public.audit_log(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.audit_log(created_at DESC);
