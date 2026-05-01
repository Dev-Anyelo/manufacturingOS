-- 010_permissions.sql
-- Granular permission system: per-user module overrides.
-- This table stores exceptions to the role-based defaults.
-- If no row exists for a user+module, the system falls back
-- to the default permissions defined in lib/permissions/constants.ts.

CREATE TABLE IF NOT EXISTS public.user_module_permissions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  module      TEXT NOT NULL,
  can_view    BOOLEAN NOT NULL DEFAULT FALSE,
  can_create  BOOLEAN NOT NULL DEFAULT FALSE,
  can_edit    BOOLEAN NOT NULL DEFAULT FALSE,
  can_delete  BOOLEAN NOT NULL DEFAULT FALSE,
  can_export  BOOLEAN NOT NULL DEFAULT FALSE,
  granted_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_user_module UNIQUE (user_id, module)
);

-- Validate module values against known modules
ALTER TABLE public.user_module_permissions
ADD CONSTRAINT chk_valid_module CHECK (
  module IN (
    'dashboard',
    'inventory',
    'production',
    'sales',
    'orders',
    'customers',
    'catalog',
    'expenses',
    'payroll',
    'reports',
    'settings'
  )
);

-- Index for fast lookups by user_id (used in resolvePermissions)
CREATE INDEX IF NOT EXISTS idx_user_module_permissions_user_id
  ON public.user_module_permissions(user_id);

-- Auto-update updated_at on changes
CREATE TRIGGER trg_user_module_permissions_set_updated_at
  BEFORE UPDATE ON public.user_module_permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_update_updated_at();

-- ─── RLS ────────────────────────────────────────────────────

ALTER TABLE public.user_module_permissions ENABLE ROW LEVEL SECURITY;

-- Admins can read all permission overrides (needed for the admin UI)
DROP POLICY IF EXISTS user_module_permissions_select_policy
  ON public.user_module_permissions;
CREATE POLICY user_module_permissions_select_policy
  ON public.user_module_permissions
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.get_user_role() = 'admin'
  );

-- Only admins can create permission overrides
DROP POLICY IF EXISTS user_module_permissions_insert_policy
  ON public.user_module_permissions;
CREATE POLICY user_module_permissions_insert_policy
  ON public.user_module_permissions
  FOR INSERT TO authenticated
  WITH CHECK (public.get_user_role() = 'admin');

-- Only admins can update permission overrides
DROP POLICY IF EXISTS user_module_permissions_update_policy
  ON public.user_module_permissions;
CREATE POLICY user_module_permissions_update_policy
  ON public.user_module_permissions
  FOR UPDATE TO authenticated
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

-- Only admins can delete permission overrides
DROP POLICY IF EXISTS user_module_permissions_delete_policy
  ON public.user_module_permissions;
CREATE POLICY user_module_permissions_delete_policy
  ON public.user_module_permissions
  FOR DELETE TO authenticated
  USING (public.get_user_role() = 'admin');
