-- 002_rls_policies.sql
-- Row Level Security policies for Sprint 1 core tables.

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text
  FROM public.profiles
  WHERE id = auth.uid()
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_user_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profiles_select_policy ON public.profiles;
CREATE POLICY profiles_select_policy ON public.profiles
FOR SELECT TO authenticated
USING (id = auth.uid() OR public.get_user_role() IN ('admin', 'manager'));

DROP POLICY IF EXISTS profiles_update_policy ON public.profiles;
CREATE POLICY profiles_update_policy ON public.profiles
FOR UPDATE TO authenticated
USING (id = auth.uid() OR public.get_user_role() = 'admin')
WITH CHECK (id = auth.uid() OR public.get_user_role() = 'admin');

DROP POLICY IF EXISTS employees_select_policy ON public.employees;
CREATE POLICY employees_select_policy ON public.employees
FOR SELECT TO authenticated
USING (public.get_user_role() IN ('admin', 'manager', 'employee', 'readonly'));

DROP POLICY IF EXISTS employees_manage_policy ON public.employees;
CREATE POLICY employees_manage_policy ON public.employees
FOR ALL TO authenticated
USING (public.get_user_role() IN ('admin', 'manager'))
WITH CHECK (public.get_user_role() IN ('admin', 'manager'));

DROP POLICY IF EXISTS inventory_items_select_policy ON public.inventory_items;
CREATE POLICY inventory_items_select_policy ON public.inventory_items
FOR SELECT TO authenticated
USING (public.get_user_role() IN ('admin', 'manager', 'employee', 'readonly'));

DROP POLICY IF EXISTS inventory_items_manage_policy ON public.inventory_items;
CREATE POLICY inventory_items_manage_policy ON public.inventory_items
FOR ALL TO authenticated
USING (public.get_user_role() IN ('admin', 'manager'))
WITH CHECK (public.get_user_role() IN ('admin', 'manager'));

DROP POLICY IF EXISTS inventory_movements_select_policy ON public.inventory_movements;
CREATE POLICY inventory_movements_select_policy ON public.inventory_movements
FOR SELECT TO authenticated
USING (public.get_user_role() IN ('admin', 'manager', 'employee', 'readonly'));

DROP POLICY IF EXISTS inventory_movements_insert_policy ON public.inventory_movements;
CREATE POLICY inventory_movements_insert_policy ON public.inventory_movements
FOR INSERT TO authenticated
WITH CHECK (public.get_user_role() IN ('admin', 'manager'));

DROP POLICY IF EXISTS customers_select_policy ON public.customers;
CREATE POLICY customers_select_policy ON public.customers
FOR SELECT TO authenticated
USING (public.get_user_role() IN ('admin', 'manager', 'employee', 'readonly'));

DROP POLICY IF EXISTS customers_manage_policy ON public.customers;
CREATE POLICY customers_manage_policy ON public.customers
FOR ALL TO authenticated
USING (public.get_user_role() IN ('admin', 'manager'))
WITH CHECK (public.get_user_role() IN ('admin', 'manager'));

DROP POLICY IF EXISTS catalog_items_select_policy ON public.catalog_items;
CREATE POLICY catalog_items_select_policy ON public.catalog_items
FOR SELECT TO authenticated
USING (public.get_user_role() IN ('admin', 'manager', 'employee', 'readonly'));

DROP POLICY IF EXISTS catalog_items_manage_policy ON public.catalog_items;
CREATE POLICY catalog_items_manage_policy ON public.catalog_items
FOR ALL TO authenticated
USING (public.get_user_role() IN ('admin', 'manager'))
WITH CHECK (public.get_user_role() IN ('admin', 'manager'));

DROP POLICY IF EXISTS notifications_select_policy ON public.notifications;
CREATE POLICY notifications_select_policy ON public.notifications
FOR SELECT TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS notifications_update_policy ON public.notifications;
CREATE POLICY notifications_update_policy ON public.notifications
FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS notifications_insert_policy ON public.notifications;
CREATE POLICY notifications_insert_policy ON public.notifications
FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid() OR public.get_user_role() IN ('admin', 'manager')
);

DROP POLICY IF EXISTS system_settings_select_policy ON public.system_settings;
CREATE POLICY system_settings_select_policy ON public.system_settings
FOR SELECT TO authenticated
USING (public.get_user_role() IN ('admin', 'manager', 'employee', 'readonly'));

DROP POLICY IF EXISTS system_settings_update_policy ON public.system_settings;
CREATE POLICY system_settings_update_policy ON public.system_settings
FOR UPDATE TO authenticated
USING (public.get_user_role() = 'admin')
WITH CHECK (public.get_user_role() = 'admin');

DROP POLICY IF EXISTS audit_log_select_policy ON public.audit_log;
CREATE POLICY audit_log_select_policy ON public.audit_log
FOR SELECT TO authenticated
USING (public.get_user_role() = 'admin');

DROP POLICY IF EXISTS audit_log_insert_policy ON public.audit_log;
CREATE POLICY audit_log_insert_policy ON public.audit_log
FOR INSERT TO authenticated
WITH CHECK (public.get_user_role() IN ('admin', 'manager'));
