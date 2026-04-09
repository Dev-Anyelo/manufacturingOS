-- 006_rls_new_tables.sql
-- RLS policies for Sprint 2 modules.

ALTER TABLE public.production_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_session_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS production_sessions_select_policy ON public.production_sessions;
CREATE POLICY production_sessions_select_policy ON public.production_sessions
FOR SELECT TO authenticated
USING (TRUE);

DROP POLICY IF EXISTS production_sessions_insert_policy ON public.production_sessions;
CREATE POLICY production_sessions_insert_policy ON public.production_sessions
FOR INSERT TO authenticated
WITH CHECK (public.get_user_role() IN ('employee', 'manager', 'admin'));

DROP POLICY IF EXISTS production_sessions_update_policy ON public.production_sessions;
CREATE POLICY production_sessions_update_policy ON public.production_sessions
FOR UPDATE TO authenticated
USING (created_by = auth.uid() OR public.get_user_role() = 'admin')
WITH CHECK (created_by = auth.uid() OR public.get_user_role() = 'admin');

DROP POLICY IF EXISTS production_sessions_delete_policy ON public.production_sessions;
CREATE POLICY production_sessions_delete_policy ON public.production_sessions
FOR DELETE TO authenticated
USING (created_by = auth.uid() OR public.get_user_role() = 'admin');

DROP POLICY IF EXISTS production_session_items_select_policy ON public.production_session_items;
CREATE POLICY production_session_items_select_policy ON public.production_session_items
FOR SELECT TO authenticated
USING (TRUE);

DROP POLICY IF EXISTS production_session_items_insert_policy ON public.production_session_items;
CREATE POLICY production_session_items_insert_policy ON public.production_session_items
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.production_sessions ps
    WHERE ps.id = session_id
      AND (
        ps.created_by = auth.uid()
        OR public.get_user_role() IN ('manager', 'admin')
      )
  )
);

DROP POLICY IF EXISTS production_session_items_update_policy ON public.production_session_items;
CREATE POLICY production_session_items_update_policy ON public.production_session_items
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.production_sessions ps
    WHERE ps.id = session_id
      AND (
        ps.created_by = auth.uid()
        OR public.get_user_role() = 'admin'
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.production_sessions ps
    WHERE ps.id = session_id
      AND (
        ps.created_by = auth.uid()
        OR public.get_user_role() = 'admin'
      )
  )
);

DROP POLICY IF EXISTS production_session_items_delete_policy ON public.production_session_items;
CREATE POLICY production_session_items_delete_policy ON public.production_session_items
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.production_sessions ps
    WHERE ps.id = session_id
      AND (
        ps.created_by = auth.uid()
        OR public.get_user_role() = 'admin'
      )
  )
);

DROP POLICY IF EXISTS sales_select_policy ON public.sales;
CREATE POLICY sales_select_policy ON public.sales
FOR SELECT TO authenticated
USING (
  public.get_user_role() IN ('admin', 'manager')
  OR (public.get_user_role() = 'employee' AND created_by = auth.uid())
);

DROP POLICY IF EXISTS sales_insert_policy ON public.sales;
CREATE POLICY sales_insert_policy ON public.sales
FOR INSERT TO authenticated
WITH CHECK (TRUE);

DROP POLICY IF EXISTS sales_update_policy ON public.sales;
CREATE POLICY sales_update_policy ON public.sales
FOR UPDATE TO authenticated
USING (public.get_user_role() = 'admin')
WITH CHECK (public.get_user_role() = 'admin');

DROP POLICY IF EXISTS sales_delete_policy ON public.sales;
CREATE POLICY sales_delete_policy ON public.sales
FOR DELETE TO authenticated
USING (public.get_user_role() = 'admin');

DROP POLICY IF EXISTS sale_items_select_policy ON public.sale_items;
CREATE POLICY sale_items_select_policy ON public.sale_items
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.sales s
    WHERE s.id = sale_id
      AND (
        public.get_user_role() IN ('admin', 'manager')
        OR (public.get_user_role() = 'employee' AND s.created_by = auth.uid())
      )
  )
);

DROP POLICY IF EXISTS sale_items_insert_policy ON public.sale_items;
CREATE POLICY sale_items_insert_policy ON public.sale_items
FOR INSERT TO authenticated
WITH CHECK (TRUE);

DROP POLICY IF EXISTS sale_items_update_policy ON public.sale_items;
CREATE POLICY sale_items_update_policy ON public.sale_items
FOR UPDATE TO authenticated
USING (public.get_user_role() = 'admin')
WITH CHECK (public.get_user_role() = 'admin');

