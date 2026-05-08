-- Migration: Add profile fields (address, birth_date) and make document_id required
-- Date: 2026-05-08
-- Fase 0 del plan de implementación de /settings/users/[id]

-- ============================================================
-- Step 0.2a: Safety — fix NULL document_id values BEFORE schema change
-- ============================================================

-- 1. Check which employees have NULL document_id
-- SELECT id, full_name FROM employees WHERE document_id IS NULL;

-- 2. Set a placeholder value for any NULL records
UPDATE employees SET document_id = 'PENDIENTE' WHERE document_id IS NULL;

-- ============================================================
-- Step 0.1: Add new fields to profiles table
-- ============================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS birth_date DATE;

-- ============================================================
-- Step 0.2b: Make document_id NOT NULL in employees table
-- ============================================================

ALTER TABLE employees ALTER COLUMN document_id SET NOT NULL;
