-- SDI-220: Agrega columna password_changed_at para invalidar tokens
-- al cambiar contraseña. El middleware verifica jwt.iat < password_changed_at.

ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS password_changed_at DATETIME NULL DEFAULT NULL
  AFTER password;

-- En clientes la columna puede no existir si la migración 015/018 falló en algún entorno
SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema = DATABASE()
     AND table_name = 'clientes'
     AND column_name = 'password_changed_at') = 0,
  'ALTER TABLE clientes ADD COLUMN password_changed_at DATETIME NULL DEFAULT NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
