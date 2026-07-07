-- Migration 003: Categorías y Marcas de Productos (SDI-53 / SDI-71)
-- Usa PREPARE/EXECUTE para compatibilidad con MySQL 8 (IF NOT EXISTS no es estándar en ALTER).

-- 1. Crear tabla categorias
CREATE TABLE IF NOT EXISTS categorias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  descripcion TEXT,
  color VARCHAR(7) DEFAULT '#6c757d',
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Crear tabla marcas
CREATE TABLE IF NOT EXISTS marcas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  descripcion TEXT,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Agregar columnas FK a productos
SET @has_categoria_id = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'productos' AND COLUMN_NAME = 'categoria_id'
);
SET @sql = IF(@has_categoria_id = 0,
  'ALTER TABLE productos ADD COLUMN categoria_id INT',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_marca_id = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'productos' AND COLUMN_NAME = 'marca_id'
);
SET @sql = IF(@has_marca_id = 0,
  'ALTER TABLE productos ADD COLUMN marca_id INT',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_fk_categoria = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'productos' AND CONSTRAINT_NAME = 'fk_prod_categoria'
);
SET @sql = IF(@has_fk_categoria = 0,
  'ALTER TABLE productos ADD CONSTRAINT fk_prod_categoria FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_fk_marca = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'productos' AND CONSTRAINT_NAME = 'fk_prod_marca'
);
SET @sql = IF(@has_fk_marca = 0,
  'ALTER TABLE productos ADD CONSTRAINT fk_prod_marca FOREIGN KEY (marca_id) REFERENCES marcas(id) ON DELETE SET NULL',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 4. Seed de categorías existentes (matching valores actuales en productos)
INSERT IGNORE INTO categorias (nombre) VALUES
  ('standard'), ('premium'), ('especial'), ('gourmet');

-- 5. Vincular productos existentes a las categorías por texto
UPDATE productos p
  JOIN categorias c ON LOWER(p.categoria) = LOWER(c.nombre)
  SET p.categoria_id = c.id
  WHERE p.categoria_id IS NULL;
