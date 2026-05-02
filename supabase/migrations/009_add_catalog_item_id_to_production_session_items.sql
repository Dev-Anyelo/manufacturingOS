-- 009_add_catalog_item_id_to_production_session_items.sql
-- Adds missing catalog_item_id FK expected by Prisma model ProductionSessionItem.

ALTER TABLE public.production_session_items
ADD COLUMN IF NOT EXISTS catalog_item_id UUID REFERENCES public.catalog_items(id) ON DELETE SET NULL;