DROP POLICY IF EXISTS sale_items_delete_policy ON public.sale_items;
CREATE POLICY sale_items_delete_policy ON public.sale_items
FOR DELETE TO authenticated
USING (public.get_user_role() = 'admin');

DROP POLICY IF EXISTS work_orders_select_policy ON public.work_orders;
CREATE POLICY work_orders_select_policy ON public.work_orders
FOR SELECT TO authenticated
USING (TRUE);

DROP POLICY IF EXISTS work_orders_insert_policy ON public.work_orders;
CREATE POLICY work_orders_insert_policy ON public.work_orders
FOR INSERT TO authenticated
WITH CHECK (public.get_user_role() IN ('admin', 'manager'));

DROP POLICY IF EXISTS work_orders_update_policy ON public.work_orders;
CREATE POLICY work_orders_update_policy ON public.work_orders
FOR UPDATE TO authenticated
USING (public.get_user_role() IN ('admin', 'manager'))
WITH CHECK (public.get_user_role() IN ('admin', 'manager'));

DROP POLICY IF EXISTS work_orders_delete_policy ON public.work_orders;
CREATE POLICY work_orders_delete_policy ON public.work_orders
FOR DELETE TO authenticated
USING (public.get_user_role() = 'admin');

DROP POLICY IF EXISTS work_order_items_select_policy ON public.work_order_items;
CREATE POLICY work_order_items_select_policy ON public.work_order_items
FOR SELECT TO authenticated
USING (TRUE);

DROP POLICY IF EXISTS work_order_items_insert_policy ON public.work_order_items;
CREATE POLICY work_order_items_insert_policy ON public.work_order_items
FOR INSERT TO authenticated
WITH CHECK (public.get_user_role() IN ('admin', 'manager'));

DROP POLICY IF EXISTS work_order_items_update_policy ON public.work_order_items;
CREATE POLICY work_order_items_update_policy ON public.work_order_items
FOR UPDATE TO authenticated
USING (public.get_user_role() IN ('admin', 'manager'))
WITH CHECK (public.get_user_role() IN ('admin', 'manager'));

DROP POLICY IF EXISTS work_order_items_delete_policy ON public.work_order_items;
CREATE POLICY work_order_items_delete_policy ON public.work_order_items
FOR DELETE TO authenticated
USING (public.get_user_role() = 'admin');

DROP POLICY IF EXISTS expenses_select_policy ON public.expenses;
CREATE POLICY expenses_select_policy ON public.expenses
FOR SELECT TO authenticated
USING (public.get_user_role() IN ('admin', 'manager'));

DROP POLICY IF EXISTS expenses_insert_policy ON public.expenses;
CREATE POLICY expenses_insert_policy ON public.expenses
FOR INSERT TO authenticated
WITH CHECK (public.get_user_role() IN ('admin', 'manager'));

DROP POLICY IF EXISTS expenses_update_policy ON public.expenses;
CREATE POLICY expenses_update_policy ON public.expenses
FOR UPDATE TO authenticated
USING (public.get_user_role() = 'admin')
WITH CHECK (public.get_user_role() = 'admin');

DROP POLICY IF EXISTS expenses_delete_policy ON public.expenses;
CREATE POLICY expenses_delete_policy ON public.expenses
FOR DELETE TO authenticated
USING (public.get_user_role() = 'admin');

DROP POLICY IF EXISTS payroll_payments_select_policy ON public.payroll_payments;
CREATE POLICY payroll_payments_select_policy ON public.payroll_payments
FOR SELECT TO authenticated
USING (public.get_user_role() = 'admin');

DROP POLICY IF EXISTS payroll_payments_insert_policy ON public.payroll_payments;
CREATE POLICY payroll_payments_insert_policy ON public.payroll_payments
FOR INSERT TO authenticated
WITH CHECK (public.get_user_role() = 'admin');

DROP POLICY IF EXISTS payroll_payments_update_policy ON public.payroll_payments;
CREATE POLICY payroll_payments_update_policy ON public.payroll_payments
FOR UPDATE TO authenticated
USING (public.get_user_role() = 'admin')
WITH CHECK (public.get_user_role() = 'admin');

DROP POLICY IF EXISTS payroll_payments_delete_policy ON public.payroll_payments;
CREATE POLICY payroll_payments_delete_policy ON public.payroll_payments
FOR DELETE TO authenticated
USING (public.get_user_role() = 'admin');
