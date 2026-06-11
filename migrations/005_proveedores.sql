-- Migration 005: Gestión de Proveedores (SDI-55 / SDI-83 SDI-84)
-- Ejecutar: docker compose exec -T db mysql -uhuevos_user -phuevos_password huevos_organicos < migrations/005_proveedores.sql

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
ALTER TABLE movimientos_inventario
  ADD COLUMN IF NOT EXISTS proveedor_id INT,
  ADD CONSTRAINT fk_mov_proveedor FOREIGN KEY (proveedor_id) REFERENCES proveedores(id) ON DELETE SET NULL;
