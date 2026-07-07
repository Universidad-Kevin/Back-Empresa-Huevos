-- Migration 001: Soft delete para usuarios (SDI-51 / SDI-65)
-- Usa PREPARE/EXECUTE para compatibilidad con MySQL 8 (IF NOT EXISTS no es estándar en ALTER).

SET @has_estado = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'estado'
);
SET @sql = IF(@has_estado = 0,
  'ALTER TABLE usuarios ADD COLUMN estado ENUM(''activo'',''inactivo'') NOT NULL DEFAULT ''activo''',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_actualizado = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'actualizado_en'
);
SET @sql = IF(@has_actualizado = 0,
  'ALTER TABLE usuarios ADD COLUMN actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Sincronizar con el campo `activo` booleano existente
UPDATE usuarios SET estado = CASE WHEN activo = 1 THEN 'activo' ELSE 'inactivo' END;
