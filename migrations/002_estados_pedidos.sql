-- Migration 002: Estados avanzados de pedidos (SDI-52)
-- Ejecutar: docker compose exec -T db mysql -uhuevos_user -phuevos_password huevos_organicos < migrations/002_estados_pedidos.sql

-- 1. Ampliar el ENUM de estados
ALTER TABLE pedidos
  MODIFY COLUMN estado ENUM('pendiente','confirmado','preparando','enviado','entregado','cancelado','devuelto') NOT NULL DEFAULT 'pendiente';

-- 2. Renombrar estados legacy a los nuevos nombres
UPDATE pedidos SET estado = 'preparando' WHERE estado = 'procesando';
UPDATE pedidos SET estado = 'entregado'  WHERE estado = 'completado';

-- 3. Columnas auxiliares (puede que ya existan en tu BD — ignorar errores de duplicado)
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS codigo_verificacion VARCHAR(20) UNIQUE;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS motivo_cancelacion TEXT;
