-- 009_add_notification_types.sql
-- Adds new notification enum values used by the app notification service.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'notification_type'
      AND e.enumlabel = 'expense_recorded'
  ) THEN
    ALTER TYPE public.notification_type ADD VALUE 'expense_recorded';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'notification_type'
      AND e.enumlabel = 'order_cancelled'
  ) THEN
    ALTER TYPE public.notification_type ADD VALUE 'order_cancelled';
  END IF;
END;
$$;