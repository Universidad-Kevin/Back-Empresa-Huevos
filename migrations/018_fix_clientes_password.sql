-- 018_fix_clientes_password.sql
-- Agrega columna password a clientes solo si no existe (MySQL compatible, sin IF NOT EXISTS).
-- Luego inserta el cliente mayorista de prueba si no existe.

SET @cnt = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'clientes' AND COLUMN_NAME = 'password');
SET @sql = IF(@cnt = 0,
  'ALTER TABLE clientes ADD COLUMN password VARCHAR(255) NULL AFTER email',
  'SELECT 1');
PREPARE addpwd FROM @sql;
EXECUTE addpwd;
DEALLOCATE PREPARE addpwd;

INSERT IGNORE INTO clientes (nombre_empresa, tipo_negocio, contacto_nombre, email, password, tipo_cliente, estado)
VALUES ('Distribuidora Kevin', 'Distribuidora', 'Kevin Mayorista', 'kevin2005tenorio@gmail.com',
        '$2a$10$Pmh2ND9a7gpKbWNrFYa5reETkUq24mHLLj/oCR5C6T5UVN6Y2S/fq', 'Mayorista', 'activo');
