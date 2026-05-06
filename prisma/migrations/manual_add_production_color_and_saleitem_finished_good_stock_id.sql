-- MIGRACIÓN: Agrega color a ProductionSessionItem y finishedGoodStockId a SaleItem
-- 1. Agrega columna color en production_session_items.
ALTER TABLE IF EXISTS "production_session_items"
ADD COLUMN IF NOT EXISTS "color" TEXT;

-- 2. Agrega columna finished_good_stock_id en sale_items y su constraint.
ALTER TABLE IF EXISTS "sale_items"
ADD COLUMN IF NOT EXISTS "finished_good_stock_id" UUID;

DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'sale_items_finished_good_stock_id_fkey'
	) THEN
		ALTER TABLE "sale_items"
		ADD CONSTRAINT "sale_items_finished_good_stock_id_fkey"
		FOREIGN KEY ("finished_good_stock_id")
		REFERENCES "finished_good_stock"("id") ON DELETE SET NULL;
	END IF;
END;
$$;
