-- SDI-220: Agrega columna password_changed_at para invalidar tokens
-- al cambiar contraseña. El middleware verifica jwt.iat < password_changed_at.

SET @sql_usuarios = IF(
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema = DATABASE()
     AND table_name = 'usuarios'
     AND column_name = 'password_changed_at') = 0,
  'ALTER TABLE usuarios ADD COLUMN password_changed_at DATETIME NULL DEFAULT NULL AFTER password',
  'SELECT 1'
);
PREPARE stmt_usuarios FROM @sql_usuarios;
EXECUTE stmt_usuarios;
DEALLOCATE PREPARE stmt_usuarios;

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
