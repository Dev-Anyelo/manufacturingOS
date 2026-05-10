-- 017_fix_inventory_notification_trigger.sql
-- Fixes type mismatch in fn_check_low_stock trigger function.

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
