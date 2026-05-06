-- MIGRACIÓN DE DATOS: Normaliza color vacío a null en finished_good_stock.
UPDATE "finished_good_stock"
SET "color" = NULL
WHERE "color" = '';
