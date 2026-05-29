-- 003_triggers.sql
-- Business triggers for inventory, notifications, customer stats and updated_at.

CREATE OR REPLACE FUNCTION public.fn_update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_deduct_inventory()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.inventory_items
  SET quantity = GREATEST(0, quantity - COALESCE(NEW.yards_used, 0)),
      updated_at = NOW()
  WHERE id = NEW.inventory_item_id;

  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF to_regclass('public.production_session_items') IS NOT NULL THEN
    EXECUTE 'DROP TRIGGER IF EXISTS trg_deduct_on_production ON public.production_session_items';
    EXECUTE 'CREATE TRIGGER trg_deduct_on_production
      AFTER INSERT ON public.production_session_items
      FOR EACH ROW
      EXECUTE FUNCTION public.fn_deduct_inventory()';
  END IF;
END
$$;

CREATE OR REPLACE FUNCTION public.fn_check_low_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  notif_type public.notification_type;
BEGIN
  IF NEW.is_active IS NOT TRUE THEN
    RETURN NEW;
  END IF;

  IF NEW.quantity > NEW.minimum_stock THEN
    RETURN NEW;
  END IF;

  notif_type := CASE WHEN NEW.quantity = 0 THEN 'out_of_stock'::public.notification_type ELSE 'low_stock'::public.notification_type END;

  INSERT INTO public.notifications (user_id, type, title, body, metadata)
  SELECT
    p.id,
    notif_type,
    CASE WHEN notif_type = 'out_of_stock' THEN 'Material agotado' ELSE 'Stock critico' END,
    CASE WHEN notif_type = 'out_of_stock'
      THEN 'El material ' || NEW.name || ' se ha agotado.'
      ELSE 'El material ' || NEW.name || ' alcanzó el umbral minimo.'
    END,
    jsonb_build_object(
      'inventory_item_id', NEW.id,
      'name', NEW.name,
      'quantity', NEW.quantity,
      'minimum_stock', NEW.minimum_stock
    )
  FROM public.profiles p
  WHERE p.role IN ('admin', 'manager')
    AND p.is_active = TRUE;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_low_stock ON public.inventory_items;
CREATE TRIGGER trg_check_low_stock
AFTER INSERT OR UPDATE OF quantity, minimum_stock, is_active
ON public.inventory_items
FOR EACH ROW
EXECUTE FUNCTION public.fn_check_low_stock();

CREATE OR REPLACE FUNCTION public.fn_update_customer_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.customers
    SET total_purchases = COALESCE(total_purchases, 0) + COALESCE(NEW.total, 0),
        updated_at = NOW()
    WHERE id = NEW.customer_id;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE public.customers
    SET total_purchases = GREATEST(0, COALESCE(total_purchases, 0) - COALESCE(OLD.total, 0) + COALESCE(NEW.total, 0)),
        updated_at = NOW()
    WHERE id = NEW.customer_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.customers
    SET total_purchases = GREATEST(0, COALESCE(total_purchases, 0) - COALESCE(OLD.total, 0)),
        updated_at = NOW()
    WHERE id = OLD.customer_id;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;

DO $$
BEGIN
  IF to_regclass('public.sales') IS NOT NULL THEN
    EXECUTE 'DROP TRIGGER IF EXISTS trg_update_customer_stats ON public.sales';
    -- Trigger intentionally disabled; customer total purchases are maintained in application logic.
    -- EXECUTE 'CREATE TRIGGER trg_update_customer_stats
    --   AFTER INSERT OR UPDATE OR DELETE ON public.sales
    --   FOR EACH ROW
    --   EXECUTE FUNCTION public.fn_update_customer_stats()';
  END IF;
END
$$;

DO $$
DECLARE
  target_table TEXT;
BEGIN
  FOREACH target_table IN ARRAY ARRAY[
    'profiles',
    'employees',
    'inventory_items',
    'customers',
    'catalog_items',
    'system_settings'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%s_set_updated_at ON public.%I', target_table, target_table);
    EXECUTE format(
      'CREATE TRIGGER trg_%s_set_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.fn_update_updated_at()',
      target_table,
      target_table
    );
  END LOOP;
END
$$;
