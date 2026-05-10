-- 018_add_attendance_to_permissions_constraint.sql
-- Update the chk_valid_module constraint to include the 'attendance' module.

ALTER TABLE public.user_module_permissions
DROP CONSTRAINT IF EXISTS chk_valid_module;

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
    'attendance',
    'reports',
    'settings'
  )
);
