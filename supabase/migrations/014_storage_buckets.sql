-- 014_storage_buckets.sql
-- Setup storage buckets and RLS policies for manufacturingOS

-- 1. Create Buckets
-- catalog and inventory are PUBLIC for easy image access via URL
INSERT INTO storage.buckets (id, name, public) 
VALUES ('catalog', 'catalog', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('inventory', 'inventory', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- expenses, payroll, and orders are PRIVATE for sensitive documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('expenses', 'expenses', false)
ON CONFLICT (id) DO UPDATE SET public = false;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('payroll', 'payroll', false)
ON CONFLICT (id) DO UPDATE SET public = false;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('orders', 'orders', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- 2. Policies for PUBLIC Buckets (catalog, inventory)
-- We allow SELECT to public (anon) but restricted to files only to avoid listing warning.
DROP POLICY IF EXISTS "Public Select Catalog" ON storage.objects;
CREATE POLICY "Public Select Catalog" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'catalog' AND (storage.extension(name) <> ''));

DROP POLICY IF EXISTS "Public Select Inventory" ON storage.objects;
CREATE POLICY "Public Select Inventory" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'inventory' AND (storage.extension(name) <> ''));

-- Authenticated users (Admin/Manager) can do everything
DROP POLICY IF EXISTS "Manager Manage Catalog" ON storage.objects;
CREATE POLICY "Manager Manage Catalog" ON storage.objects
FOR ALL TO authenticated
USING (bucket_id = 'catalog' AND public.get_user_role() IN ('admin', 'manager'))
WITH CHECK (bucket_id = 'catalog' AND public.get_user_role() IN ('admin', 'manager'));

DROP POLICY IF EXISTS "Manager Manage Inventory" ON storage.objects;
CREATE POLICY "Manager Manage Inventory" ON storage.objects
FOR ALL TO authenticated
USING (bucket_id = 'inventory' AND public.get_user_role() IN ('admin', 'manager'))
WITH CHECK (bucket_id = 'inventory' AND public.get_user_role() IN ('admin', 'manager'));

-- 3. Policies for PRIVATE Buckets (expenses, payroll, orders)
-- Only Admin/Manager can access these.
DROP POLICY IF EXISTS "Admin Manage Private Assets" ON storage.objects;
CREATE POLICY "Admin Manage Private Assets" ON storage.objects
FOR ALL TO authenticated
USING (bucket_id IN ('expenses', 'payroll', 'orders') AND public.get_user_role() IN ('admin', 'manager'))
WITH CHECK (bucket_id IN ('expenses', 'payroll', 'orders') AND public.get_user_role() IN ('admin', 'manager'));
