-- Migration 005: Gestión de Proveedores (SDI-55 / SDI-83 SDI-84)
-- Usa PREPARE/EXECUTE para compatibilidad con MySQL 8 (IF NOT EXISTS no es estándar en ALTER).

-- 1. Tabla de proveedores
CREATE TABLE IF NOT EXISTS proveedores (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  nombre          VARCHAR(255) NOT NULL,
  contacto_nombre VARCHAR(255),
  email           VARCHAR(255),
  telefono        VARCHAR(50),
  direccion       TEXT,
  ruc             VARCHAR(20),
  notas           TEXT,
  estado          ENUM('activo','inactivo') NOT NULL DEFAULT 'activo',
  creado_en       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. SDI-84: Vincular proveedor a entradas de inventario
SET @has_proveedor_id = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'movimientos_inventario' AND COLUMN_NAME = 'proveedor_id'
);
SET @sql = IF(@has_proveedor_id = 0,
  'ALTER TABLE movimientos_inventario ADD COLUMN proveedor_id INT',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_fk_proveedor = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'movimientos_inventario' AND CONSTRAINT_NAME = 'fk_mov_proveedor'
);
SET @sql = IF(@has_fk_proveedor = 0,
  'ALTER TABLE movimientos_inventario ADD CONSTRAINT fk_mov_proveedor FOREIGN KEY (proveedor_id) REFERENCES proveedores(id) ON DELETE SET NULL',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
