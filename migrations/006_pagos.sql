-- SDI-56: Sistema de Pagos
-- Ejecutar: docker compose exec -T db mysql -uhuevos_user -phuevos_password huevos_organicos < migrations/006_pagos.sql

-- Ampliar métodos de pago en pedidos para incluir Yape y Plin
ALTER TABLE pedidos
  MODIFY COLUMN metodo_pago ENUM('efectivo','yape','plin','transferencia','tarjeta') NOT NULL DEFAULT 'efectivo';

-- Tabla principal de pagos
CREATE TABLE IF NOT EXISTS pagos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pedido_id INT NOT NULL,
  metodo ENUM('efectivo','yape','plin','transferencia','tarjeta') NOT NULL,
  estado ENUM('pendiente','verificado','rechazado','reembolsado') NOT NULL DEFAULT 'pendiente',
  monto DECIMAL(10,2) NOT NULL,
  voucher MEDIUMTEXT NULL,
  notas_admin TEXT NULL,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE
);
