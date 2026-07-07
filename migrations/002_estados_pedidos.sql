-- Migration 002: Estados avanzados de pedidos (SDI-52)
-- Usa PREPARE/EXECUTE para compatibilidad con MySQL 8 (IF NOT EXISTS no es estándar en ALTER).

-- 1. Ampliar el ENUM de estados
ALTER TABLE pedidos
  MODIFY COLUMN estado ENUM('pendiente','confirmado','preparando','enviado','entregado','cancelado','devuelto') NOT NULL DEFAULT 'pendiente';

-- 2. Renombrar estados legacy a los nuevos nombres
UPDATE pedidos SET estado = 'preparando' WHERE estado = 'procesando';
UPDATE pedidos SET estado = 'entregado'  WHERE estado = 'completado';

-- 3. Columnas auxiliares
SET @has_codigo = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pedidos' AND COLUMN_NAME = 'codigo_verificacion'
);
SET @sql = IF(@has_codigo = 0,
  'ALTER TABLE pedidos ADD COLUMN codigo_verificacion VARCHAR(20) UNIQUE',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_motivo = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pedidos' AND COLUMN_NAME = 'motivo_cancelacion'
);
SET @sql = IF(@has_motivo = 0,
  'ALTER TABLE pedidos ADD COLUMN motivo_cancelacion TEXT',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
