-- Migration 001: Soft delete para usuarios (SDI-51 / SDI-65)
-- Ejecutar una sola vez contra la base de datos existente.
-- Si usas Docker: docker exec -i <container_db> mysql -uhuevos_user -phuevos_password huevos_organicos < migrations/001_soft_delete_usuarios.sql

ALTER TABLE usuarios
  ADD COLUMN estado ENUM('activo','inactivo') NOT NULL DEFAULT 'activo',
  ADD COLUMN actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Sincronizar con el campo `activo` booleano existente
UPDATE usuarios SET estado = CASE WHEN activo = 1 THEN 'activo' ELSE 'inactivo' END;
