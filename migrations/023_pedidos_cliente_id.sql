-- SDI-258: Columna cliente_id en pedidos para soporte de pedidos B2B (mayoristas)
-- Permite asociar un pedido a un cliente mayorista (tabla clientes) además del usuario normal.
-- Usa PREPARE/EXECUTE para compatibilidad con MySQL 8 (IF NOT EXISTS no es estándar en ALTER).
SET @col_exists = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME   = 'pedidos'
    AND COLUMN_NAME  = 'cliente_id'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE pedidos ADD COLUMN cliente_id INT NULL AFTER usuario_id',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
