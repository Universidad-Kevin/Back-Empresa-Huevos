-- Migration 003: Categorías y Marcas de Productos (SDI-53 / SDI-71)
-- Ejecutar: docker compose exec -T db mysql -uhuevos_user -phuevos_password huevos_organicos < migrations/003_categorias_marcas.sql

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

-- 3. Agregar FKs a productos
ALTER TABLE productos
  ADD COLUMN categoria_id INT,
  ADD COLUMN marca_id INT,
  ADD CONSTRAINT fk_prod_categoria FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_prod_marca     FOREIGN KEY (marca_id)     REFERENCES marcas(id)     ON DELETE SET NULL;

-- 4. Seed de categorías existentes (matching valores actuales en productos)
INSERT IGNORE INTO categorias (nombre) VALUES
  ('standard'), ('premium'), ('especial'), ('gourmet');

-- 5. Vincular productos existentes a las categorías por texto
UPDATE productos p
  JOIN categorias c ON LOWER(p.categoria) = LOWER(c.nombre)
  SET p.categoria_id = c.id
  WHERE p.categoria_id IS NULL;
