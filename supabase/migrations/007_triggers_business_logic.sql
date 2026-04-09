-- 007_triggers_business_logic.sql
-- Business triggers for production, payroll, orders and sales synchronization.

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

DROP TRIGGER IF EXISTS trg_deduct_on_production ON public.production_session_items;
CREATE TRIGGER trg_deduct_on_production
AFTER INSERT ON public.production_session_items
FOR EACH ROW
EXECUTE FUNCTION public.fn_deduct_inventory();

CREATE OR REPLACE FUNCTION public.fn_update_session_totals()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  target_session_id UUID;
BEGIN
  target_session_id := COALESCE(NEW.session_id, OLD.session_id);

  UPDATE public.production_sessions
  SET
    total_garments = (
      SELECT COALESCE(SUM(quantity), 0)
      FROM public.production_session_items
      WHERE session_id = target_session_id
    ),
    total_yards_used = (
      SELECT COALESCE(SUM(yards_used), 0)
      FROM public.production_session_items
      WHERE session_id = target_session_id
    )
  WHERE id = target_session_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_update_session_totals ON public.production_session_items;
CREATE TRIGGER trg_update_session_totals
AFTER INSERT OR UPDATE OR DELETE ON public.production_session_items
FOR EACH ROW
EXECUTE FUNCTION public.fn_update_session_totals();

CREATE OR REPLACE FUNCTION public.fn_update_customer_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  customer_ref UUID;
BEGIN
  customer_ref := COALESCE(NEW.customer_id, OLD.customer_id);

  IF customer_ref IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  UPDATE public.customers
  SET
    total_purchases = (
      SELECT COALESCE(SUM(total - discount), 0)
      FROM public.sales
      WHERE customer_id = customer_ref
        AND status != 'cancelled'
    ),
    updated_at = NOW()
  WHERE id = customer_ref;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_update_customer_stats ON public.sales;
CREATE TRIGGER trg_update_customer_stats
AFTER INSERT OR UPDATE OR DELETE ON public.sales
FOR EACH ROW
EXECUTE FUNCTION public.fn_update_customer_stats();

CREATE OR REPLACE FUNCTION public.fn_create_payroll_expense()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'paid' AND OLD.status = 'pending' THEN
    INSERT INTO public.expenses (
      expense_date,
      category,
      concept,
      total,
      created_by,
      payroll_payment_id
    )
    VALUES (
      COALESCE(NEW.payment_date, CURRENT_DATE),
      'payroll',
      COALESCE(
        (SELECT 'Pago de planilla: ' || full_name FROM public.employees WHERE id = NEW.employee_id),
        'Pago de planilla'
      ),
      NEW.total,
      NEW.created_by,
      NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_create_payroll_expense ON public.payroll_payments;
CREATE TRIGGER trg_create_payroll_expense
AFTER UPDATE OF status ON public.payroll_payments
FOR EACH ROW
EXECUTE FUNCTION public.fn_create_payroll_expense();

CREATE OR REPLACE FUNCTION public.fn_release_reserved_materials()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  material JSONB;
  item_id UUID;
  qty NUMERIC(12,2);
  prev_qty NUMERIC(12,2);
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    FOR material IN
      SELECT value FROM jsonb_array_elements(COALESCE(OLD.reserved_materials, '[]'::jsonb))
    LOOP
      item_id := NULLIF(material->>'inventory_item_id', '')::UUID;
      qty := COALESCE(NULLIF(material->>'quantity', '')::NUMERIC, 0);

      IF item_id IS NULL OR qty <= 0 THEN
        CONTINUE;
      END IF;

      SELECT quantity INTO prev_qty
      FROM public.inventory_items
      WHERE id = item_id
      FOR UPDATE;

      IF prev_qty IS NULL THEN
        CONTINUE;
      END IF;

      UPDATE public.inventory_items
      SET quantity = prev_qty + qty,
          updated_at = NOW()
      WHERE id = item_id;

      INSERT INTO public.inventory_movements (
        inventory_item_id,
        movement_type,
        quantity,
        previous_quantity,
        new_quantity,
        reason,
        created_by
      )
      VALUES (
        item_id,
        'adjustment',
        qty,
        prev_qty,
        prev_qty + qty,
        'Liberacion por cancelacion de pedido #' || NEW.id,
        NEW.created_by
      );
    END LOOP;

    NEW.reserved_materials = NULL;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_release_reserved_materials ON public.work_orders;
CREATE TRIGGER trg_release_reserved_materials
BEFORE UPDATE OF status ON public.work_orders
FOR EACH ROW
EXECUTE FUNCTION public.fn_release_reserved_materials();

CREATE OR REPLACE FUNCTION public.fn_create_sale_from_work_order()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  created_sale_id UUID;
BEGIN
  IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
    INSERT INTO public.sales (
      customer_id,
      sale_date,
      channel,
      payment_method,
      total,
      amount_paid,
      status,
      notes,
      created_by
    )
    VALUES (
      NEW.customer_id,
      CURRENT_DATE,
      'order',
      'mixed',
      NEW.total,
      NEW.advance_paid,
      CASE WHEN NEW.advance_paid >= NEW.total THEN 'paid' ELSE 'partial' END,
      'Generado automaticamente desde pedido #' || NEW.id,
      NEW.created_by
    )
    RETURNING id INTO created_sale_id;

    INSERT INTO public.sale_items (sale_id, catalog_item_id, description, size, quantity, unit_price, discount)
    SELECT
      created_sale_id,
      woi.catalog_item_id,
      woi.description,
      woi.size,
      woi.quantity,
      woi.unit_price,
      0
    FROM public.work_order_items woi
    WHERE woi.work_order_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_create_sale_from_work_order ON public.work_orders;
CREATE TRIGGER trg_create_sale_from_work_order
AFTER UPDATE OF status ON public.work_orders
FOR EACH ROW
EXECUTE FUNCTION public.fn_create_sale_from_work_order();

CREATE OR REPLACE FUNCTION public.fn_set_updated_at_generic()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_work_orders_updated_at ON public.work_orders;
CREATE TRIGGER trg_work_orders_updated_at
BEFORE UPDATE ON public.work_orders
FOR EACH ROW
EXECUTE FUNCTION public.fn_set_updated_at_generic();

DROP TRIGGER IF EXISTS trg_payroll_payments_updated_at ON public.payroll_payments;
CREATE TRIGGER trg_payroll_payments_updated_at
BEFORE UPDATE ON public.payroll_payments
FOR EACH ROW
EXECUTE FUNCTION public.fn_set_updated_at_generic();
