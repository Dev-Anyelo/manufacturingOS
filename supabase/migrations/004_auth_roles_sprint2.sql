-- 004_auth_roles_sprint2.sql
-- Sprint 2: auth profile bootstrap + role enforcement refinements.

-- Allow authenticated users to create their own profile row when needed.
DROP POLICY IF EXISTS profiles_insert_policy ON public.profiles;
CREATE POLICY profiles_insert_policy ON public.profiles
FOR INSERT TO authenticated
WITH CHECK (id = auth.uid());

-- Allow admins to manage profile lifecycle (except auth.users ownership).
DROP POLICY IF EXISTS profiles_admin_manage_policy ON public.profiles;
CREATE POLICY profiles_admin_manage_policy ON public.profiles
FOR ALL TO authenticated
USING (public.get_user_role() = 'admin')
WITH CHECK (public.get_user_role() = 'admin');

-- Ensure system settings can be created only by admins.
DROP POLICY IF EXISTS system_settings_insert_policy ON public.system_settings;
CREATE POLICY system_settings_insert_policy ON public.system_settings
FOR INSERT TO authenticated
WITH CHECK (public.get_user_role() = 'admin');

-- Auto-create profile rows when a new auth user is created.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
      NULLIF(NEW.raw_user_meta_data->>'name', ''),
      split_part(NEW.email, '@', 1)
    ),
    'employee'
  )
  ON CONFLICT (id)
  DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    updated_at = NOW();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill profile rows for existing auth users without profile.
INSERT INTO public.profiles (id, full_name, role)
SELECT
  u.id,
  COALESCE(
    NULLIF(u.raw_user_meta_data->>'full_name', ''),
    NULLIF(u.raw_user_meta_data->>'name', ''),
    split_part(u.email, '@', 1)
  ) AS full_name,
  'employee'::user_role
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;
