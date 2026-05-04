-- 011_fix_trigger_type_casts.sql
-- Fixes type casting in business logic triggers to match PostgreSQL ENUM types.

-- 1. Fix fn_create_sale_from_work_order
CREATE OR REPLACE FUNCTION public.fn_create_sale_from_work_order()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  created_sale_id UUID;
BEGIN
  -- Solo crear venta cuando el pedido pasa a entregado (delivered)
  IF NEW.status = 'delivered'::work_order_status AND OLD.status != 'delivered'::work_order_status THEN
    INSERT INTO public.sales (
      customer_id,
      sale_date,
      channel,
      payment_method,
      total,
      amount_paid,
      status,
      notes,
      created_by,
      total_currency,
      amount_paid_currency
    )
    VALUES (
      NEW.customer_id,
      CURRENT_DATE,
      'order'::sale_channel,
      'mixed'::payment_method,
      NEW.total,
      NEW.advance_paid,
      (CASE WHEN NEW.advance_paid >= NEW.total THEN 'paid' ELSE 'partial' END)::sale_status,
      'Generado automáticamente desde pedido #' || NEW.id,
      NEW.created_by,
      NEW.total_currency,
      NEW.advance_paid_currency
    )
    RETURNING id INTO created_sale_id;

    -- Copiar items del pedido a la venta
    INSERT INTO public.sale_items (
      sale_id, 
      catalog_item_id, 
      description, 
      size, 
      quantity, 
      unit_price, 
      discount,
      unit_price_currency
    )
    SELECT
      created_sale_id,
      woi.catalog_item_id,
      woi.description,
      woi.size,
      woi.quantity,
      woi.unit_price,
      0,
      woi.unit_price_currency
    FROM public.work_order_items woi
    WHERE woi.work_order_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

-- 2. Fix fn_create_payroll_expense
CREATE OR REPLACE FUNCTION public.fn_create_payroll_expense()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Cuando el pago de planilla pasa a 'paid', generar un gasto automático
  IF NEW.status = 'paid'::payroll_status AND OLD.status = 'pending'::payroll_status THEN
    INSERT INTO public.expenses (
      expense_date,
      category,
      concept,
      total,
      total_currency,
      created_by,
      payroll_payment_id
    )
    VALUES (
      COALESCE(NEW.payment_date, CURRENT_DATE),
      'payroll'::expense_category,
      COALESCE(
        (SELECT 'Pago de planilla: ' || full_name FROM public.employees WHERE id = NEW.employee_id),
        'Pago de planilla'
      ),
      NEW.total,
      NEW.base_amount_currency, -- Asumimos moneda base del pago
      NEW.created_by,
      NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$;
