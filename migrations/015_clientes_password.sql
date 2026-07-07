-- Agrega columna password a clientes solo si no existe (MySQL compatible, sin IF NOT EXISTS).

SET @has_password = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'clientes' AND COLUMN_NAME = 'password'
);
SET @sql = IF(@has_password = 0,
  'ALTER TABLE clientes ADD COLUMN password VARCHAR(255) NULL AFTER email',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
