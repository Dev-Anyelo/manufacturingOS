-- 008_align_enums_with_prisma.sql
-- Aligns PostgreSQL enum types with Prisma enums used by app/api routes.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
    CREATE TYPE notification_type AS ENUM (
      'low_stock',
      'out_of_stock',
      'order_ready',
      'order_overdue',
      'sale_completed',
      'production_saved',
      'payment_due',
      'monthly_report',
      'inventory_updated'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'garment_type') THEN
    CREATE TYPE garment_type AS ENUM (
      'shirt',
      'skirt',
      'shorts',
      'leggings',
      'pajamas',
      'suit',
      'sheets',
      'blankets',
      'other'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method') THEN
    CREATE TYPE payment_method AS ENUM ('cash', 'transfer', 'credit', 'mixed');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sale_channel') THEN
    CREATE TYPE sale_channel AS ENUM ('in_person', 'order', 'whatsapp', 'marketplace', 'other');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sale_status') THEN
    CREATE TYPE sale_status AS ENUM ('paid', 'partial', 'pending', 'cancelled');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'work_order_status') THEN
    CREATE TYPE work_order_status AS ENUM (
      'received',
      'confirmed',
      'in_production',
      'ready',
      'delivered',
      'cancelled'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'work_order_channel') THEN
    CREATE TYPE work_order_channel AS ENUM (
      'in_person',
      'referral',
      'social_media',
      'returning_customer',
      'other'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'expense_category') THEN
    CREATE TYPE expense_category AS ENUM (
      'fabrics',
      'supplies',
      'tools',
      'machinery',
      'outsourced_labor',
      'services',
      'packaging',
      'office',
      'payroll',
      'other'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payroll_status') THEN
    CREATE TYPE payroll_status AS ENUM ('pending', 'paid');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payroll_payment_method') THEN
    CREATE TYPE payroll_payment_method AS ENUM ('cash', 'transfer', 'other');
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'notifications'
      AND column_name = 'type'
      AND udt_name = 'text'
  ) THEN
    ALTER TABLE public.notifications
      DROP CONSTRAINT IF EXISTS notifications_type_check;

    ALTER TABLE public.notifications
      ALTER COLUMN type TYPE notification_type
      USING type::notification_type;
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'production_session_items'
      AND column_name = 'garment_type'
      AND udt_name = 'text'
  ) THEN
    ALTER TABLE public.production_session_items
      DROP CONSTRAINT IF EXISTS production_session_items_garment_type_check;

    ALTER TABLE public.production_session_items
      ALTER COLUMN garment_type TYPE garment_type
      USING garment_type::garment_type;
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'sales'
      AND column_name = 'channel'
      AND udt_name = 'text'
  ) THEN
    ALTER TABLE public.sales
      DROP CONSTRAINT IF EXISTS sales_channel_check;

    ALTER TABLE public.sales
      ALTER COLUMN channel TYPE sale_channel
      USING channel::sale_channel;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'sales'
      AND column_name = 'payment_method'
      AND udt_name = 'text'
  ) THEN
    ALTER TABLE public.sales
      DROP CONSTRAINT IF EXISTS sales_payment_method_check;

    ALTER TABLE public.sales
      ALTER COLUMN payment_method TYPE payment_method
      USING payment_method::payment_method;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'sales'
      AND column_name = 'status'
      AND udt_name = 'text'
  ) THEN
    ALTER TABLE public.sales
      ALTER COLUMN status DROP DEFAULT;

    ALTER TABLE public.sales
      DROP CONSTRAINT IF EXISTS sales_status_check;

    ALTER TABLE public.sales
      ALTER COLUMN status TYPE sale_status
      USING status::sale_status;
  END IF;

  ALTER TABLE public.sales
    ALTER COLUMN status SET DEFAULT 'pending'::sale_status;
END;
$$;

