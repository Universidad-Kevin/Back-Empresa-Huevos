-- SDI-271: Dirección de entrega en pedidos
-- Permite al cliente indicar dónde entregar sin depender del perfil.
-- Usa PREPARE/EXECUTE para compatibilidad con MySQL 8 (IF NOT EXISTS no es estándar en ALTER).

SET @has_calle = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pedidos' AND COLUMN_NAME = 'dir_calle'
);
SET @sql = IF(@has_calle = 0,
  'ALTER TABLE pedidos ADD COLUMN dir_calle VARCHAR(200) NULL AFTER nota',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_dist = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pedidos' AND COLUMN_NAME = 'dir_distrito'
);
SET @sql = IF(@has_dist = 0,
  'ALTER TABLE pedidos ADD COLUMN dir_distrito VARCHAR(100) NULL AFTER dir_calle',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_ref = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pedidos' AND COLUMN_NAME = 'dir_referencia'
);
SET @sql = IF(@has_ref = 0,
  'ALTER TABLE pedidos ADD COLUMN dir_referencia VARCHAR(200) NULL AFTER dir_distrito',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
