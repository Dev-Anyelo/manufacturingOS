-- 013_fix_work_order_status_type.sql
-- Forcibly ensures that work_orders.status is of type work_order_status.
-- This fixes the 'column status is of type sale_status' error.

DO $$
BEGIN
  -- 1. Ensure the work_order_status type exists (it should, but just in case)
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

  -- 2. Check if the column exists and has the wrong type
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'work_orders'
      AND column_name = 'status'
      AND (udt_name = 'sale_status' OR udt_name = 'text')
  ) THEN
    -- Temporarily drop default
    ALTER TABLE public.work_orders ALTER COLUMN status DROP DEFAULT;
    
    -- Cast the column to the correct type
    -- We use text as an intermediate to allow casting between different enum types
    ALTER TABLE public.work_orders 
      ALTER COLUMN status TYPE work_order_status 
      USING status::text::work_order_status;
      
    -- Restore default
    ALTER TABLE public.work_orders ALTER COLUMN status SET DEFAULT 'received'::work_order_status;
  END IF;
END;
$$;
