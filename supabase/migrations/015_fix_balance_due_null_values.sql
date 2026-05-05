-- 015_fix_balance_due_null_values.sql
-- Fix null balance_due values in sales table after dropping generated expression

-- Update any null balance_due values with the calculated value
UPDATE public.sales
SET balance_due = total - discount - amount_paid
WHERE balance_due IS NULL;

-- Ensure no null values remain (set to 0 if calculation results in null)
UPDATE public.sales
SET balance_due = 0
WHERE balance_due IS NULL;