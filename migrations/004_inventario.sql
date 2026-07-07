-- Migration 004: Sistema de Inventario (SDI-54 / SDI-75)
-- Usa PREPARE/EXECUTE para compatibilidad con MySQL 8 (IF NOT EXISTS no es estándar en ALTER).

-- 1. Columnas de inventario en productos
SET @has_stock_minimo = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'productos' AND COLUMN_NAME = 'stock_minimo'
);
SET @sql = IF(@has_stock_minimo = 0,
  'ALTER TABLE productos ADD COLUMN stock_minimo INT NOT NULL DEFAULT 5',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_ultima_alerta = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'productos' AND COLUMN_NAME = 'ultima_alerta_stock_en'
);
SET @sql = IF(@has_ultima_alerta = 0,
  'ALTER TABLE productos ADD COLUMN ultima_alerta_stock_en TIMESTAMP NULL',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2. Tabla de movimientos (Kardex)
CREATE TABLE IF NOT EXISTS movimientos_inventario (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  producto_id  INT NOT NULL,
  tipo         ENUM('entrada','salida','ajuste','pedido','devolucion','cancelacion') NOT NULL,
  cantidad     INT NOT NULL COMMENT 'Positivo = ingreso, Negativo = salida',
  stock_anterior INT NOT NULL,
  stock_nuevo  INT NOT NULL,
  motivo       TEXT,
  pedido_id    INT,
  usuario_id   INT,
  creado_en    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
  FOREIGN KEY (pedido_id)   REFERENCES pedidos(id)   ON DELETE SET NULL,
  FOREIGN KEY (usuario_id)  REFERENCES usuarios(id)  ON DELETE SET NULL,
  INDEX idx_producto (producto_id),
  INDEX idx_creado   (creado_en)
);