DO $$
DECLARE
  had_release_reserved_materials_trigger BOOLEAN := FALSE;
  had_create_sale_from_work_order_trigger BOOLEAN := FALSE;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'work_orders'
      AND t.tgname = 'trg_release_reserved_materials'
      AND NOT t.tgisinternal
  ) INTO had_release_reserved_materials_trigger;

  SELECT EXISTS (
    SELECT 1
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'work_orders'
      AND t.tgname = 'trg_create_sale_from_work_order'
      AND NOT t.tgisinternal
  ) INTO had_create_sale_from_work_order_trigger;

  IF had_release_reserved_materials_trigger THEN
    DROP TRIGGER trg_release_reserved_materials ON public.work_orders;
  END IF;

  IF had_create_sale_from_work_order_trigger THEN
    DROP TRIGGER trg_create_sale_from_work_order ON public.work_orders;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'work_orders'
      AND column_name = 'status'
      AND udt_name = 'text'
  ) THEN
    ALTER TABLE public.work_orders
      ALTER COLUMN status DROP DEFAULT;

    ALTER TABLE public.work_orders
      DROP CONSTRAINT IF EXISTS work_orders_status_check;

    ALTER TABLE public.work_orders
      ALTER COLUMN status TYPE work_order_status
      USING status::work_order_status;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'work_orders'
      AND column_name = 'channel'
      AND udt_name = 'text'
  ) THEN
    ALTER TABLE public.work_orders
      ALTER COLUMN channel DROP DEFAULT;

    ALTER TABLE public.work_orders
      DROP CONSTRAINT IF EXISTS work_orders_channel_check;

    ALTER TABLE public.work_orders
      ALTER COLUMN channel TYPE work_order_channel
      USING channel::work_order_channel;
  END IF;

  ALTER TABLE public.work_orders
    ALTER COLUMN status SET DEFAULT 'received'::work_order_status,
    ALTER COLUMN channel SET DEFAULT 'in_person'::work_order_channel;

  IF had_release_reserved_materials_trigger THEN
    CREATE TRIGGER trg_release_reserved_materials
    BEFORE UPDATE OF status ON public.work_orders
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_release_reserved_materials();
  END IF;

  IF had_create_sale_from_work_order_trigger THEN
    CREATE TRIGGER trg_create_sale_from_work_order
    AFTER UPDATE OF status ON public.work_orders
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_create_sale_from_work_order();
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'expenses'
      AND column_name = 'category'
      AND udt_name = 'text'
  ) THEN
    ALTER TABLE public.expenses
      DROP CONSTRAINT IF EXISTS expenses_category_check;

    ALTER TABLE public.expenses
      ALTER COLUMN category TYPE expense_category
      USING category::expense_category;
  END IF;
END;
$$;

DO $$
DECLARE
  had_create_payroll_expense_trigger BOOLEAN := FALSE;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'payroll_payments'
      AND t.tgname = 'trg_create_payroll_expense'
      AND NOT t.tgisinternal
  ) INTO had_create_payroll_expense_trigger;

  IF had_create_payroll_expense_trigger THEN
    DROP TRIGGER trg_create_payroll_expense ON public.payroll_payments;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'payroll_payments'
      AND column_name = 'status'
      AND udt_name = 'text'
  ) THEN
    ALTER TABLE public.payroll_payments
      ALTER COLUMN status DROP DEFAULT;

    ALTER TABLE public.payroll_payments
      DROP CONSTRAINT IF EXISTS payroll_payments_status_check;

    ALTER TABLE public.payroll_payments
      ALTER COLUMN status TYPE payroll_status
      USING status::payroll_status;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'payroll_payments'
      AND column_name = 'payment_method'
      AND udt_name = 'text'
  ) THEN
    ALTER TABLE public.payroll_payments
      DROP CONSTRAINT IF EXISTS payroll_payments_payment_method_check;

    ALTER TABLE public.payroll_payments
      ALTER COLUMN payment_method TYPE payroll_payment_method
      USING payment_method::payroll_payment_method;
  END IF;

  ALTER TABLE public.payroll_payments
    ALTER COLUMN status SET DEFAULT 'pending'::payroll_status;

  IF had_create_payroll_expense_trigger THEN
    CREATE TRIGGER trg_create_payroll_expense
    AFTER UPDATE OF status ON public.payroll_payments
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_create_payroll_expense();
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'work_orders'
      AND t.tgname = 'trg_release_reserved_materials'
      AND NOT t.tgisinternal
  ) THEN
    CREATE TRIGGER trg_release_reserved_materials
    BEFORE UPDATE OF status ON public.work_orders
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_release_reserved_materials();
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'work_orders'
      AND t.tgname = 'trg_create_sale_from_work_order'
      AND NOT t.tgisinternal
  ) THEN
    CREATE TRIGGER trg_create_sale_from_work_order
    AFTER UPDATE OF status ON public.work_orders
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_create_sale_from_work_order();
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'payroll_payments'
      AND t.tgname = 'trg_create_payroll_expense'
      AND NOT t.tgisinternal
  ) THEN
    CREATE TRIGGER trg_create_payroll_expense
    AFTER UPDATE OF status ON public.payroll_payments
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_create_payroll_expense();
  END IF;
END;
$$;
