-- Migration 004: Sistema de Inventario (SDI-54 / SDI-75)
-- Ejecutar: docker compose exec -T db mysql -uhuevos_user -phuevos_password huevos_organicos < migrations/004_inventario.sql

-- 1. Columnas de inventario en productos
ALTER TABLE productos
  ADD COLUMN IF NOT EXISTS stock_minimo INT NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS ultima_alerta_stock_en TIMESTAMP NULL;

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
